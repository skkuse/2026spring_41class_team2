import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ROOT_DIR = process.cwd();
const GENERATED_DIR = path.join(ROOT_DIR, "data", "seeds", "movie-catalog", "generated");
const NULL_VALUE = "\\N";
const BATCH_SIZE = 1000;

type CsvRow = Record<string, string | null>;

type MovieSeedRow = {
  id: number;
  movielens_id: number;
  title: string;
  original_title: string | null;
  overview: string | null;
  release_date: string | null;
  release_year: number | null;
  runtime: number | null;
  original_language: string | null;
  production_countries: string[];
  poster_path: string | null;
  backdrop_path: string | null;
  trailer_url: string | null;
  adult: boolean;
};

type GenreSeedRow = {
  id: number;
  name: string;
  name_ko: string | null;
};

type MovieGenreSeedRow = {
  movie_id: number;
  genre_id: number;
};

type Database = {
  public: {
    Tables: {
      movies: {
        Row: MovieSeedRow & {
          created_at: string;
          updated_at: string;
        };
        Insert: MovieSeedRow;
        Update: Partial<MovieSeedRow>;
        Relationships: [];
      };
      genres: {
        Row: GenreSeedRow;
        Insert: GenreSeedRow;
        Update: Partial<GenreSeedRow>;
        Relationships: [];
      };
      movie_genres: {
        Row: MovieGenreSeedRow;
        Insert: MovieGenreSeedRow;
        Update: Partial<MovieGenreSeedRow>;
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

type SeedTable =
  | {
      name: "movies";
      rows: MovieSeedRow[];
    }
  | {
      name: "genres";
      rows: GenreSeedRow[];
    }
  | {
      name: "movie_genres";
      rows: MovieGenreSeedRow[];
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
    } else if (char === "\r" && !inQuotes && text[i + 1] !== "\n") {
      value += "\n";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r") {
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
    throw new Error("CSV quote가 닫히지 않았습니다.");
  }

  if (value !== "" || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

async function readCsvRows(fileName: string): Promise<CsvRow[]> {
  const filePath = path.join(GENERATED_DIR, fileName);
  const text = await readFile(filePath, "utf8");
  const rows = parseCsv(text);

  if (rows.length === 0) {
    throw new Error(`${fileName}: CSV가 비어 있습니다.`);
  }

  const header = rows[0];

  return rows.slice(1).map((cells, index) => {
    if (cells.length !== header.length) {
      throw new Error(
        `${fileName}:${index + 2}: 컬럼 수가 헤더와 다릅니다. expected=${header.length}, actual=${cells.length}`,
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

function requireString(row: CsvRow, column: string, fileName: string, lineNumber: number) {
  const value = row[column];

  if (value === null || value === "") {
    throw new Error(`${fileName}:${lineNumber}: ${column} 값이 필요합니다.`);
  }

  return value;
}

function optionalString(row: CsvRow, column: string) {
  const value = row[column];
  return value === "" ? null : value;
}

function requireNumber(row: CsvRow, column: string, fileName: string, lineNumber: number) {
  const value = requireString(row, column, fileName, lineNumber);
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${fileName}:${lineNumber}: ${column} 값이 정수가 아닙니다. value=${value}`);
  }

  return parsed;
}

function optionalNumber(row: CsvRow, column: string, fileName: string, lineNumber: number) {
  const value = row[column];

  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${fileName}:${lineNumber}: ${column} 값이 정수가 아닙니다. value=${value}`);
  }

  return parsed;
}

function requireBoolean(row: CsvRow, column: string, fileName: string, lineNumber: number) {
  const value = requireString(row, column, fileName, lineNumber);

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`${fileName}:${lineNumber}: ${column} 값이 boolean이 아닙니다. value=${value}`);
}

function parseProductionCountries(
  row: CsvRow,
  column: string,
  fileName: string,
  lineNumber: number,
) {
  const value = requireString(row, column, fileName, lineNumber);
  const parsed: unknown = JSON.parse(value);

  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
    throw new Error(`${fileName}:${lineNumber}: ${column} 값은 string 배열 JSON이어야 합니다.`);
  }

  return parsed;
}

async function loadMovies(): Promise<MovieSeedRow[]> {
  const fileName = "movies_seed.csv";
  const rows = await readCsvRows(fileName);

  return rows.map((row, index) => {
    const lineNumber = index + 2;

    return {
      id: requireNumber(row, "id", fileName, lineNumber),
      movielens_id: requireNumber(row, "movielens_id", fileName, lineNumber),
      title: requireString(row, "title", fileName, lineNumber),
      original_title: optionalString(row, "original_title"),
      overview: optionalString(row, "overview"),
      release_date: optionalString(row, "release_date"),
      release_year: optionalNumber(row, "release_year", fileName, lineNumber),
      runtime: optionalNumber(row, "runtime", fileName, lineNumber),
      original_language: optionalString(row, "original_language"),
      production_countries: parseProductionCountries(row, "production_countries", fileName, lineNumber),
      poster_path: optionalString(row, "poster_path"),
      backdrop_path: optionalString(row, "backdrop_path"),
      trailer_url: optionalString(row, "trailer_url"),
      adult: requireBoolean(row, "adult", fileName, lineNumber),
    };
  });
}

async function loadGenres(): Promise<GenreSeedRow[]> {
  const fileName = "genres_seed.csv";
  const rows = await readCsvRows(fileName);

  return rows.map((row, index) => {
    const lineNumber = index + 2;

    return {
      id: requireNumber(row, "id", fileName, lineNumber),
      name: requireString(row, "name", fileName, lineNumber),
      name_ko: optionalString(row, "name_ko"),
    };
  });
}

async function loadMovieGenres(): Promise<MovieGenreSeedRow[]> {
  const fileName = "movie_genres_seed.csv";
  const rows = await readCsvRows(fileName);

  return rows.map((row, index) => {
    const lineNumber = index + 2;

    return {
      movie_id: requireNumber(row, "movie_id", fileName, lineNumber),
      genre_id: requireNumber(row, "genre_id", fileName, lineNumber),
    };
  });
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

function validateSeedRows(
  movies: MovieSeedRow[],
  genres: GenreSeedRow[],
  movieGenres: MovieGenreSeedRow[],
) {
  assertNoDuplicates(movies, (row) => String(row.id), "movies.id");
  assertNoDuplicates(movies, (row) => String(row.movielens_id), "movies.movielens_id");
  assertNoDuplicates(genres, (row) => String(row.id), "genres.id");
  assertNoDuplicates(movieGenres, (row) => `${row.movie_id}:${row.genre_id}`, "movie_genres PK");

  const movieIds = new Set(movies.map((row) => row.id));
  const genreIds = new Set(genres.map((row) => row.id));

  for (const row of movieGenres) {
    if (!movieIds.has(row.movie_id)) {
      throw new Error(`movie_genres.movie_id가 movies.id에 없습니다. movie_id=${row.movie_id}`);
    }

    if (!genreIds.has(row.genre_id)) {
      throw new Error(`movie_genres.genre_id가 genres.id에 없습니다. genre_id=${row.genre_id}`);
    }
  }
}

async function deleteAllRows(
  supabase: SupabaseClient<Database>,
  tableName: TableName,
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

    if (table.name === "movies") {
      ({ error } = await supabase.from("movies").insert(table.rows.slice(start, end)));
    } else if (table.name === "genres") {
      ({ error } = await supabase.from("genres").insert(table.rows.slice(start, end)));
    } else {
      ({ error } = await supabase.from("movie_genres").insert(table.rows.slice(start, end)));
    }

    if (error) {
      throw new Error(
        `${table.name} insert 실패: rows ${start + 1}-${end}, code=${error.code}, message=${error.message}`,
      );
    }

    console.log(`${table.name}: inserted ${end}/${table.rows.length}`);
  }
}

async function main() {
  await loadEnvFiles();

  const validateOnly = process.argv.includes("--validate-only");
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!validateOnly && !supabaseUrl) {
    throw new Error("SUPABASE_URL 환경 변수가 필요합니다.");
  }

  if (!validateOnly && !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다.");
  }

  const [movies, genres, movieGenres] = await Promise.all([
    loadMovies(),
    loadGenres(),
    loadMovieGenres(),
  ]);

  validateSeedRows(movies, genres, movieGenres);

  console.log(`movies_seed.csv rows: ${movies.length}`);
  console.log(`genres_seed.csv rows: ${genres.length}`);
  console.log(`movie_genres_seed.csv rows: ${movieGenres.length}`);

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

  await deleteAllRows(supabase, "movie_genres", "movie_id");
  await deleteAllRows(supabase, "movies", "id");
  await deleteAllRows(supabase, "genres", "id");

  await insertBatches(supabase, { name: "genres", rows: genres });
  await insertBatches(supabase, { name: "movies", rows: movies });
  await insertBatches(supabase, { name: "movie_genres", rows: movieGenres });

  console.log("Movie catalog seed upload completed.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
