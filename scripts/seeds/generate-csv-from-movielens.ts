import { createReadStream } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

const ROOT_DIR = process.cwd();
const MOVIELENS_DIR = path.join(ROOT_DIR, "ml-latest");
const SEED_DIR = path.join(ROOT_DIR, "data", "seeds", "movie-catalog");
const GENERATED_DIR = path.join(SEED_DIR, "generated");
const CACHE_DIR = path.join(SEED_DIR, "cache");
const REPORTS_DIR = path.join(SEED_DIR, "reports");
const TARGET_MOVIE_COUNT = 3000;
const CONCURRENCY = 6;
const NULL_VALUE = "\\N";
const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";

type RatingStats = {
  count: number;
  sum: number;
};

type LinkRow = {
  movielensId: number;
  tmdbId: number;
};

type Candidate = {
  movielensId: number;
  tmdbId: number;
  popularityRank: number;
  popularity: number;
  ratingCount: number;
  ratingAverage: number;
};

type TmdbGenre = {
  id: number;
  name: string;
};

type TmdbMovieDetail = {
  id: number;
  title?: string;
  original_title?: string;
  overview?: string;
  release_date?: string;
  runtime?: number | null;
  original_language?: string | null;
  production_countries?: Array<{ iso_3166_1?: string }>;
  poster_path?: string | null;
  backdrop_path?: string | null;
  adult?: boolean;
  genres?: TmdbGenre[];
};

type TmdbDiscoverMovie = {
  id: number;
  popularity?: number;
};

type TmdbDiscoverResponse = {
  page?: number;
  total_pages?: number;
  results?: TmdbDiscoverMovie[];
};

type TmdbVideo = {
  key?: string;
  site?: string;
  type?: string;
  official?: boolean;
};

type SelectedMovie = {
  candidate: Candidate;
  koDetail: TmdbMovieDetail;
  videos: TmdbVideo[];
};

type ExclusionReason =
  | "missing_tmdb_id"
  | "duplicate_tmdb_id"
  | "missing_rating"
  | "tmdb_detail_failed"
  | "missing_poster_path"
  | "missing_overview";

type Report = {
  generatedAt: string;
  targetMovieCount: number;
  selectedMovieCount: number;
  inputCounts: {
    links: number;
    ratingsMovies: number;
    discoverPages: number;
    discoverMovies: number;
    candidatesBeforeTmdb: number;
  };
  selectedPopularityRankRangeCounts: Record<string, number>;
  exclusionCounts: Record<ExclusionReason, number>;
  duplicateTmdbIds: number[];
  tmdbFailures: Array<{ movielensId: number; tmdbId: number; message: string }>;
  outputRows?: {
    movies: number;
    genres: number;
    movieGenres: number;
  };
  validation?: {
    ok: boolean;
    errors: string[];
  };
};

class TmdbRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

function increment<T extends string | number>(map: Map<T, number>, key: T, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDirectories() {
  await mkdir(GENERATED_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });
  await mkdir(REPORTS_DIR, { recursive: true });
}

async function loadEnvFiles() {
  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(ROOT_DIR, fileName);
    let text: string;

    try {
      text = await readFile(filePath, "utf8");
    } catch {
      continue;
    }

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#")) {
        continue;
      }

      const equalsIndex = line.indexOf("=");

      if (equalsIndex === -1) {
        continue;
      }

      const key = line.slice(0, equalsIndex).trim();
      let value = line.slice(equalsIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(value);
      value = "";
    } else {
      value += char;
    }
  }

  cells.push(value);
  return cells;
}

function stringifyCsvValue(value: string | number | boolean | null): string {
  const normalized = value === null ? NULL_VALUE : String(value);

  if (
    normalized.includes(",") ||
    normalized.includes('"') ||
    normalized.includes("\n") ||
    normalized.includes("\r")
  ) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }

  return normalized;
}

function stringifyCsv(rows: Array<Array<string | number | boolean | null>>) {
  return `${rows.map((row) => row.map(stringifyCsvValue).join(",")).join("\n")}\n`;
}

async function writeCsvAtomic(
  fileName: string,
  rows: Array<Array<string | number | boolean | null>>,
) {
  const filePath = path.join(GENERATED_DIR, fileName);
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, stringifyCsv(rows), "utf8");
  await rename(tempPath, filePath);
}

async function readCsvLines(filePath: string, onRow: (row: string[]) => void | Promise<void>) {
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const reader = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let isHeader = true;

  for await (const line of reader) {
    if (isHeader) {
      isHeader = false;
      continue;
    }

    if (!line) {
      continue;
    }

    await onRow(parseCsvLine(line));
  }
}

async function loadLinks(report: Report) {
  const links: LinkRow[] = [];
  const tmdbIdCounts = new Map<number, number>();
  const linksPath = path.join(MOVIELENS_DIR, "links.csv");

  await readCsvLines(linksPath, ([movielensIdValue, , tmdbIdValue]) => {
    report.inputCounts.links += 1;

    if (!tmdbIdValue) {
      report.exclusionCounts.missing_tmdb_id += 1;
      return;
    }

    const movielensId = Number(movielensIdValue);
    const tmdbId = Number(tmdbIdValue);

    if (!Number.isFinite(movielensId) || !Number.isFinite(tmdbId)) {
      report.exclusionCounts.missing_tmdb_id += 1;
      return;
    }

    links.push({ movielensId, tmdbId });
    increment(tmdbIdCounts, tmdbId);
  });

  const duplicateTmdbIds = [...tmdbIdCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([tmdbId]) => tmdbId)
    .sort((a, b) => a - b);

  report.duplicateTmdbIds = duplicateTmdbIds;
  report.exclusionCounts.duplicate_tmdb_id = links.filter((link) =>
    duplicateTmdbIds.includes(link.tmdbId),
  ).length;

  const duplicateTmdbIdSet = new Set(duplicateTmdbIds);
  return links.filter((link) => !duplicateTmdbIdSet.has(link.tmdbId));
}

async function loadRatingStats(report: Report) {
  const ratings = new Map<number, RatingStats>();
  const ratingsPath = path.join(MOVIELENS_DIR, "ratings.csv");

  await readCsvLines(ratingsPath, ([, movieIdValue, ratingValue]) => {
    const movieId = Number(movieIdValue);
    const rating = Number(ratingValue);

    if (!Number.isFinite(movieId) || !Number.isFinite(rating)) {
      return;
    }

    const stats = ratings.get(movieId) ?? { count: 0, sum: 0 };
    stats.count += 1;
    stats.sum += rating;
    ratings.set(movieId, stats);
  });

  report.inputCounts.ratingsMovies = ratings.size;
  return ratings;
}

async function loadDiscoverPage(page: number, token: string) {
  const query = new URLSearchParams({
    include_adult: "true",
    include_video: "false",
    language: "ko-KR",
    page: String(page),
    sort_by: "popularity.desc",
  });

  return getCachedTmdbJson<TmdbDiscoverResponse>(
    path.join("discover-movie", `popularity-desc-adult-page-${page}.ko-KR.json`),
    `/discover/movie?${query.toString()}`,
    token,
  );
}

async function createCandidates(
  links: LinkRow[],
  ratingStats: Map<number, RatingStats>,
  token: string,
  report: Report,
) {
  const linkByTmdbId = new Map(links.map((link) => [link.tmdbId, link]));
  const candidates: Candidate[] = [];
  const seenTmdbIds = new Set<number>();
  let page = 1;
  let totalPages = 1;
  let popularityRank = 0;

  while (page <= totalPages) {
    const discoverPage = await loadDiscoverPage(page, token);
    const results = discoverPage.results ?? [];

    report.inputCounts.discoverPages += 1;
    report.inputCounts.discoverMovies += results.length;
    totalPages = Math.min(discoverPage.total_pages ?? page, 500);

    for (const movie of results) {
      popularityRank += 1;

      if (!Number.isFinite(movie.id) || seenTmdbIds.has(movie.id)) {
        continue;
      }

      seenTmdbIds.add(movie.id);
      const link = linkByTmdbId.get(movie.id);

      if (!link) {
        continue;
      }

      const rating = ratingStats.get(link.movielensId);

      if (!rating || rating.count < 1) {
        report.exclusionCounts.missing_rating += 1;
        continue;
      }

      candidates.push({
        movielensId: link.movielensId,
        tmdbId: link.tmdbId,
        popularityRank,
        popularity: movie.popularity ?? 0,
        ratingCount: rating.count,
        ratingAverage: rating.sum / rating.count,
      });
    }

    if (page % 25 === 0) {
      console.log(
        `TMDB discover pages loaded: ${page}/${totalPages}, candidates: ${candidates.length}`,
      );
    }

    page += 1;
  }

  candidates.sort((a, b) => {
    if (a.popularityRank !== b.popularityRank) {
      return a.popularityRank - b.popularityRank;
    }

    if (b.popularity !== a.popularity) {
      return b.popularity - a.popularity;
    }

    if (b.ratingCount !== a.ratingCount) {
      return b.ratingCount - a.ratingCount;
    }

    if (b.ratingAverage !== a.ratingAverage) {
      return b.ratingAverage - a.ratingAverage;
    }

    return a.movielensId - b.movielensId;
  });

  report.inputCounts.candidatesBeforeTmdb = candidates.length;
  return candidates;
}

async function readCache<T>(cachePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(cachePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function getRetryDelayMs(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after");

  if (retryAfter) {
    const seconds = Number(retryAfter);

    if (Number.isFinite(seconds)) {
      return seconds * 1000;
    }

    const retryDate = Date.parse(retryAfter);

    if (Number.isFinite(retryDate)) {
      return Math.max(0, retryDate - Date.now());
    }
  }

  return Math.min(30000, 500 * 2 ** attempt);
}

async function fetchTmdbJson<T>(endpoint: string, token: string): Promise<T> {
  const url = `${TMDB_API_BASE_URL}${endpoint}`;
  let lastError: unknown;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return (await response.json()) as T;
      }

      if (response.status === 429 || response.status >= 500) {
        await sleep(getRetryDelayMs(response, attempt));
        continue;
      }

      throw new TmdbRequestError(`TMDB request failed with status ${response.status}`, response.status);
    } catch (error) {
      lastError = error;

      if (error instanceof TmdbRequestError && error.status && error.status < 500) {
        throw error;
      }

      await sleep(Math.min(30000, 500 * 2 ** attempt));
    }
  }

  throw new TmdbRequestError(
    lastError instanceof Error ? lastError.message : "TMDB request failed after retries",
  );
}

async function getCachedTmdbJson<T>(cacheRelativePath: string, endpoint: string, token: string) {
  const cachePath = path.join(CACHE_DIR, "tmdb", cacheRelativePath);
  const cached = await readCache<T>(cachePath);

  if (cached) {
    return cached;
  }

  const data = await fetchTmdbJson<T>(endpoint, token);
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, JSON.stringify(data, null, 2), "utf8");
  return data;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

function hasOverview(detail: TmdbMovieDetail) {
  return Boolean(detail.overview?.trim());
}

async function validateCandidate(
  candidate: Candidate,
  token: string,
): Promise<{ selected?: SelectedMovie; reason?: ExclusionReason; message?: string }> {
  try {
    const koDetail = await getCachedTmdbJson<TmdbMovieDetail>(
      path.join("movie-details", `${candidate.tmdbId}.ko-KR.json`),
      `/movie/${candidate.tmdbId}?language=ko-KR`,
      token,
    );

    if (!koDetail.poster_path) {
      return { reason: "missing_poster_path" };
    }

    if (!hasOverview(koDetail)) {
      return { reason: "missing_overview" };
    }

    const videoResponse = await getCachedTmdbJson<{ results?: TmdbVideo[] }>(
      path.join("movie-videos", `${candidate.tmdbId}.en-US.json`),
      `/movie/${candidate.tmdbId}/videos?language=en-US`,
      token,
    );

    return {
      selected: {
        candidate,
        koDetail,
        videos: videoResponse.results ?? [],
      },
    };
  } catch (error) {
    return {
      reason: "tmdb_detail_failed",
      message: error instanceof Error ? error.message : "Unknown TMDB error",
    };
  }
}

async function selectMovies(candidates: Candidate[], token: string, report: Report) {
  const selected: SelectedMovie[] = [];
  const batchSize = CONCURRENCY * 4;

  for (let start = 0; start < candidates.length && selected.length < TARGET_MOVIE_COUNT; start += batchSize) {
    const batch = candidates.slice(start, start + batchSize);
    const results = await mapWithConcurrency(batch, CONCURRENCY, (candidate) =>
      validateCandidate(candidate, token),
    );

    for (let index = 0; index < results.length && selected.length < TARGET_MOVIE_COUNT; index += 1) {
      const result = results[index];
      const candidate = batch[index];

      if (result.selected) {
        selected.push(result.selected);
        const rankRange = `${Math.floor((candidate.popularityRank - 1) / 1000) * 1000 + 1}-${Math.ceil(
          candidate.popularityRank / 1000,
        ) * 1000}`;
        report.selectedPopularityRankRangeCounts[rankRange] =
          (report.selectedPopularityRankRangeCounts[rankRange] ?? 0) + 1;
      } else if (result.reason) {
        report.exclusionCounts[result.reason] += 1;

        if (result.reason === "tmdb_detail_failed") {
          report.tmdbFailures.push({
            movielensId: candidate.movielensId,
            tmdbId: candidate.tmdbId,
            message: result.message ?? "TMDB request failed",
          });
        }
      }
    }

    if (start > 0 && start % 240 === 0) {
      console.log(`TMDB candidates checked: ${start + batch.length}, selected: ${selected.length}`);
    }
  }

  return selected;
}

function getReleaseYear(releaseDate: string | null) {
  if (!releaseDate) {
    return null;
  }

  const year = Number(releaseDate.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function getProductionCountries(detail: TmdbMovieDetail) {
  return JSON.stringify(
    (detail.production_countries ?? [])
      .map((country) => country.iso_3166_1)
      .filter((country): country is string => Boolean(country)),
  );
}

function getTrailerUrl(videos: TmdbVideo[]) {
  const youtubeTrailers = videos.filter(
    (video) => video.site === "YouTube" && video.type === "Trailer" && video.key,
  );
  const officialTrailer = youtubeTrailers.find((video) => video.official);
  const trailer = officialTrailer ?? youtubeTrailers[0];

  return trailer?.key ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
}

function getMovieGenres(selectedMovie: SelectedMovie) {
  return selectedMovie.koDetail.genres ?? [];
}

async function loadGenreNames(token: string) {
  const [enGenres, koGenres] = await Promise.all([
    getCachedTmdbJson<{ genres?: TmdbGenre[] }>(
      path.join("genres", "en-US.json"),
      "/genre/movie/list?language=en-US",
      token,
    ),
    getCachedTmdbJson<{ genres?: TmdbGenre[] }>(
      path.join("genres", "ko-KR.json"),
      "/genre/movie/list?language=ko-KR",
      token,
    ),
  ]);

  return {
    en: new Map((enGenres.genres ?? []).map((genre) => [genre.id, genre.name])),
    ko: new Map((koGenres.genres ?? []).map((genre) => [genre.id, genre.name])),
  };
}

function buildCsvRows(selectedMovies: SelectedMovie[], genreNames: Awaited<ReturnType<typeof loadGenreNames>>) {
  const movieRows: Array<Array<string | number | boolean | null>> = [
    [
      "id",
      "movielens_id",
      "title",
      "original_title",
      "overview",
      "release_date",
      "release_year",
      "runtime",
      "original_language",
      "production_countries",
      "poster_path",
      "backdrop_path",
      "trailer_url",
      "adult",
    ],
  ];
  const genreIds = new Set<number>();
  const movieGenrePairs = new Set<string>();

  for (const selectedMovie of selectedMovies) {
    const { candidate, koDetail, videos } = selectedMovie;
    const releaseDate = koDetail.release_date?.trim() || null;

    movieRows.push([
      candidate.tmdbId,
      candidate.movielensId,
      koDetail.title?.trim() ?? "",
      koDetail.original_title?.trim() || null,
      koDetail.overview?.trim() ?? "",
      releaseDate,
      getReleaseYear(releaseDate),
      koDetail.runtime ?? null,
      koDetail.original_language ?? null,
      getProductionCountries(koDetail),
      koDetail.poster_path ?? "",
      koDetail.backdrop_path ?? null,
      getTrailerUrl(videos),
      koDetail.adult ?? false,
    ]);

    for (const genre of getMovieGenres(selectedMovie)) {
      genreIds.add(genre.id);
      movieGenrePairs.add(`${candidate.tmdbId},${genre.id}`);
    }
  }

  const genreRows: Array<Array<string | number | boolean | null>> = [["id", "name", "name_ko"]];

  for (const genreId of [...genreIds].sort((a, b) => a - b)) {
    const name = genreNames.en.get(genreId) ?? "";
    genreRows.push([genreId, name, genreNames.ko.get(genreId) ?? name]);
  }

  const movieGenreRows: Array<Array<string | number | boolean | null>> = [["movie_id", "genre_id"]];

  for (const pair of [...movieGenrePairs].sort((a, b) => {
    const [movieA, genreA] = a.split(",").map(Number);
    const [movieB, genreB] = b.split(",").map(Number);
    return movieA - movieB || genreA - genreB;
  })) {
    movieGenreRows.push(pair.split(",").map(Number));
  }

  return { movieRows, genreRows, movieGenreRows };
}

function validateRows(rows: ReturnType<typeof buildCsvRows>) {
  const errors: string[] = [];
  const movieRows = rows.movieRows.slice(1);
  const genreRows = rows.genreRows.slice(1);
  const movieGenreRows = rows.movieGenreRows.slice(1);
  const movieIds = new Set<number>();
  const movielensIds = new Set<number>();
  const genreIds = new Set<number>();
  const movieGenrePairs = new Set<string>();

  if (movieRows.length !== TARGET_MOVIE_COUNT) {
    errors.push(`movies row count must be ${TARGET_MOVIE_COUNT}, got ${movieRows.length}`);
  }

  for (const row of movieRows) {
    const movieId = Number(row[0]);
    const movielensId = Number(row[1]);

    if (movieIds.has(movieId)) {
      errors.push(`duplicate movies.id: ${movieId}`);
    }

    if (movielensIds.has(movielensId)) {
      errors.push(`duplicate movies.movielens_id: ${movielensId}`);
    }

    movieIds.add(movieId);
    movielensIds.add(movielensId);

    if (!row[4]) {
      errors.push(`missing overview for movie ${movieId}`);
    }

    if (!row[10]) {
      errors.push(`missing poster_path for movie ${movieId}`);
    }

    try {
      const productionCountries = JSON.parse(String(row[9]));

      if (!Array.isArray(productionCountries)) {
        errors.push(`production_countries must be an array for movie ${movieId}`);
      }
    } catch {
      errors.push(`production_countries must be JSON for movie ${movieId}`);
    }
  }

  for (const row of genreRows) {
    genreIds.add(Number(row[0]));
  }

  for (const row of movieGenreRows) {
    const movieId = Number(row[0]);
    const genreId = Number(row[1]);
    const key = `${movieId},${genreId}`;

    if (!movieIds.has(movieId)) {
      errors.push(`movie_genres movie_id FK missing: ${movieId}`);
    }

    if (!genreIds.has(genreId)) {
      errors.push(`movie_genres genre_id FK missing: ${genreId}`);
    }

    if (movieGenrePairs.has(key)) {
      errors.push(`duplicate movie_genres pair: ${key}`);
    }

    movieGenrePairs.add(key);
  }

  return { ok: errors.length === 0, errors };
}

async function writeReport(report: Report) {
  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(
    path.join(REPORTS_DIR, "selection-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
}

function createInitialReport(): Report {
  return {
    generatedAt: new Date().toISOString(),
    targetMovieCount: TARGET_MOVIE_COUNT,
    selectedMovieCount: 0,
    inputCounts: {
      links: 0,
      ratingsMovies: 0,
      discoverPages: 0,
      discoverMovies: 0,
      candidatesBeforeTmdb: 0,
    },
    selectedPopularityRankRangeCounts: {},
    exclusionCounts: {
      missing_tmdb_id: 0,
      duplicate_tmdb_id: 0,
      missing_rating: 0,
      tmdb_detail_failed: 0,
      missing_poster_path: 0,
      missing_overview: 0,
    },
    duplicateTmdbIds: [],
    tmdbFailures: [],
  };
}

async function cleanupIncompleteCsv() {
  await Promise.all([
    rm(path.join(GENERATED_DIR, "movies_seed.csv"), { force: true }),
    rm(path.join(GENERATED_DIR, "genres_seed.csv"), { force: true }),
    rm(path.join(GENERATED_DIR, "movie_genres_seed.csv"), { force: true }),
  ]);
}

async function main() {
  await loadEnvFiles();
  await ensureDirectories();

  const token = process.env.TMDB_READ_ACCESS_TOKEN;

  if (!token) {
    throw new Error("TMDB_READ_ACCESS_TOKEN is required.");
  }

  const report = createInitialReport();

  console.log("Loading MovieLens links...");
  const links = await loadLinks(report);

  console.log("Aggregating MovieLens ratings...");
  const ratingStats = await loadRatingStats(report);

  console.log("Loading TMDB discover popularity candidates...");
  const candidates = await createCandidates(links, ratingStats, token, report);

  console.log(`Checking TMDB candidates. Candidate count: ${candidates.length}`);
  const selectedMovies = await selectMovies(candidates, token, report);
  report.selectedMovieCount = selectedMovies.length;

  if (selectedMovies.length < TARGET_MOVIE_COUNT) {
    await cleanupIncompleteCsv();
    await writeReport(report);
    throw new Error(
      `Only ${selectedMovies.length} movies satisfy the hard conditions. See data/seeds/movie-catalog/reports/selection-report.json`,
    );
  }

  console.log("Loading TMDB genre names...");
  const genreNames = await loadGenreNames(token);
  const rows = buildCsvRows(selectedMovies, genreNames);
  const validation = validateRows(rows);
  report.validation = validation;
  report.outputRows = {
    movies: rows.movieRows.length - 1,
    genres: rows.genreRows.length - 1,
    movieGenres: rows.movieGenreRows.length - 1,
  };

  if (!validation.ok) {
    await cleanupIncompleteCsv();
    await writeReport(report);
    throw new Error(`Seed validation failed. ${validation.errors.slice(0, 5).join("; ")}`);
  }

  await writeCsvAtomic("genres_seed.csv", rows.genreRows);
  await writeCsvAtomic("movies_seed.csv", rows.movieRows);
  await writeCsvAtomic("movie_genres_seed.csv", rows.movieGenreRows);
  await writeReport(report);

  console.log("Movie catalog seed CSV generated.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
