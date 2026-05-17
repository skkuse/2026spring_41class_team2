import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ROOT_DIR = process.cwd();
const GENERATED_DIR = path.join(ROOT_DIR, "data", "seeds", "movie-recommendation", "generated");
const NULL_VALUE = "\\N";
const BATCH_SIZE = 1000;
const MOVIE_ID_LOOKUP_BATCH_SIZE = 500;

type CsvRow = Record<string, string | null>;

type MovieRow = {
  id: number;
};

type MovieStatSeedRow = {
  movie_id: number;
  movielens_avg_rating: number;
  movielens_rating_count: number;
  cinemate_rating_sum: number;
  cinemate_review_count: number;
  user_tag_count: number;
};

type MovieSimilaritySeedRow = {
  source_movie_id: number;
  target_movie_id: number;
  score: number;
  co_rating_count: number;
};

type MovieTagSeedRow = {
  tag_id: number;
  tag: string;
};

type MovieTagRelevanceSeedRow = {
  movie_id: number;
  tag_id: number;
  relevance: number;
};

type Database = {
  public: {
    Tables: {
      movies: {
        Row: MovieRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      movie_stats: {
        Row: MovieStatSeedRow & {
          created_at: string;
          updated_at: string;
        };
        Insert: MovieStatSeedRow;
        Update: Partial<MovieStatSeedRow>;
        Relationships: [];
      };
      movie_similarities: {
        Row: MovieSimilaritySeedRow;
        Insert: MovieSimilaritySeedRow;
        Update: Partial<MovieSimilaritySeedRow>;
        Relationships: [];
      };
      movie_tags: {
        Row: MovieTagSeedRow;
        Insert: MovieTagSeedRow;
        Update: Partial<MovieTagSeedRow>;
        Relationships: [];
      };
      movie_tag_relevances: {
        Row: MovieTagRelevanceSeedRow;
        Insert: MovieTagRelevanceSeedRow;
        Update: Partial<MovieTagRelevanceSeedRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type TableName = keyof Database["public"]["Tables"];
type SeedTableName = Exclude<TableName, "movies">;

type SeedTable =
  | {
      name: "movie_stats";
      rows: MovieStatSeedRow[];
    }
  | {
      name: "movie_similarities";
      rows: MovieSimilaritySeedRow[];
    }
  | {
      name: "movie_tags";
      rows: MovieTagSeedRow[];
    }
  | {
      name: "movie_tag_relevances";
      rows: MovieTagRelevanceSeedRow[];
    };

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

  if (inQuotes) {
    throw new Error("CSV quote가 닫히지 않았습니다.");
  }

  cells.push(value);
  return cells;
}

function assertHeader(fileName: string, header: string[], expectedHeader: string[]) {
  if (header.length !== expectedHeader.length) {
    throw new Error(
      `${fileName}: 헤더 컬럼 수가 다릅니다. expected=${expectedHeader.length}, actual=${header.length}`,
    );
  }

  for (const [index, expectedColumn] of expectedHeader.entries()) {
    if (header[index] !== expectedColumn) {
      throw new Error(
        `${fileName}: 헤더가 다릅니다. column=${index + 1}, expected=${expectedColumn}, actual=${header[index]}`,
      );
    }
  }
}

async function* readCsvRows(fileName: string, expectedHeader: string[]): AsyncGenerator<{
  row: CsvRow;
  lineNumber: number;
}> {
  const filePath = path.join(GENERATED_DIR, fileName);
  const text = await readFile(filePath, "utf8");
  const lines = text.split(/\r?\n/);

  if (lines.length === 0 || lines[0] === "") {
    throw new Error(`${fileName}: CSV가 비어 있습니다.`);
  }

  const header = parseCsvLine(lines[0]);
  assertHeader(fileName, header, expectedHeader);

  for (const [index, line] of lines.entries()) {
    if (index === 0) {
      continue;
    }

    const lineNumber = index + 1;
    if (!line) {
      continue;
    }

    const cells = parseCsvLine(line);

    if (cells.length !== header.length) {
      throw new Error(
        `${fileName}:${lineNumber}: 컬럼 수가 헤더와 다릅니다. expected=${header.length}, actual=${cells.length}`,
      );
    }

    yield {
      lineNumber,
      row: Object.fromEntries(
        header.map((column, columnIndex) => {
          const value = cells[columnIndex];
          return [column, value === NULL_VALUE ? null : value];
        }),
      ),
    };
  }
}

function requireString(row: CsvRow, column: string, fileName: string, lineNumber: number) {
  const value = row[column];

  if (value === null || value === "") {
    throw new Error(`${fileName}:${lineNumber}: ${column} 값이 필요합니다.`);
  }

  return value;
}

function requireInteger(row: CsvRow, column: string, fileName: string, lineNumber: number) {
  const value = requireString(row, column, fileName, lineNumber);
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${fileName}:${lineNumber}: ${column} 값이 정수가 아닙니다. value=${value}`);
  }

  return parsed;
}

function requireDecimal(row: CsvRow, column: string, fileName: string, lineNumber: number) {
  const value = requireString(row, column, fileName, lineNumber);
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${fileName}:${lineNumber}: ${column} 값이 숫자가 아닙니다. value=${value}`);
  }

  return parsed;
}

function assertRange(
  value: number,
  min: number,
  max: number,
  label: string,
  fileName: string,
  lineNumber: number,
) {
  if (value < min || value > max) {
    throw new Error(`${fileName}:${lineNumber}: ${label} 범위 오류. value=${value}`);
  }
}

function assertNonNegative(value: number, label: string, fileName: string, lineNumber: number) {
  if (value < 0) {
    throw new Error(`${fileName}:${lineNumber}: ${label} 값은 0 이상이어야 합니다. value=${value}`);
  }
}

function parseMovieStat(row: CsvRow, fileName: string, lineNumber: number): MovieStatSeedRow {
  const parsed = {
    movie_id: requireInteger(row, "movie_id", fileName, lineNumber),
    movielens_avg_rating: requireDecimal(row, "movielens_avg_rating", fileName, lineNumber),
    movielens_rating_count: requireInteger(row, "movielens_rating_count", fileName, lineNumber),
    cinemate_rating_sum: requireDecimal(row, "cinemate_rating_sum", fileName, lineNumber),
    cinemate_review_count: requireInteger(row, "cinemate_review_count", fileName, lineNumber),
    user_tag_count: requireInteger(row, "user_tag_count", fileName, lineNumber),
  };

  assertRange(parsed.movielens_avg_rating, 0, 5, "movielens_avg_rating", fileName, lineNumber);
  assertNonNegative(parsed.movielens_rating_count, "movielens_rating_count", fileName, lineNumber);
  assertNonNegative(parsed.cinemate_rating_sum, "cinemate_rating_sum", fileName, lineNumber);
  assertNonNegative(parsed.cinemate_review_count, "cinemate_review_count", fileName, lineNumber);
  assertNonNegative(parsed.user_tag_count, "user_tag_count", fileName, lineNumber);

  return parsed;
}

function parseMovieSimilarity(
  row: CsvRow,
  fileName: string,
  lineNumber: number,
): MovieSimilaritySeedRow {
  const parsed = {
    source_movie_id: requireInteger(row, "source_movie_id", fileName, lineNumber),
    target_movie_id: requireInteger(row, "target_movie_id", fileName, lineNumber),
    score: requireDecimal(row, "score", fileName, lineNumber),
    co_rating_count: requireInteger(row, "co_rating_count", fileName, lineNumber),
  };

  if (parsed.source_movie_id === parsed.target_movie_id) {
    throw new Error(`${fileName}:${lineNumber}: source_movie_id와 target_movie_id가 같습니다.`);
  }

  if (parsed.score <= 0) {
    throw new Error(`${fileName}:${lineNumber}: score 값은 0보다 커야 합니다. value=${parsed.score}`);
  }

  assertNonNegative(parsed.co_rating_count, "co_rating_count", fileName, lineNumber);

  return parsed;
}

function parseMovieTag(row: CsvRow, fileName: string, lineNumber: number): MovieTagSeedRow {
  return {
    tag_id: requireInteger(row, "tag_id", fileName, lineNumber),
    tag: requireString(row, "tag", fileName, lineNumber),
  };
}

function parseMovieTagRelevance(
  row: CsvRow,
  fileName: string,
  lineNumber: number,
): MovieTagRelevanceSeedRow {
  const parsed = {
    movie_id: requireInteger(row, "movie_id", fileName, lineNumber),
    tag_id: requireInteger(row, "tag_id", fileName, lineNumber),
    relevance: requireDecimal(row, "relevance", fileName, lineNumber),
  };

  assertRange(parsed.relevance, 0, 1, "relevance", fileName, lineNumber);

  return parsed;
}

async function loadMovieStats(): Promise<MovieStatSeedRow[]> {
  const fileName = "movie_stats_seed.csv";
  const rows: MovieStatSeedRow[] = [];

  for await (const { row, lineNumber } of readCsvRows(fileName, [
    "movie_id",
    "movielens_avg_rating",
    "movielens_rating_count",
    "cinemate_rating_sum",
    "cinemate_review_count",
    "user_tag_count",
  ])) {
    rows.push(parseMovieStat(row, fileName, lineNumber));
  }

  return rows;
}

async function loadMovieTags(): Promise<MovieTagSeedRow[]> {
  const fileName = "movie_tags_seed.csv";
  const rows: MovieTagSeedRow[] = [];

  for await (const { row, lineNumber } of readCsvRows(fileName, ["tag_id", "tag"])) {
    rows.push(parseMovieTag(row, fileName, lineNumber));
  }

  return rows;
}

function assertNoDuplicates<T>(rows: T[], getKey: (row: T) => string, label: string) {
  const seen = new Set<string>();

  for (const row of rows) {
    const key = getKey(row);

    if (seen.has(key)) {
      throw new Error(`${label} 중복 값이 있습니다. key=${key}`);
    }

    seen.add(key);
  }
}

async function validateMovieSimilarities(movieIds: Set<number>) {
  const fileName = "movie_similarities_seed.csv";
  const seen = new Set<string>();
  let rowCount = 0;

  for await (const { row, lineNumber } of readCsvRows(fileName, [
    "source_movie_id",
    "target_movie_id",
    "score",
    "co_rating_count",
  ])) {
    const parsed = parseMovieSimilarity(row, fileName, lineNumber);
    const key = `${parsed.source_movie_id}:${parsed.target_movie_id}`;

    if (seen.has(key)) {
      throw new Error(`${fileName}:${lineNumber}: movie_similarities PK 중복 값이 있습니다. key=${key}`);
    }

    if (!movieIds.has(parsed.source_movie_id)) {
      throw new Error(
        `${fileName}:${lineNumber}: source_movie_id가 movie_stats.movie_id에 없습니다. movie_id=${parsed.source_movie_id}`,
      );
    }

    if (!movieIds.has(parsed.target_movie_id)) {
      throw new Error(
        `${fileName}:${lineNumber}: target_movie_id가 movie_stats.movie_id에 없습니다. movie_id=${parsed.target_movie_id}`,
      );
    }

    seen.add(key);
    rowCount += 1;
  }

  return rowCount;
}

async function validateMovieTagRelevances(movieIds: Set<number>, tagIds: Set<number>) {
  const fileName = "movie_tag_relevances_seed.csv";
  const seen = new Set<string>();
  let rowCount = 0;

  for await (const { row, lineNumber } of readCsvRows(fileName, [
    "movie_id",
    "tag_id",
    "relevance",
  ])) {
    const parsed = parseMovieTagRelevance(row, fileName, lineNumber);
    const key = `${parsed.movie_id}:${parsed.tag_id}`;

    if (seen.has(key)) {
      throw new Error(`${fileName}:${lineNumber}: movie_tag_relevances PK 중복 값이 있습니다. key=${key}`);
    }

    if (!movieIds.has(parsed.movie_id)) {
      throw new Error(
        `${fileName}:${lineNumber}: movie_id가 movie_stats.movie_id에 없습니다. movie_id=${parsed.movie_id}`,
      );
    }

    if (!tagIds.has(parsed.tag_id)) {
      throw new Error(`${fileName}:${lineNumber}: tag_id가 movie_tags.tag_id에 없습니다. tag_id=${parsed.tag_id}`);
    }

    seen.add(key);
    rowCount += 1;
  }

  return rowCount;
}

async function validateSeedRows(movieStats: MovieStatSeedRow[], movieTags: MovieTagSeedRow[]) {
  assertNoDuplicates(movieStats, (row) => String(row.movie_id), "movie_stats.movie_id");
  assertNoDuplicates(movieTags, (row) => String(row.tag_id), "movie_tags.tag_id");
  assertNoDuplicates(movieTags, (row) => row.tag, "movie_tags.tag");

  const movieIds = new Set(movieStats.map((row) => row.movie_id));
  const tagIds = new Set(movieTags.map((row) => row.tag_id));
  const [movieSimilaritiesCount, movieTagRelevancesCount] = await Promise.all([
    validateMovieSimilarities(movieIds),
    validateMovieTagRelevances(movieIds, tagIds),
  ]);

  return {
    movieSimilaritiesCount,
    movieTagRelevancesCount,
  };
}

function collectMovieIds(movieStats: MovieStatSeedRow[]) {
  return movieStats.map((row) => row.movie_id);
}

async function assertMoviesExist(supabase: SupabaseClient<Database>, movieIds: number[]) {
  const existingMovieIds = new Set<number>();

  for (let start = 0; start < movieIds.length; start += MOVIE_ID_LOOKUP_BATCH_SIZE) {
    const ids = movieIds.slice(start, start + MOVIE_ID_LOOKUP_BATCH_SIZE);
    const { data, error } = await supabase.from("movies").select("id").in("id", ids);

    if (error) {
      throw new Error(`movies FK 확인 실패: ${error.message}`);
    }

    for (const row of data) {
      existingMovieIds.add(row.id);
    }
  }

  const missingMovieIds = movieIds.filter((id) => !existingMovieIds.has(id));

  if (missingMovieIds.length > 0) {
    throw new Error(
      `movies 테이블에 없는 movie_id가 있습니다. count=${missingMovieIds.length}, sample=${missingMovieIds
        .slice(0, 20)
        .join(",")}`,
    );
  }
}

async function deleteAllRows(
  supabase: SupabaseClient<Database>,
  tableName: SeedTableName,
  nonNullableColumn: string,
) {
  const { error } = await supabase.from(tableName).delete().not(nonNullableColumn, "is", null);

  if (error) {
    throw new Error(`${tableName} 삭제 실패: ${error.message}`);
  }
}

async function insertBatches(supabase: SupabaseClient<Database>, table: SeedTable) {
  for (let start = 0; start < table.rows.length; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE, table.rows.length);
    let error: { code?: string; message: string } | null = null;

    if (table.name === "movie_stats") {
      ({ error } = await supabase.from("movie_stats").insert(table.rows.slice(start, end)));
    } else if (table.name === "movie_similarities") {
      ({ error } = await supabase.from("movie_similarities").insert(table.rows.slice(start, end)));
    } else if (table.name === "movie_tags") {
      ({ error } = await supabase.from("movie_tags").insert(table.rows.slice(start, end)));
    } else {
      ({ error } = await supabase.from("movie_tag_relevances").insert(table.rows.slice(start, end)));
    }

    if (error) {
      throw new Error(
        `${table.name} insert 실패: rows ${start + 1}-${end}, code=${error.code}, message=${error.message}`,
      );
    }

    console.log(`${table.name}: inserted ${end}/${table.rows.length}`);
  }
}

async function insertMovieSimilarityBatches(
  supabase: SupabaseClient<Database>,
  fileName: string,
) {
  let rows: MovieSimilaritySeedRow[] = [];
  let insertedCount = 0;

  for await (const { row, lineNumber } of readCsvRows(fileName, [
    "source_movie_id",
    "target_movie_id",
    "score",
    "co_rating_count",
  ])) {
    rows.push(parseMovieSimilarity(row, fileName, lineNumber));

    if (rows.length === BATCH_SIZE) {
      await insertBatches(supabase, { name: "movie_similarities", rows });
      insertedCount += rows.length;
      rows = [];
    }
  }

  if (rows.length > 0) {
    await insertBatches(supabase, { name: "movie_similarities", rows });
    insertedCount += rows.length;
  }

  console.log(`movie_similarities: uploaded ${insertedCount} rows`);
}

async function insertMovieTagRelevanceBatches(
  supabase: SupabaseClient<Database>,
  fileName: string,
) {
  let rows: MovieTagRelevanceSeedRow[] = [];
  let insertedCount = 0;

  for await (const { row, lineNumber } of readCsvRows(fileName, [
    "movie_id",
    "tag_id",
    "relevance",
  ])) {
    rows.push(parseMovieTagRelevance(row, fileName, lineNumber));

    if (rows.length === BATCH_SIZE) {
      await insertBatches(supabase, { name: "movie_tag_relevances", rows });
      insertedCount += rows.length;
      rows = [];
    }
  }

  if (rows.length > 0) {
    await insertBatches(supabase, { name: "movie_tag_relevances", rows });
    insertedCount += rows.length;
  }

  console.log(`movie_tag_relevances: uploaded ${insertedCount} rows`);
}

async function main() {
  await loadEnvFiles();

  const validateOnly = process.argv.includes("--validate-only");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!validateOnly && !supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL 환경 변수가 필요합니다.");
  }

  if (!validateOnly && !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다.");
  }

  const [movieStats, movieTags] = await Promise.all([loadMovieStats(), loadMovieTags()]);
  const { movieSimilaritiesCount, movieTagRelevancesCount } = await validateSeedRows(movieStats, movieTags);

  console.log(`movie_stats_seed.csv rows: ${movieStats.length}`);
  console.log(`movie_similarities_seed.csv rows: ${movieSimilaritiesCount}`);
  console.log(`movie_tags_seed.csv rows: ${movieTags.length}`);
  console.log(`movie_tag_relevances_seed.csv rows: ${movieTagRelevancesCount}`);

  if (validateOnly) {
    console.log("Validation completed. Supabase upload was skipped.");
    return;
  }

  const supabase = createClient<Database>(supabaseUrl!, serviceRoleKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  await assertMoviesExist(supabase, collectMovieIds(movieStats));

  await deleteAllRows(supabase, "movie_tag_relevances", "movie_id");
  await deleteAllRows(supabase, "movie_similarities", "source_movie_id");
  await deleteAllRows(supabase, "movie_tags", "tag_id");
  await deleteAllRows(supabase, "movie_stats", "movie_id");

  await insertBatches(supabase, { name: "movie_stats", rows: movieStats });
  await insertMovieSimilarityBatches(supabase, "movie_similarities_seed.csv");
  await insertBatches(supabase, { name: "movie_tags", rows: movieTags });
  await insertMovieTagRelevanceBatches(supabase, "movie_tag_relevances_seed.csv");

  console.log("Movie recommendation seed upload completed.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
