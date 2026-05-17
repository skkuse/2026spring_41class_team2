import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = process.cwd();
const MOVIE_CATALOG_GENERATED_DIR = path.join(ROOT_DIR, "data", "seeds", "movie-catalog", "generated");
const SEED_DIR = path.join(ROOT_DIR, "data", "seeds", "movie-credits");
const GENERATED_DIR = path.join(SEED_DIR, "generated");
const CACHE_DIR = path.join(SEED_DIR, "cache");
const REPORTS_DIR = path.join(SEED_DIR, "reports");
const CONCURRENCY = 6;
const NULL_VALUE = "\\N";
const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";

type MovieSeedRow = {
  id: number;
};

type TmdbPersonSummary = {
  id?: number | null;
  name?: string | null;
  profile_path?: string | null;
  known_for_department?: string | null;
  popularity?: number | null;
};

type TmdbCastCredit = TmdbPersonSummary & {
  character?: string | null;
  credit_id?: string | null;
  order?: number | null;
};

type TmdbCrewCredit = TmdbPersonSummary & {
  credit_id?: string | null;
  department?: string | null;
  job?: string | null;
};

type TmdbMovieCredits = {
  id?: number;
  cast?: TmdbCastCredit[];
  crew?: TmdbCrewCredit[];
};

type TmdbCreditDetail = {
  credit_type?: string | null;
  department?: string | null;
  job?: string | null;
  media?: {
    character?: string | null;
  } | null;
  person?: TmdbPersonSummary | null;
};

type PersonSeedRow = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string | null;
  popularity: number | null;
};

type MovieCastSeedRow = {
  movie_id: number;
  person_id: number;
  character_name: string;
  cast_order: number | null;
};

type MovieCrewSeedRow = {
  movie_id: number;
  person_id: number;
  department: string;
  job: string;
};

type PersonConflict = {
  personId: number;
  field: keyof Omit<PersonSeedRow, "id">;
  kept: string | number | null;
  incoming: string | number | null;
  source: string;
};

type SkippedRow = {
  movieId: number;
  creditId: string | null;
  personId: number | null;
  reason: string;
};

type TmdbFailure = {
  scope: "movie_credits" | "person_details" | "credit_details";
  id: string | number;
  message: string;
};

type Report = {
  generatedAt: string;
  inputRows: {
    movies: number;
  };
  outputRows: {
    people: number;
    movieCasts: number;
    movieCrew: number;
  };
  tmdbRequests: {
    movieCredits: number;
    personDetails: number;
    creditDetails: number;
  };
  fallback: {
    personDetailsAttempted: number;
    personDetailsSucceeded: number;
    creditDetailsAttempted: number;
    creditDetailsSucceeded: number;
  };
  skipped: {
    castRows: number;
    crewRows: number;
    people: number;
    samples: SkippedRow[];
  };
  deduped: {
    movieCasts: number;
    movieCrew: number;
  };
  personConflicts: {
    count: number;
    reportPath: string;
    samples: PersonConflict[];
  };
  directorMissingMovieIds: number[];
  tmdbFailures: TmdbFailure[];
  validation: {
    ok: boolean;
    errors: string[];
  };
};

const personConflicts: PersonConflict[] = [];

class TmdbRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
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

async function readCsvRows(filePath: string) {
  const text = await readFile(filePath, "utf8");
  const rows = parseCsv(text);

  if (rows.length === 0) {
    throw new Error(`${filePath}: CSV is empty.`);
  }

  const header = rows[0];
  return rows.slice(1).map((cells, index) => {
    if (cells.length !== header.length) {
      throw new Error(
        `${filePath}:${index + 2}: column count mismatch. expected=${header.length}, actual=${cells.length}`,
      );
    }

    return Object.fromEntries(
      header.map((column, columnIndex) => {
        const value = cells[columnIndex];
        return [column, value === NULL_VALUE ? null : value];
      }),
    );
  });
}

async function loadMovieSeedRows(): Promise<MovieSeedRow[]> {
  const rows = await readCsvRows(path.join(MOVIE_CATALOG_GENERATED_DIR, "movies_seed.csv"));

  return rows.map((row, index) => {
    const id = Number(row.id);

    if (!Number.isSafeInteger(id)) {
      throw new Error(`movies_seed.csv:${index + 2}: id must be an integer.`);
    }

    return { id };
  });
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

async function readCache<T>(cachePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(cachePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function getCachedTmdbJson<T>(
  cacheRelativePath: string,
  endpoint: string,
  token: string,
  onCacheMiss: () => void,
) {
  const cachePath = path.join(CACHE_DIR, "tmdb", cacheRelativePath);
  const cached = await readCache<T>(cachePath);

  if (cached) {
    return cached;
  }

  onCacheMiss();
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

function normalizeString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getPersonId(person: TmdbPersonSummary) {
  return Number.isSafeInteger(person.id) && person.id && person.id > 0 ? person.id : null;
}

function createInitialReport(): Report {
  return {
    generatedAt: new Date().toISOString(),
    inputRows: {
      movies: 0,
    },
    outputRows: {
      people: 0,
      movieCasts: 0,
      movieCrew: 0,
    },
    tmdbRequests: {
      movieCredits: 0,
      personDetails: 0,
      creditDetails: 0,
    },
    fallback: {
      personDetailsAttempted: 0,
      personDetailsSucceeded: 0,
      creditDetailsAttempted: 0,
      creditDetailsSucceeded: 0,
    },
    skipped: {
      castRows: 0,
      crewRows: 0,
      people: 0,
      samples: [],
    },
    deduped: {
      movieCasts: 0,
      movieCrew: 0,
    },
    personConflicts: {
      count: 0,
      reportPath: path.join(REPORTS_DIR, "person-conflicts.json"),
      samples: [],
    },
    directorMissingMovieIds: [],
    tmdbFailures: [],
    validation: {
      ok: false,
      errors: [],
    },
  };
}

function addSkippedRow(report: Report, skippedRow: SkippedRow, target: "castRows" | "crewRows") {
  report.skipped[target] += 1;

  if (report.skipped.samples.length < 100) {
    report.skipped.samples.push(skippedRow);
  }
}

function addPersonConflict(report: Report, conflict: PersonConflict) {
  personConflicts.push(conflict);
  report.personConflicts.count += 1;

  if (report.personConflicts.samples.length < 100) {
    report.personConflicts.samples.push(conflict);
  }
}

function addTmdbFailure(report: Report, failure: TmdbFailure) {
  report.tmdbFailures.push(failure);
}

async function loadMovieCredits(movieId: number, token: string, report: Report) {
  try {
    return await getCachedTmdbJson<TmdbMovieCredits>(
      path.join("movie-credits", `${movieId}.ko-KR.json`),
      `/movie/${movieId}/credits?language=ko-KR`,
      token,
      () => {
        report.tmdbRequests.movieCredits += 1;
      },
    );
  } catch (error) {
    addTmdbFailure(report, {
      scope: "movie_credits",
      id: movieId,
      message: error instanceof Error ? error.message : "Unknown TMDB error",
    });
    throw error;
  }
}

async function loadPersonDetails(personId: number, token: string, report: Report) {
  report.fallback.personDetailsAttempted += 1;

  try {
    const details = await getCachedTmdbJson<TmdbPersonSummary>(
      path.join("person-details", `${personId}.ko-KR.json`),
      `/person/${personId}?language=ko-KR`,
      token,
      () => {
        report.tmdbRequests.personDetails += 1;
      },
    );
    report.fallback.personDetailsSucceeded += 1;
    return details;
  } catch (error) {
    addTmdbFailure(report, {
      scope: "person_details",
      id: personId,
      message: error instanceof Error ? error.message : "Unknown TMDB error",
    });
    return null;
  }
}

async function loadCreditDetails(creditId: string, token: string, report: Report) {
  report.fallback.creditDetailsAttempted += 1;

  try {
    const details = await getCachedTmdbJson<TmdbCreditDetail>(
      path.join("credit-details", `${creditId}.ko-KR.json`),
      `/credit/${creditId}?language=ko-KR`,
      token,
      () => {
        report.tmdbRequests.creditDetails += 1;
      },
    );
    report.fallback.creditDetailsSucceeded += 1;
    return details;
  } catch (error) {
    addTmdbFailure(report, {
      scope: "credit_details",
      id: creditId,
      message: error instanceof Error ? error.message : "Unknown TMDB error",
    });
    return null;
  }
}

function hasRequiredPersonFields(person: TmdbPersonSummary) {
  return getPersonId(person) !== null && normalizeString(person.name) !== null;
}

function mergePersonSummary(base: TmdbPersonSummary, incoming: TmdbPersonSummary | null | undefined) {
  if (!incoming) {
    return base;
  }

  return {
    id: base.id ?? incoming.id,
    name: normalizeString(base.name) ?? normalizeString(incoming.name),
    profile_path: normalizeString(base.profile_path) ?? normalizeString(incoming.profile_path),
    known_for_department:
      normalizeString(base.known_for_department) ?? normalizeString(incoming.known_for_department),
    popularity: normalizeNumber(base.popularity) ?? normalizeNumber(incoming.popularity),
  };
}

async function completePersonSummary(
  person: TmdbPersonSummary,
  token: string,
  report: Report,
  creditDetails?: TmdbCreditDetail | null,
) {
  let completed = mergePersonSummary(person, creditDetails?.person);
  const personId = getPersonId(completed);

  if (!hasRequiredPersonFields(completed) && personId !== null) {
    completed = mergePersonSummary(completed, await loadPersonDetails(personId, token, report));
  }

  return completed;
}

function upsertPerson(people: Map<number, PersonSeedRow>, person: TmdbPersonSummary, source: string, report: Report) {
  const id = getPersonId(person);
  const name = normalizeString(person.name);

  if (id === null || name === null) {
    report.skipped.people += 1;
    return false;
  }

  const incoming: PersonSeedRow = {
    id,
    name,
    profile_path: normalizeString(person.profile_path),
    known_for_department: normalizeString(person.known_for_department),
    popularity: normalizeNumber(person.popularity),
  };
  const current = people.get(id);

  if (!current) {
    people.set(id, incoming);
    return true;
  }

  if (current.name !== incoming.name) {
    addPersonConflict(report, {
      personId: id,
      field: "name",
      kept: current.name,
      incoming: incoming.name,
      source,
    });
  }

  for (const field of ["profile_path", "known_for_department"] as const) {
    if (current[field] && incoming[field] && current[field] !== incoming[field]) {
      addPersonConflict(report, {
        personId: id,
        field,
        kept: current[field],
        incoming: incoming[field],
        source,
      });
    }

    if (!current[field] && incoming[field]) {
      current[field] = incoming[field];
    }
  }

  if (
    current.popularity !== null &&
    incoming.popularity !== null &&
    current.popularity !== incoming.popularity
  ) {
    addPersonConflict(report, {
      personId: id,
      field: "popularity",
      kept: Math.max(current.popularity, incoming.popularity),
      incoming: incoming.popularity,
      source,
    });
  }

  if (incoming.popularity !== null) {
    current.popularity =
      current.popularity === null ? incoming.popularity : Math.max(current.popularity, incoming.popularity);
  }

  return true;
}

async function processCastCredit(
  movieId: number,
  credit: TmdbCastCredit,
  token: string,
  people: Map<number, PersonSeedRow>,
  castRows: MovieCastSeedRow[],
  castKeys: Set<string>,
  report: Report,
) {
  let creditDetails: TmdbCreditDetail | null = null;
  let characterName = normalizeString(credit.character);
  const creditId = normalizeString(credit.credit_id);

  if (!characterName && creditId) {
    creditDetails = await loadCreditDetails(creditId, token, report);
    characterName = normalizeString(creditDetails?.media?.character);
  }

  const person = await completePersonSummary(credit, token, report, creditDetails);
  const personId = getPersonId(person);

  if (personId === null || !normalizeString(person.name)) {
    addSkippedRow(
      report,
      {
        movieId,
        creditId,
        personId,
        reason: "missing_person_id_or_name",
      },
      "castRows",
    );
    return;
  }

  if (!characterName) {
    addSkippedRow(
      report,
      {
        movieId,
        creditId,
        personId,
        reason: "missing_character_name",
      },
      "castRows",
    );
    return;
  }

  if (!upsertPerson(people, person, `cast:${movieId}:${creditId ?? "unknown"}`, report)) {
    addSkippedRow(
      report,
      {
        movieId,
        creditId,
        personId,
        reason: "person_upsert_failed",
      },
      "castRows",
    );
    return;
  }

  const key = `${movieId}:${personId}:${characterName}`;

  if (castKeys.has(key)) {
    report.deduped.movieCasts += 1;
    return;
  }

  castKeys.add(key);
  castRows.push({
    movie_id: movieId,
    person_id: personId,
    character_name: characterName,
    cast_order: normalizeNumber(credit.order),
  });
}

async function processCrewCredit(
  movieId: number,
  credit: TmdbCrewCredit,
  token: string,
  people: Map<number, PersonSeedRow>,
  crewRows: MovieCrewSeedRow[],
  crewKeys: Set<string>,
  report: Report,
) {
  let creditDetails: TmdbCreditDetail | null = null;
  const creditId = normalizeString(credit.credit_id);
  let job = normalizeString(credit.job);
  let department = normalizeString(credit.department);

  if ((!job || !department) && creditId) {
    creditDetails = await loadCreditDetails(creditId, token, report);
    job = job ?? normalizeString(creditDetails?.job);
    department = department ?? normalizeString(creditDetails?.department);
  }

  if (job !== "Director") {
    return false;
  }

  const person = await completePersonSummary(credit, token, report, creditDetails);
  const personId = getPersonId(person);

  if (personId === null || !normalizeString(person.name)) {
    addSkippedRow(
      report,
      {
        movieId,
        creditId,
        personId,
        reason: "missing_director_person_id_or_name",
      },
      "crewRows",
    );
    return false;
  }

  if (!department) {
    addSkippedRow(
      report,
      {
        movieId,
        creditId,
        personId,
        reason: "missing_director_department",
      },
      "crewRows",
    );
    return false;
  }

  if (!upsertPerson(people, person, `crew:${movieId}:${creditId ?? "unknown"}`, report)) {
    addSkippedRow(
      report,
      {
        movieId,
        creditId,
        personId,
        reason: "person_upsert_failed",
      },
      "crewRows",
    );
    return false;
  }

  const key = `${movieId}:${personId}:${department}:${job}`;

  if (crewKeys.has(key)) {
    report.deduped.movieCrew += 1;
    return true;
  }

  crewKeys.add(key);
  crewRows.push({
    movie_id: movieId,
    person_id: personId,
    department,
    job,
  });
  return true;
}

async function buildSeedRows(movieRows: MovieSeedRow[], token: string, report: Report) {
  const people = new Map<number, PersonSeedRow>();
  const castRows: MovieCastSeedRow[] = [];
  const crewRows: MovieCrewSeedRow[] = [];
  const castKeys = new Set<string>();
  const crewKeys = new Set<string>();

  await mapWithConcurrency(movieRows, CONCURRENCY, async (movieRow) => {
    const credits = await loadMovieCredits(movieRow.id, token, report);
    let hasDirector = false;

    for (const credit of credits.cast ?? []) {
      await processCastCredit(movieRow.id, credit, token, people, castRows, castKeys, report);
    }

    for (const credit of credits.crew ?? []) {
      const processedDirector = await processCrewCredit(
        movieRow.id,
        credit,
        token,
        people,
        crewRows,
        crewKeys,
        report,
      );
      hasDirector = hasDirector || processedDirector;
    }

    if (!hasDirector) {
      report.directorMissingMovieIds.push(movieRow.id);
    }

    if ((castRows.length + crewRows.length) % 10000 < 200) {
      console.log(
        `Processed movie ${movieRow.id}. cast rows=${castRows.length}, director rows=${crewRows.length}`,
      );
    }
  });

  return {
    people: [...people.values()].sort((a, b) => a.id - b.id),
    castRows: castRows.sort(
      (a, b) =>
        a.movie_id - b.movie_id ||
        (a.cast_order ?? Number.MAX_SAFE_INTEGER) - (b.cast_order ?? Number.MAX_SAFE_INTEGER) ||
        a.person_id - b.person_id ||
        a.character_name.localeCompare(b.character_name),
    ),
    crewRows: crewRows.sort(
      (a, b) =>
        a.movie_id - b.movie_id ||
        a.person_id - b.person_id ||
        a.department.localeCompare(b.department) ||
        a.job.localeCompare(b.job),
    ),
  };
}

function createCsvRows(rows: Awaited<ReturnType<typeof buildSeedRows>>) {
  const peopleRows: Array<Array<string | number | boolean | null>> = [
    ["id", "name", "profile_path", "known_for_department", "popularity"],
  ];
  const castRows: Array<Array<string | number | boolean | null>> = [
    ["movie_id", "person_id", "character_name", "cast_order"],
  ];
  const crewRows: Array<Array<string | number | boolean | null>> = [
    ["movie_id", "person_id", "department", "job"],
  ];

  for (const row of rows.people) {
    peopleRows.push([
      row.id,
      row.name,
      row.profile_path,
      row.known_for_department,
      row.popularity,
    ]);
  }

  for (const row of rows.castRows) {
    castRows.push([row.movie_id, row.person_id, row.character_name, row.cast_order]);
  }

  for (const row of rows.crewRows) {
    crewRows.push([row.movie_id, row.person_id, row.department, row.job]);
  }

  return { peopleRows, castRows, crewRows };
}

function validateRows(
  movieRows: MovieSeedRow[],
  rows: Awaited<ReturnType<typeof buildSeedRows>>,
): Report["validation"] {
  const errors: string[] = [];
  const movieIds = new Set(movieRows.map((row) => row.id));
  const personIds = new Set<number>();
  const castKeys = new Set<string>();
  const crewKeys = new Set<string>();

  for (const row of rows.people) {
    if (personIds.has(row.id)) {
      errors.push(`duplicate people.id: ${row.id}`);
    }

    if (!row.name) {
      errors.push(`missing people.name: ${row.id}`);
    }

    personIds.add(row.id);
  }

  for (const row of rows.castRows) {
    const key = `${row.movie_id}:${row.person_id}:${row.character_name}`;

    if (!movieIds.has(row.movie_id)) {
      errors.push(`movie_casts.movie_id FK missing: ${row.movie_id}`);
    }

    if (!personIds.has(row.person_id)) {
      errors.push(`movie_casts.person_id FK missing: ${row.person_id}`);
    }

    if (castKeys.has(key)) {
      errors.push(`duplicate movie_casts key: ${key}`);
    }

    castKeys.add(key);
  }

  for (const row of rows.crewRows) {
    const key = `${row.movie_id}:${row.person_id}:${row.department}:${row.job}`;

    if (!movieIds.has(row.movie_id)) {
      errors.push(`movie_crew.movie_id FK missing: ${row.movie_id}`);
    }

    if (!personIds.has(row.person_id)) {
      errors.push(`movie_crew.person_id FK missing: ${row.person_id}`);
    }

    if (row.job !== "Director") {
      errors.push(`movie_crew contains non-Director job: ${key}`);
    }

    if (crewKeys.has(key)) {
      errors.push(`duplicate movie_crew key: ${key}`);
    }

    crewKeys.add(key);
  }

  return { ok: errors.length === 0, errors };
}

async function cleanupIncompleteCsv() {
  await Promise.all([
    rm(path.join(GENERATED_DIR, "people_seed.csv"), { force: true }),
    rm(path.join(GENERATED_DIR, "movie_casts_seed.csv"), { force: true }),
    rm(path.join(GENERATED_DIR, "movie_crew_seed.csv"), { force: true }),
  ]);
}

async function writeReports(report: Report, conflicts: PersonConflict[]) {
  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(
    path.join(REPORTS_DIR, "generation-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(REPORTS_DIR, "person-conflicts.json"),
    `${JSON.stringify(conflicts, null, 2)}\n`,
    "utf8",
  );
}

async function main() {
  await loadEnvFiles();
  await ensureDirectories();

  const token = process.env.TMDB_READ_ACCESS_TOKEN;

  if (!token) {
    throw new Error("TMDB_READ_ACCESS_TOKEN is required.");
  }

  const report = createInitialReport();
  const movieRows = await loadMovieSeedRows();
  report.inputRows.movies = movieRows.length;

  console.log(`Loading TMDB credits for ${movieRows.length} movies...`);
  let rows: Awaited<ReturnType<typeof buildSeedRows>>;

  try {
    rows = await buildSeedRows(movieRows, token, report);
  } catch (error) {
    report.validation = {
      ok: false,
      errors: [error instanceof Error ? error.message : "Movie credits generation failed."],
    };
    await cleanupIncompleteCsv();
    await writeReports(report, personConflicts);
    throw error;
  }

  const validation = validateRows(movieRows, rows);
  const csvRows = createCsvRows(rows);
  report.validation = validation;
  report.outputRows = {
    people: rows.people.length,
    movieCasts: rows.castRows.length,
    movieCrew: rows.crewRows.length,
  };

  if (!validation.ok) {
    await cleanupIncompleteCsv();
    await writeReports(report, personConflicts);
    throw new Error(`Movie credits seed validation failed. ${validation.errors.slice(0, 5).join("; ")}`);
  }

  await writeCsvAtomic("people_seed.csv", csvRows.peopleRows);
  await writeCsvAtomic("movie_casts_seed.csv", csvRows.castRows);
  await writeCsvAtomic("movie_crew_seed.csv", csvRows.crewRows);
  await writeReports(report, personConflicts);

  console.log("Movie credits seed CSV generated.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
