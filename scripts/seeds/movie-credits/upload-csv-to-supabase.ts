import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ROOT_DIR = process.cwd();
const GENERATED_DIR = path.join(ROOT_DIR, "data", "seeds", "movie-credits", "generated");
const NULL_VALUE = "\\N";
const BATCH_SIZE = 1000;
const MOVIE_ID_LOOKUP_BATCH_SIZE = 500;

type CsvRow = Record<string, string | null>;

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

type MovieRow = {
  id: number;
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
      people: {
        Row: PersonSeedRow & {
          created_at: string;
          updated_at: string;
        };
        Insert: PersonSeedRow;
        Update: Partial<PersonSeedRow>;
        Relationships: [];
      };
      movie_casts: {
        Row: MovieCastSeedRow;
        Insert: MovieCastSeedRow;
        Update: Partial<MovieCastSeedRow>;
        Relationships: [];
      };
      movie_crew: {
        Row: MovieCrewSeedRow;
        Insert: MovieCrewSeedRow;
        Update: Partial<MovieCrewSeedRow>;
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
      name: "people";
      rows: PersonSeedRow[];
    }
  | {
      name: "movie_casts";
      rows: MovieCastSeedRow[];
    }
  | {
      name: "movie_crew";
      rows: MovieCrewSeedRow[];
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

function optionalDecimal(row: CsvRow, column: string, fileName: string, lineNumber: number) {
  const value = row[column];

  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${fileName}:${lineNumber}: ${column} 값이 숫자가 아닙니다. value=${value}`);
  }

  return parsed;
}

async function loadPeople(): Promise<PersonSeedRow[]> {
  const fileName = "people_seed.csv";
  const rows = await readCsvRows(fileName);

  return rows.map((row, index) => {
    const lineNumber = index + 2;

    return {
      id: requireNumber(row, "id", fileName, lineNumber),
      name: requireString(row, "name", fileName, lineNumber),
      profile_path: optionalString(row, "profile_path"),
      known_for_department: optionalString(row, "known_for_department"),
      popularity: optionalDecimal(row, "popularity", fileName, lineNumber),
    };
  });
}

async function loadMovieCasts(): Promise<MovieCastSeedRow[]> {
  const fileName = "movie_casts_seed.csv";
  const rows = await readCsvRows(fileName);

  return rows.map((row, index) => {
    const lineNumber = index + 2;

    return {
      movie_id: requireNumber(row, "movie_id", fileName, lineNumber),
      person_id: requireNumber(row, "person_id", fileName, lineNumber),
      character_name: requireString(row, "character_name", fileName, lineNumber),
      cast_order: optionalNumber(row, "cast_order", fileName, lineNumber),
    };
  });
}

async function loadMovieCrew(): Promise<MovieCrewSeedRow[]> {
  const fileName = "movie_crew_seed.csv";
  const rows = await readCsvRows(fileName);

  return rows.map((row, index) => {
    const lineNumber = index + 2;

    return {
      movie_id: requireNumber(row, "movie_id", fileName, lineNumber),
      person_id: requireNumber(row, "person_id", fileName, lineNumber),
      department: requireString(row, "department", fileName, lineNumber),
      job: requireString(row, "job", fileName, lineNumber),
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
  people: PersonSeedRow[],
  movieCasts: MovieCastSeedRow[],
  movieCrew: MovieCrewSeedRow[],
) {
  assertNoDuplicates(people, (row) => String(row.id), "people.id");
  assertNoDuplicates(
    movieCasts,
    (row) => `${row.movie_id}\u0000${row.person_id}\u0000${row.character_name}`,
    "movie_casts PK",
  );
  assertNoDuplicates(
    movieCrew,
    (row) => `${row.movie_id}\u0000${row.person_id}\u0000${row.department}\u0000${row.job}`,
    "movie_crew PK",
  );

  const personIds = new Set(people.map((row) => row.id));

  for (const row of movieCasts) {
    if (!personIds.has(row.person_id)) {
      throw new Error(`movie_casts.person_id가 people.id에 없습니다. person_id=${row.person_id}`);
    }
  }

  for (const row of movieCrew) {
    if (!personIds.has(row.person_id)) {
      throw new Error(`movie_crew.person_id가 people.id에 없습니다. person_id=${row.person_id}`);
    }

    if (row.job !== "Director") {
      throw new Error(`movie_crew.job은 Director만 허용합니다. movie_id=${row.movie_id}, job=${row.job}`);
    }
  }
}

function collectMovieIds(movieCasts: MovieCastSeedRow[], movieCrew: MovieCrewSeedRow[]) {
  return [...new Set([...movieCasts.map((row) => row.movie_id), ...movieCrew.map((row) => row.movie_id)])];
}

async function assertMoviesExist(
  supabase: SupabaseClient<Database>,
  movieIds: number[],
) {
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

    if (table.name === "people") {
      ({ error } = await supabase.from("people").insert(table.rows.slice(start, end)));
    } else if (table.name === "movie_casts") {
      ({ error } = await supabase.from("movie_casts").insert(table.rows.slice(start, end)));
    } else {
      ({ error } = await supabase.from("movie_crew").insert(table.rows.slice(start, end)));
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!validateOnly && !supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL 환경 변수가 필요합니다.");
  }

  if (!validateOnly && !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다.");
  }

  const [people, movieCasts, movieCrew] = await Promise.all([
    loadPeople(),
    loadMovieCasts(),
    loadMovieCrew(),
  ]);

  validateSeedRows(people, movieCasts, movieCrew);

  console.log(`people_seed.csv rows: ${people.length}`);
  console.log(`movie_casts_seed.csv rows: ${movieCasts.length}`);
  console.log(`movie_crew_seed.csv rows: ${movieCrew.length}`);

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

  await assertMoviesExist(supabase, collectMovieIds(movieCasts, movieCrew));

  await deleteAllRows(supabase, "movie_crew", "movie_id");
  await deleteAllRows(supabase, "movie_casts", "movie_id");
  await deleteAllRows(supabase, "people", "id");

  await insertBatches(supabase, { name: "people", rows: people });
  await insertBatches(supabase, { name: "movie_casts", rows: movieCasts });
  await insertBatches(supabase, { name: "movie_crew", rows: movieCrew });

  console.log("Movie credits seed upload completed.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
