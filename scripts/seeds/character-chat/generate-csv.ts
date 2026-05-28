import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { ROOT_DIR } from "./env"
import { characterChatMovieSeeds } from "./seed-data"
import type {
  CharacterChatDefaultQuestionSeedRow,
  CharacterChatEventParticipantSeedRow,
  CharacterChatEventSeedRow,
  CharacterSeedRow,
} from "./seed-types"
import {
  buildCharacterRows,
  buildDefaultQuestionRows,
  buildEventParticipantRows,
  buildEventRows,
  validateCharacterConfigs,
  validateDefaultQuestionConfigs,
  validateEventConfigs,
  writeCsv,
} from "./seed-utils"

const GENERATED_DIR = path.join(ROOT_DIR, "data", "seeds", "character-chat", "generated")

export async function loadPersonaPrompts(movieId: number, characters = characterChatMovieSeeds.find((movie) => movie.movieId === movieId)?.characters) {
  if (!characters) {
    throw new Error(`알 수 없는 character chat movie seed입니다. movieId=${movieId}`)
  }

  const promptsBySlug = new Map<string, string>()
  const promptDir = path.join(
    ROOT_DIR,
    "data",
    "seeds",
    "character-chat",
    "movies",
    String(movieId),
    "prompts",
    "characters",
  )

  for (const character of characters) {
    const prompt = await readFile(path.join(promptDir, character.promptFileName), "utf8")
    promptsBySlug.set(character.slug, prompt.trim())
  }

  return promptsBySlug
}

export async function generateCharacterChatCsvFiles() {
  const characterRows: CharacterSeedRow[] = []
  const eventRows: CharacterChatEventSeedRow[] = []
  const participantRows: CharacterChatEventParticipantSeedRow[] = []
  const defaultQuestionRows: CharacterChatDefaultQuestionSeedRow[] = []

  for (const movieSeed of characterChatMovieSeeds) {
    const promptsBySlug = await loadPersonaPrompts(movieSeed.movieId, movieSeed.characters)

    validateCharacterConfigs(movieSeed.characters, promptsBySlug, movieSeed.movieId)
    validateEventConfigs(movieSeed.events, movieSeed.characters)
    validateDefaultQuestionConfigs(movieSeed.defaultQuestions, movieSeed.characters)

    characterRows.push(...buildCharacterRows(movieSeed.characters, promptsBySlug, movieSeed.movieId))
    eventRows.push(...buildEventRows(movieSeed.events, movieSeed.movieId))
    participantRows.push(...buildEventParticipantRows(movieSeed.events, movieSeed.movieId))
    defaultQuestionRows.push(...buildDefaultQuestionRows(movieSeed.defaultQuestions, movieSeed.movieId))
  }

  await mkdir(GENERATED_DIR, { recursive: true })
  await writeFile(
    path.join(GENERATED_DIR, "characters_seed.csv"),
    writeCsv(
      ["id", "movie_id", "actor_person_id", "name", "description", "greeting", "persona_prompt", "avatar_storage_path"],
      characterRows,
    ),
  )
  await writeFile(
    path.join(GENERATED_DIR, "character_chat_events_seed.csv"),
    writeCsv(["id", "movie_id", "event_order", "title", "summary"], eventRows),
  )
  await writeFile(
    path.join(GENERATED_DIR, "character_chat_event_participants_seed.csv"),
    writeCsv(
      ["event_id", "character_id", "role", "perspective_summary", "emotional_impact", "knowledge_state"],
      participantRows,
    ),
  )
  await writeFile(
    path.join(GENERATED_DIR, "character_chat_default_questions_seed.csv"),
    writeCsv(["id", "character_id", "question", "display_order"], defaultQuestionRows),
  )

  return {
    characters: characterRows.length,
    events: eventRows.length,
    participants: participantRows.length,
    defaultQuestions: defaultQuestionRows.length,
  }
}

async function main() {
  const report = await generateCharacterChatCsvFiles()

  console.log(`characters_seed.csv rows: ${report.characters}`)
  console.log(`character_chat_events_seed.csv rows: ${report.events}`)
  console.log(`character_chat_event_participants_seed.csv rows: ${report.participants}`)
  console.log(`character_chat_default_questions_seed.csv rows: ${report.defaultQuestions}`)
}

if (process.env.NODE_ENV !== "test") {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
