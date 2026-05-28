import { readFile } from "node:fs/promises"
import path from "node:path"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { getSupabaseServiceEnv, loadEnvFiles, ROOT_DIR } from "./env"
import type {
  CharacterChatDefaultQuestionSeedRow,
  CharacterChatEventParticipantSeedRow,
  CharacterChatEventSeedRow,
  CharacterSeedRow,
} from "./seed-types"

const GENERATED_DIR = path.join(ROOT_DIR, "data", "seeds", "character-chat", "generated")
const NULL_VALUE = "\\N"

type CsvRow = Record<string, string | null>

type CharacterChatDatabase = {
  public: {
    Tables: {
      characters: {
        Row: CharacterSeedRow
        Insert: CharacterSeedRow
        Update: Partial<CharacterSeedRow>
        Relationships: []
      }
      character_chat_events: {
        Row: CharacterChatEventSeedRow
        Insert: CharacterChatEventSeedRow
        Update: Partial<CharacterChatEventSeedRow>
        Relationships: []
      }
      character_chat_event_participants: {
        Row: CharacterChatEventParticipantSeedRow
        Insert: CharacterChatEventParticipantSeedRow
        Update: Partial<CharacterChatEventParticipantSeedRow>
        Relationships: []
      }
      character_chat_default_questions: {
        Row: CharacterChatDefaultQuestionSeedRow
        Insert: CharacterChatDefaultQuestionSeedRow
        Update: Partial<CharacterChatDefaultQuestionSeedRow>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let value = ""
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (char === "\"") {
      if (inQuotes && text[index + 1] === "\"") {
        value += "\""
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      row.push(value)
      value = ""
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[index + 1] === "\n") {
        index += 1
      }

      row.push(value)
      value = ""

      if (row.length > 1 || row[0] !== "") {
        rows.push(row)
      }

      row = []
    } else {
      value += char
    }
  }

  if (inQuotes) {
    throw new Error("CSV quote가 닫히지 않았습니다.")
  }

  if (value !== "" || row.length > 0) {
    row.push(value)
    rows.push(row)
  }

  return rows
}

async function readCsvRows(fileName: string): Promise<CsvRow[]> {
  const text = await readFile(path.join(GENERATED_DIR, fileName), "utf8")
  const rows = parseCsv(text)

  if (rows.length === 0) {
    throw new Error(`${fileName}: CSV가 비어 있습니다.`)
  }

  const header = rows[0]

  return rows.slice(1).map((cells, index) => {
    if (cells.length !== header.length) {
      throw new Error(`${fileName}:${index + 2}: 컬럼 수가 헤더와 다릅니다.`)
    }

    return Object.fromEntries(
      header.map((column, columnIndex) => [column, cells[columnIndex] === NULL_VALUE ? null : cells[columnIndex]]),
    )
  })
}

function requireString(row: CsvRow, column: string, fileName: string, lineNumber: number) {
  const value = row[column]

  if (value === null || value === "") {
    throw new Error(`${fileName}:${lineNumber}: ${column} 값이 필요합니다.`)
  }

  return value
}

function requireNumber(row: CsvRow, column: string, fileName: string, lineNumber: number) {
  const value = requireString(row, column, fileName, lineNumber)
  const parsed = Number(value)

  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${fileName}:${lineNumber}: ${column} 값이 정수가 아닙니다. value=${value}`)
  }

  return parsed
}

async function loadCharacters(): Promise<CharacterSeedRow[]> {
  const fileName = "characters_seed.csv"
  const rows = await readCsvRows(fileName)

  return rows.map((row, index) => ({
    id: requireString(row, "id", fileName, index + 2),
    movie_id: requireNumber(row, "movie_id", fileName, index + 2),
    actor_person_id: requireNumber(row, "actor_person_id", fileName, index + 2),
    name: requireString(row, "name", fileName, index + 2),
    description: requireString(row, "description", fileName, index + 2),
    greeting: requireString(row, "greeting", fileName, index + 2),
    persona_prompt: requireString(row, "persona_prompt", fileName, index + 2),
    avatar_storage_path: requireString(row, "avatar_storage_path", fileName, index + 2),
  }))
}

async function loadEvents(): Promise<CharacterChatEventSeedRow[]> {
  const fileName = "character_chat_events_seed.csv"
  const rows = await readCsvRows(fileName)

  return rows.map((row, index) => ({
    id: requireString(row, "id", fileName, index + 2),
    movie_id: requireNumber(row, "movie_id", fileName, index + 2),
    event_order: requireNumber(row, "event_order", fileName, index + 2),
    title: requireString(row, "title", fileName, index + 2),
    summary: requireString(row, "summary", fileName, index + 2),
  }))
}

async function loadParticipants(): Promise<CharacterChatEventParticipantSeedRow[]> {
  const fileName = "character_chat_event_participants_seed.csv"
  const rows = await readCsvRows(fileName)

  return rows.map((row, index) => ({
    event_id: requireString(row, "event_id", fileName, index + 2),
    character_id: requireString(row, "character_id", fileName, index + 2),
    role: requireString(row, "role", fileName, index + 2),
    perspective_summary: requireString(row, "perspective_summary", fileName, index + 2),
    emotional_impact: requireString(row, "emotional_impact", fileName, index + 2),
    knowledge_state: requireString(row, "knowledge_state", fileName, index + 2),
  }))
}

async function loadDefaultQuestions(): Promise<CharacterChatDefaultQuestionSeedRow[]> {
  const fileName = "character_chat_default_questions_seed.csv"
  const rows = await readCsvRows(fileName)

  return rows.map((row, index) => ({
    id: requireString(row, "id", fileName, index + 2),
    character_id: requireString(row, "character_id", fileName, index + 2),
    question: requireString(row, "question", fileName, index + 2),
    display_order: requireNumber(row, "display_order", fileName, index + 2),
  }))
}

function assertNoDuplicates<T>(rows: T[], getKey: (row: T) => string, label: string) {
  const seen = new Set<string>()

  for (const row of rows) {
    const key = getKey(row)

    if (seen.has(key)) {
      throw new Error(`${label} 중복 값이 있습니다. key=${key}`)
    }

    seen.add(key)
  }
}

function validateSeedRows(
  characters: CharacterSeedRow[],
  events: CharacterChatEventSeedRow[],
  participants: CharacterChatEventParticipantSeedRow[],
  defaultQuestions: CharacterChatDefaultQuestionSeedRow[],
) {
  assertNoDuplicates(characters, (row) => row.id, "characters.id")
  assertNoDuplicates(events, (row) => row.id, "character_chat_events.id")
  assertNoDuplicates(participants, (row) => `${row.event_id}:${row.character_id}`, "character_chat_event_participants PK")
  assertNoDuplicates(defaultQuestions, (row) => row.id, "character_chat_default_questions.id")
  assertNoDuplicates(defaultQuestions, (row) => `${row.character_id}:${row.display_order}`, "character_chat_default_questions character/order")

  const characterIds = new Set(characters.map((row) => row.id))
  const eventIds = new Set(events.map((row) => row.id))

  for (const participant of participants) {
    if (!eventIds.has(participant.event_id)) {
      throw new Error(`participant.event_id가 events.id에 없습니다. event_id=${participant.event_id}`)
    }

    if (!characterIds.has(participant.character_id)) {
      throw new Error(`participant.character_id가 characters.id에 없습니다. character_id=${participant.character_id}`)
    }
  }

  for (const question of defaultQuestions) {
    if (!characterIds.has(question.character_id)) {
      throw new Error(`default_question.character_id가 characters.id에 없습니다. character_id=${question.character_id}`)
    }
  }
}

async function upsertSeedRows(
  supabase: SupabaseClient<CharacterChatDatabase>,
  characters: CharacterSeedRow[],
  events: CharacterChatEventSeedRow[],
  participants: CharacterChatEventParticipantSeedRow[],
  defaultQuestions: CharacterChatDefaultQuestionSeedRow[],
) {
  const operations = [
    supabase.from("characters").upsert(characters, { onConflict: "id" }),
    supabase.from("character_chat_events").upsert(events, { onConflict: "id" }),
    supabase.from("character_chat_event_participants").upsert(participants, { onConflict: "event_id,character_id" }),
    supabase.from("character_chat_default_questions").upsert(defaultQuestions, { onConflict: "id" }),
  ]

  for (const operation of operations) {
    const { error } = await operation

    if (error) {
      throw new Error(`character chat seed upsert 실패: ${error.message}`)
    }
  }
}

async function main() {
  await loadEnvFiles()

  const validateOnly = process.argv.includes("--validate-only")
  const [characters, events, participants, defaultQuestions] = await Promise.all([
    loadCharacters(),
    loadEvents(),
    loadParticipants(),
    loadDefaultQuestions(),
  ])

  validateSeedRows(characters, events, participants, defaultQuestions)

  console.log(`characters_seed.csv rows: ${characters.length}`)
  console.log(`character_chat_events_seed.csv rows: ${events.length}`)
  console.log(`character_chat_event_participants_seed.csv rows: ${participants.length}`)
  console.log(`character_chat_default_questions_seed.csv rows: ${defaultQuestions.length}`)

  if (validateOnly) {
    console.log("Validation completed. Supabase upload was skipped.")
    return
  }

  const { supabaseUrl, serviceRoleKey } = getSupabaseServiceEnv()
  const supabase = createClient<CharacterChatDatabase>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  await upsertSeedRows(supabase, characters, events, participants, defaultQuestions)

  console.log("Character chat seed upload completed.")
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
