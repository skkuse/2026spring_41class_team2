import { createReadStream, createWriteStream } from "node:fs";
import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { once } from "node:events";

const ROOT_DIR = process.cwd();
const MOVIELENS_DIR = path.join(ROOT_DIR, "ml-latest");
const MOVIE_CATALOG_GENERATED_DIR = path.join(ROOT_DIR, "data", "seeds", "movie-catalog", "generated");
const SEED_DIR = path.join(ROOT_DIR, "data", "seeds", "movie-recommendation");
const GENERATED_DIR = path.join(SEED_DIR, "generated");
const REPORTS_DIR = path.join(SEED_DIR, "reports");
const TARGET_MOVIE_COUNT = 3000;
const MIN_CO_RATING_COUNT = 30;
const MAX_SIMILAR_MOVIES_PER_SOURCE = 50;
const SCORE_DECIMAL_PLACES = 6;
const AVG_RATING_DECIMAL_PLACES = 2;
const NULL_VALUE = "\\N";

type MovieSeedRow = {
  movieId: number;
  movielensId: number;
};

type RatingStats = {
  count: number;
  sum: number;
};

type UserStats = {
  count: number;
  sum: number;
};

type AdjustedRating = {
  movieIndex: number;
  value: number;
};

type SimilarityCandidate = {
  targetMovieId: number;
  score: number;
  coRatingCount: number;
};

type Report = {
  generatedAt: string;
  parameters: {
    targetMovieCount: number;
    similarityMethod: "adjusted_cosine";
    minCoRatingCount: number;
    minSimilarityScore: number;
    maxSimilarMoviesPerSource: number;
    storeBidirectionalCandidates: boolean;
  };
  inputRows: {
    movies: number;
    selectedRatings: number;
    selectedTags: number;
    genomeTags: number;
    selectedGenomeScores: number;
  };
  outputRows: {
    movieStats: number;
    movieSimilarities: number;
    movieTags: number;
    movieTagRelevances: number;
  };
  similarities: {
    candidatePairsWithMinCoRating: number;
    candidatePairsWithPositiveScore: number;
    sourcesWithAtLeastOneSimilarity: number;
    minRowsPerSource: number;
    maxRowsPerSource: number;
  };
  tagGenome: {
    distinctTags: number;
    moviesWithGenomeScores: number;
  };
  validation: {
    ok: boolean;
    errors: string[];
  };
};

function increment<T extends string | number>(map: Map<T, number>, key: T, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

async function ensureDirectories() {
  await mkdir(GENERATED_DIR, { recursive: true });
  await mkdir(REPORTS_DIR, { recursive: true });
}

async function assertFileExists(filePath: string) {
  try {
    await access(filePath);
  } catch {
    throw new Error(`Required input file does not exist: ${filePath}`);
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

  if (inQuotes) {
    throw new Error("CSV quote is not closed.");
  }

  cells.push(value);
  return cells;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") {
        i += 1;
      }

      row.push(value);
      value = "";

      if (row.length > 1 || row[0] !== "") {
        rows.push(row);
      }

      row = [];
    } else {
      value += char;
    }
  }

  if (inQuotes) {
    throw new Error("CSV quote is not closed.");
  }

  if (value !== "" || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
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

function stringifyCsvRow(row: Array<string | number | boolean | null>) {
  return `${row.map(stringifyCsvValue).join(",")}\n`;
}

function writeLine(stream: NodeJS.WritableStream, line: string) {
  stream.write(line);
}

async function finishWriteStream(stream: NodeJS.WritableStream) {
  stream.end();
  await once(stream, "finish");
}

async function writeCsvAtomic(
  fileName: string,
  writeRows: (stream: NodeJS.WritableStream) => Promise<number>,
) {
  const filePath = path.join(GENERATED_DIR, fileName);
  const tempPath = `${filePath}.tmp`;
  const stream = createWriteStream(tempPath, { encoding: "utf8" });

  try {
    const rowCount = await writeRows(stream);
    await finishWriteStream(stream);
    await rename(tempPath, filePath);
    return rowCount;
  } catch (error) {
    stream.end();
    throw error;
  }
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

function getPairOffset(leftIndex: number, rightIndex: number, movieCount: number) {
  return (leftIndex * (2 * movieCount - leftIndex - 1)) / 2 + (rightIndex - leftIndex - 1);
}

async function loadMovieSeeds(report: Report) {
  const moviesPath = path.join(MOVIE_CATALOG_GENERATED_DIR, "movies_seed.csv");
  const movies: MovieSeedRow[] = [];
  const movieIds = new Set<number>();
  const movielensIds = new Set<number>();
  const rows = parseCsv(await readFile(moviesPath, "utf8"));

  for (const [movieIdValue, movielensIdValue] of rows.slice(1)) {
    const movieId = Number(movieIdValue);
    const movielensId = Number(movielensIdValue);

    if (!Number.isInteger(movieId) || !Number.isInteger(movielensId)) {
      throw new Error(`Invalid movies_seed.csv row: ${movieIdValue},${movielensIdValue}`);
    }

    if (movieIds.has(movieId)) {
      throw new Error(`Duplicate movie_id in movies_seed.csv: ${movieId}`);
    }

    if (movielensIds.has(movielensId)) {
      throw new Error(`Duplicate movielens_id in movies_seed.csv: ${movielensId}`);
    }

    movieIds.add(movieId);
    movielensIds.add(movielensId);
    movies.push({ movieId, movielensId });
  }

  report.inputRows.movies = movies.length;

  if (movies.length !== TARGET_MOVIE_COUNT) {
    throw new Error(`movies_seed.csv must contain ${TARGET_MOVIE_COUNT} rows, got ${movies.length}.`);
  }

  return movies;
}

async function loadRatingInputs(
  movies: MovieSeedRow[],
  report: Report,
) {
  const ratingsPath = path.join(MOVIELENS_DIR, "ratings.csv");
  const movieIndexByMovielensId = new Map<number, number>();
  const movieStats = Array.from<unknown, RatingStats>({ length: movies.length }, () => ({
    count: 0,
    sum: 0,
  }));
  const userStats = new Map<number, UserStats>();

  movies.forEach((movie, index) => {
    movieIndexByMovielensId.set(movie.movielensId, index);
  });

  await readCsvLines(ratingsPath, ([userIdValue, movieIdValue, ratingValue]) => {
    const movieIndex = movieIndexByMovielensId.get(Number(movieIdValue));

    if (movieIndex === undefined) {
      return;
    }

    const userId = Number(userIdValue);
    const rating = Number(ratingValue);

    if (!Number.isInteger(userId) || !Number.isFinite(rating)) {
      return;
    }

    movieStats[movieIndex].count += 1;
    movieStats[movieIndex].sum += rating;

    const stats = userStats.get(userId) ?? { count: 0, sum: 0 };
    stats.count += 1;
    stats.sum += rating;
    userStats.set(userId, stats);
    report.inputRows.selectedRatings += 1;
  });

  const missingRatingMovieIds = movies
    .filter((_, index) => movieStats[index].count === 0)
    .map((movie) => movie.movieId);

  if (missingRatingMovieIds.length > 0) {
    throw new Error(
      `Every selected movie must have at least one MovieLens rating. Missing movie_ids: ${missingRatingMovieIds
        .slice(0, 20)
        .join(", ")}${missingRatingMovieIds.length > 20 ? ", ..." : ""}`,
    );
  }

  return { movieIndexByMovielensId, movieStats, userStats };
}

async function loadUserTagCounts(
  movieIndexByMovielensId: Map<number, number>,
  movieCount: number,
  report: Report,
) {
  const tagsPath = path.join(MOVIELENS_DIR, "tags.csv");
  const userTagCounts = new Uint32Array(movieCount);

  await readCsvLines(tagsPath, ([, movieIdValue]) => {
    const movieIndex = movieIndexByMovielensId.get(Number(movieIdValue));

    if (movieIndex === undefined) {
      return;
    }

    userTagCounts[movieIndex] += 1;
    report.inputRows.selectedTags += 1;
  });

  return userTagCounts;
}

async function accumulateSimilarityPairs(
  movieIndexByMovielensId: Map<number, number>,
  userStats: Map<number, UserStats>,
  movieCount: number,
) {
  const ratingsPath = path.join(MOVIELENS_DIR, "ratings.csv");
  const pairCount = (movieCount * (movieCount - 1)) / 2;
  const numerators = new Float64Array(pairCount);
  const leftSquares = new Float64Array(pairCount);
  const rightSquares = new Float64Array(pairCount);
  const coRatingCounts = new Uint32Array(pairCount);
  let currentUserId: number | null = null;
  let currentUserRatings: AdjustedRating[] = [];
  let previousUserId = -1;

  function flushCurrentUser() {
    if (currentUserRatings.length < 2) {
      currentUserRatings = [];
      return;
    }

    currentUserRatings.sort((a, b) => a.movieIndex - b.movieIndex);

    for (let i = 0; i < currentUserRatings.length - 1; i += 1) {
      const left = currentUserRatings[i];

      for (let j = i + 1; j < currentUserRatings.length; j += 1) {
        const right = currentUserRatings[j];
        const offset = getPairOffset(left.movieIndex, right.movieIndex, movieCount);

        numerators[offset] += left.value * right.value;
        leftSquares[offset] += left.value * left.value;
        rightSquares[offset] += right.value * right.value;
        coRatingCounts[offset] += 1;
      }
    }

    currentUserRatings = [];
  }

  await readCsvLines(ratingsPath, ([userIdValue, movieIdValue, ratingValue]) => {
    const userId = Number(userIdValue);

    if (!Number.isInteger(userId)) {
      return;
    }

    if (userId < previousUserId) {
      throw new Error("ratings.csv must be grouped by userId for similarity generation.");
    }

    if (currentUserId !== null && userId !== currentUserId) {
      flushCurrentUser();
    }

    currentUserId = userId;
    previousUserId = userId;

    const movieIndex = movieIndexByMovielensId.get(Number(movieIdValue));

    if (movieIndex === undefined) {
      return;
    }

    const rating = Number(ratingValue);
    const stats = userStats.get(userId);

    if (!stats || stats.count === 0 || !Number.isFinite(rating)) {
      return;
    }

    currentUserRatings.push({
      movieIndex,
      value: rating - stats.sum / stats.count,
    });
  });

  flushCurrentUser();

  return { numerators, leftSquares, rightSquares, coRatingCounts };
}

function buildSimilarityRows(
  movies: MovieSeedRow[],
  pairStats: Awaited<ReturnType<typeof accumulateSimilarityPairs>>,
  report: Report,
) {
  const candidatesBySource = Array.from<unknown, SimilarityCandidate[]>(
    { length: movies.length },
    () => [],
  );
  let offset = 0;

  for (let leftIndex = 0; leftIndex < movies.length - 1; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < movies.length; rightIndex += 1) {
      const coRatingCount = pairStats.coRatingCounts[offset];

      if (coRatingCount >= MIN_CO_RATING_COUNT) {
        report.similarities.candidatePairsWithMinCoRating += 1;

        const denominator = Math.sqrt(pairStats.leftSquares[offset] * pairStats.rightSquares[offset]);
        const score = denominator > 0 ? pairStats.numerators[offset] / denominator : 0;

        if (Number.isFinite(score) && score > 0) {
          report.similarities.candidatePairsWithPositiveScore += 1;

          candidatesBySource[leftIndex].push({
            targetMovieId: movies[rightIndex].movieId,
            score,
            coRatingCount,
          });
          candidatesBySource[rightIndex].push({
            targetMovieId: movies[leftIndex].movieId,
            score,
            coRatingCount,
          });
        }
      }

      offset += 1;
    }
  }

  return candidatesBySource.flatMap((candidates, sourceIndex) => {
    candidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (b.coRatingCount !== a.coRatingCount) {
        return b.coRatingCount - a.coRatingCount;
      }

      return a.targetMovieId - b.targetMovieId;
    });

    return candidates.slice(0, MAX_SIMILAR_MOVIES_PER_SOURCE).map((candidate) => ({
      sourceMovieId: movies[sourceIndex].movieId,
      ...candidate,
    }));
  });
}

async function loadGenomeTags(report: Report) {
  const tagsPath = path.join(MOVIELENS_DIR, "genome-tags.csv");
  const rows: Array<{ tagId: number; tag: string }> = [];
  const tagIds = new Set<number>();
  const tagValues = new Set<string>();

  await readCsvLines(tagsPath, ([tagIdValue, tag]) => {
    const tagId = Number(tagIdValue);

    if (!Number.isInteger(tagId) || !tag) {
      throw new Error(`Invalid genome-tags.csv row: ${tagIdValue},${tag}`);
    }

    if (tagIds.has(tagId)) {
      throw new Error(`Duplicate tag_id in genome-tags.csv: ${tagId}`);
    }

    if (tagValues.has(tag)) {
      throw new Error(`Duplicate tag in genome-tags.csv: ${tag}`);
    }

    tagIds.add(tagId);
    tagValues.add(tag);
    rows.push({ tagId, tag });
    report.inputRows.genomeTags += 1;
  });

  rows.sort((a, b) => a.tagId - b.tagId);
  report.tagGenome.distinctTags = rows.length;
  return { rows, tagIds };
}

async function writeMovieStatsCsv(
  movies: MovieSeedRow[],
  movieStats: RatingStats[],
  userTagCounts: Uint32Array,
) {
  return writeCsvAtomic("movie_stats_seed.csv", async (stream) => {
    let rows = 0;
    writeLine(
      stream,
      stringifyCsvRow([
        "movie_id",
        "movielens_avg_rating",
        "movielens_rating_count",
        "cinemate_rating_sum",
        "cinemate_review_count",
        "user_tag_count",
      ]),
    );

    const sortedIndexes = movies.map((_, index) => index).sort((a, b) => movies[a].movieId - movies[b].movieId);

    for (const index of sortedIndexes) {
      const stats = movieStats[index];
      writeLine(
        stream,
        stringifyCsvRow([
          movies[index].movieId,
          (stats.sum / stats.count).toFixed(AVG_RATING_DECIMAL_PLACES),
          stats.count,
          "0",
          0,
          userTagCounts[index],
        ]),
      );
      rows += 1;
    }

    return rows;
  });
}

async function writeMovieSimilaritiesCsv(
  rows: Array<SimilarityCandidate & { sourceMovieId: number }>,
) {
  return writeCsvAtomic("movie_similarities_seed.csv", async (stream) => {
    writeLine(
      stream,
      stringifyCsvRow(["source_movie_id", "target_movie_id", "score", "co_rating_count"]),
    );

    rows.sort((a, b) => {
      if (a.sourceMovieId !== b.sourceMovieId) {
        return a.sourceMovieId - b.sourceMovieId;
      }

      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (b.coRatingCount !== a.coRatingCount) {
        return b.coRatingCount - a.coRatingCount;
      }

      return a.targetMovieId - b.targetMovieId;
    });

    for (const row of rows) {
      writeLine(
        stream,
        stringifyCsvRow([
          row.sourceMovieId,
          row.targetMovieId,
          row.score.toFixed(SCORE_DECIMAL_PLACES),
          row.coRatingCount,
        ]),
      );
    }

    return rows.length;
  });
}

async function writeMovieTagsCsv(rows: Array<{ tagId: number; tag: string }>) {
  return writeCsvAtomic("movie_tags_seed.csv", async (stream) => {
    writeLine(stream, stringifyCsvRow(["tag_id", "tag"]));

    for (const row of rows) {
      writeLine(stream, stringifyCsvRow([row.tagId, row.tag]));
    }

    return rows.length;
  });
}

async function writeMovieTagRelevancesCsv(
  movielensIdToMovieId: Map<number, number>,
  tagIds: Set<number>,
  report: Report,
) {
  const scoresPath = path.join(MOVIELENS_DIR, "genome-scores.csv");
  const seen = new Set<string>();
  const moviesWithGenomeScores = new Set<number>();

  return writeCsvAtomic("movie_tag_relevances_seed.csv", async (stream) => {
    let rows = 0;
    writeLine(stream, stringifyCsvRow(["movie_id", "tag_id", "relevance"]));
    const input = createReadStream(scoresPath, { encoding: "utf8" });
    const reader = readline.createInterface({ input, crlfDelay: Infinity });
    let isHeader = true;

    for await (const line of reader) {
      if (isHeader) {
        isHeader = false;
        continue;
      }

      if (!line) {
        continue;
      }

      const [movielensIdValue, tagIdValue, relevanceValue] = parseCsvLine(line);
      const movieId = movielensIdToMovieId.get(Number(movielensIdValue));

      if (movieId === undefined) {
        continue;
      }

      const tagId = Number(tagIdValue);
      const relevance = Number(relevanceValue);

      if (!Number.isInteger(tagId) || !tagIds.has(tagId)) {
        throw new Error(`genome-scores.csv references an unknown tag_id: ${tagIdValue}`);
      }

      if (!Number.isFinite(relevance) || relevance < 0 || relevance > 1) {
        throw new Error(`Invalid relevance for movie_id=${movieId}, tag_id=${tagId}: ${relevanceValue}`);
      }

      const duplicateKey = `${movieId}:${tagId}`;

      if (seen.has(duplicateKey)) {
        throw new Error(`Duplicate movie_tag_relevances row: ${duplicateKey}`);
      }

      seen.add(duplicateKey);
      moviesWithGenomeScores.add(movieId);
      writeLine(stream, stringifyCsvRow([movieId, tagId, relevanceValue]));
      rows += 1;
      report.inputRows.selectedGenomeScores += 1;
    }

    report.tagGenome.moviesWithGenomeScores = moviesWithGenomeScores.size;
    return rows;
  });
}

function validateSimilarityRows(
  rows: Array<SimilarityCandidate & { sourceMovieId: number }>,
  movieIds: Set<number>,
  errors: string[],
) {
  const rowCountsBySource = new Map<number, number>();
  let previousSourceMovieId = -Infinity;
  let previousScore = Infinity;
  let previousCoRatingCount = Infinity;
  let previousTargetMovieId = -Infinity;

  for (const row of rows) {
    if (!movieIds.has(row.sourceMovieId)) {
      errors.push(`movie_similarities source FK is invalid: ${row.sourceMovieId}`);
    }

    if (!movieIds.has(row.targetMovieId)) {
      errors.push(`movie_similarities target FK is invalid: ${row.targetMovieId}`);
    }

    if (row.sourceMovieId === row.targetMovieId) {
      errors.push(`movie_similarities contains self recommendation: ${row.sourceMovieId}`);
    }

    if (row.coRatingCount < MIN_CO_RATING_COUNT) {
      errors.push(`movie_similarities co_rating_count is below minimum: ${row.coRatingCount}`);
    }

    if (!(row.score > 0)) {
      errors.push(`movie_similarities score is not positive: ${row.score}`);
    }

    increment(rowCountsBySource, row.sourceMovieId);

    if (row.sourceMovieId !== previousSourceMovieId) {
      previousSourceMovieId = row.sourceMovieId;
      previousScore = Infinity;
      previousCoRatingCount = Infinity;
      previousTargetMovieId = -Infinity;
    }

    const sorted =
      row.score < previousScore ||
      (row.score === previousScore && row.coRatingCount < previousCoRatingCount) ||
      (row.score === previousScore &&
        row.coRatingCount === previousCoRatingCount &&
        row.targetMovieId >= previousTargetMovieId);

    if (!sorted) {
      errors.push(`movie_similarities sort order is invalid for source_movie_id=${row.sourceMovieId}`);
    }

    previousScore = row.score;
    previousCoRatingCount = row.coRatingCount;
    previousTargetMovieId = row.targetMovieId;
  }

  for (const [sourceMovieId, count] of rowCountsBySource) {
    if (count > MAX_SIMILAR_MOVIES_PER_SOURCE) {
      errors.push(`movie_similarities has more than 50 rows for source_movie_id=${sourceMovieId}`);
    }
  }

  return rowCountsBySource;
}

function updateSimilarityReport(
  report: Report,
  rowCountsBySource: Map<number, number>,
  movies: MovieSeedRow[],
) {
  const counts = movies.map((movie) => rowCountsBySource.get(movie.movieId) ?? 0);
  report.similarities.sourcesWithAtLeastOneSimilarity = counts.filter((count) => count > 0).length;
  report.similarities.minRowsPerSource = Math.min(...counts);
  report.similarities.maxRowsPerSource = Math.max(...counts);
}

function createInitialReport(): Report {
  return {
    generatedAt: new Date().toISOString(),
    parameters: {
      targetMovieCount: TARGET_MOVIE_COUNT,
      similarityMethod: "adjusted_cosine",
      minCoRatingCount: MIN_CO_RATING_COUNT,
      minSimilarityScore: 0,
      maxSimilarMoviesPerSource: MAX_SIMILAR_MOVIES_PER_SOURCE,
      storeBidirectionalCandidates: true,
    },
    inputRows: {
      movies: 0,
      selectedRatings: 0,
      selectedTags: 0,
      genomeTags: 0,
      selectedGenomeScores: 0,
    },
    outputRows: {
      movieStats: 0,
      movieSimilarities: 0,
      movieTags: 0,
      movieTagRelevances: 0,
    },
    similarities: {
      candidatePairsWithMinCoRating: 0,
      candidatePairsWithPositiveScore: 0,
      sourcesWithAtLeastOneSimilarity: 0,
      minRowsPerSource: 0,
      maxRowsPerSource: 0,
    },
    tagGenome: {
      distinctTags: 0,
      moviesWithGenomeScores: 0,
    },
    validation: {
      ok: false,
      errors: [],
    },
  };
}

async function main() {
  const report = createInitialReport();
  const inputFiles = [
    path.join(MOVIE_CATALOG_GENERATED_DIR, "movies_seed.csv"),
    path.join(MOVIELENS_DIR, "ratings.csv"),
    path.join(MOVIELENS_DIR, "tags.csv"),
    path.join(MOVIELENS_DIR, "genome-tags.csv"),
    path.join(MOVIELENS_DIR, "genome-scores.csv"),
  ];

  await ensureDirectories();
  await Promise.all(inputFiles.map(assertFileExists));

  console.log("Loading selected movies...");
  const movies = await loadMovieSeeds(report);
  const movieIds = new Set(movies.map((movie) => movie.movieId));
  const movielensIdToMovieId = new Map(movies.map((movie) => [movie.movielensId, movie.movieId]));

  console.log("Loading MovieLens rating stats...");
  const { movieIndexByMovielensId, movieStats, userStats } = await loadRatingInputs(movies, report);

  console.log("Loading MovieLens user tag counts...");
  const userTagCounts = await loadUserTagCounts(movieIndexByMovielensId, movies.length, report);

  console.log("Accumulating adjusted cosine pair stats...");
  const pairStats = await accumulateSimilarityPairs(movieIndexByMovielensId, userStats, movies.length);

  console.log("Building top similarity rows per source...");
  const similarityRows = buildSimilarityRows(movies, pairStats, report);
  const sortedSimilarityRows = [...similarityRows].sort((a, b) => {
    if (a.sourceMovieId !== b.sourceMovieId) {
      return a.sourceMovieId - b.sourceMovieId;
    }

    if (b.score !== a.score) {
      return b.score - a.score;
    }

    if (b.coRatingCount !== a.coRatingCount) {
      return b.coRatingCount - a.coRatingCount;
    }

    return a.targetMovieId - b.targetMovieId;
  });
  const rowCountsBySource = validateSimilarityRows(sortedSimilarityRows, movieIds, report.validation.errors);
  updateSimilarityReport(report, rowCountsBySource, movies);

  console.log("Loading MovieLens Tag Genome tags...");
  const genomeTags = await loadGenomeTags(report);

  console.log("Writing CSV files...");
  report.outputRows.movieStats = await writeMovieStatsCsv(movies, movieStats, userTagCounts);
  report.outputRows.movieSimilarities = await writeMovieSimilaritiesCsv(sortedSimilarityRows);
  report.outputRows.movieTags = await writeMovieTagsCsv(genomeTags.rows);
  report.outputRows.movieTagRelevances = await writeMovieTagRelevancesCsv(
    movielensIdToMovieId,
    genomeTags.tagIds,
    report,
  );

  if (report.outputRows.movieStats !== TARGET_MOVIE_COUNT) {
    report.validation.errors.push(
      `movie_stats_seed.csv must contain ${TARGET_MOVIE_COUNT} rows, got ${report.outputRows.movieStats}.`,
    );
  }

  if (report.outputRows.movieSimilarities > TARGET_MOVIE_COUNT * MAX_SIMILAR_MOVIES_PER_SOURCE) {
    report.validation.errors.push(
      `movie_similarities_seed.csv has too many rows: ${report.outputRows.movieSimilarities}.`,
    );
  }

  report.validation.ok = report.validation.errors.length === 0;

  const reportPath = path.join(REPORTS_DIR, "generation-report.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (!report.validation.ok) {
    throw new Error(`Validation failed. See report: ${reportPath}`);
  }

  console.log(`Generated movie recommendation seed CSVs in ${GENERATED_DIR}`);
  console.log(`Report written to ${reportPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
