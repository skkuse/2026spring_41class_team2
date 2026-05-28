import { describe, expect, it } from "vitest"
import { access, readFile } from "node:fs/promises"
import path from "node:path"

import { darkKnightCharacters } from "../../../data/seeds/character-chat/movies/155/characters.config"
import { darkKnightDefaultQuestions } from "../../../data/seeds/character-chat/movies/155/default-questions.config"
import { darkKnightEvents } from "../../../data/seeds/character-chat/movies/155/events.config"
import { oldboyCharacters } from "../../../data/seeds/character-chat/movies/670/characters.config"
import { oldboyDefaultQuestions } from "../../../data/seeds/character-chat/movies/670/default-questions.config"
import { oldboyEvents } from "../../../data/seeds/character-chat/movies/670/events.config"
import { ROOT_DIR } from "./env"
import { characterChatMovieSeeds } from "./seed-data"
import {
  avatarStoragePath,
  buildCharacterRows,
  buildDefaultQuestionRows,
  buildEventParticipantRows,
  buildEventRows,
  characterId,
  DARK_KNIGHT_MOVIE_ID,
  defaultQuestionId,
  eventId,
  slugify,
  uuidV5,
  validateCharacterConfigs,
  validateDefaultQuestionConfigs,
  validateEventConfigs,
  validatePersonaPrompt,
  writeCsv,
} from "./seed-utils"

const validPrompt = [
  "# 역할",
  "# 말투",
  "# 핵심 동기",
  "# 영화 지식 범위",
  "# 관계 지도",
  "# 사건 기억",
  "# 감정 기준선",
  "# 대화 규칙",
  "# 안전과 연속성",
].join("\n\ncontent\n\n")

function promptsBySlug() {
  return new Map(darkKnightCharacters.map((character) => [character.slug, validPrompt]))
}

async function loadPromptsBySlug(movieId: number, characters: typeof darkKnightCharacters) {
  const prompts = new Map<string, string>()
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
    prompts.set(character.slug, await readFile(path.join(promptDir, character.promptFileName), "utf8"))
  }

  return prompts
}

describe("character chat seed utils", () => {
  it("normalizes slugs", () => {
    expect(slugify("Bruce Wayne")).toBe("bruce-wayne")
    expect(slugify(" Agent   Smith!! ")).toBe("agent-smith")
    expect(slugify("Two--Face")).toBe("two-face")
  })

  it("generates deterministic UUID v5 values with separate names", () => {
    expect(uuidV5("cinemate:test")).toBe(uuidV5("cinemate:test"))
    expect(characterId(155, "joker")).not.toBe(eventId(155, 1))
    expect(defaultQuestionId(155, "joker", 1)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })

  it("writes CSV with stable headers, escaping, and null values", () => {
    const csv = writeCsv(["id", "text", "empty"], [
      {
        id: 1,
        text: "comma, quote \" and\nnewline",
        empty: null,
      },
    ])

    expect(csv).toBe("id,text,empty\n1,\"comma, quote \"\" and\nnewline\",\\N\n")
  })

  it("validates persona prompt required sections", () => {
    expect(() => validatePersonaPrompt(validPrompt, "Bruce Wayne")).not.toThrow()
    expect(() => validatePersonaPrompt("# 역할\nonly role", "Bruce Wayne")).toThrow("필수 섹션")
  })

  it("validates configured characters and builds character rows", () => {
    expect(() => validateCharacterConfigs(darkKnightCharacters, promptsBySlug())).not.toThrow()

    const rows = buildCharacterRows(darkKnightCharacters, promptsBySlug())

    expect(rows).toHaveLength(3)
    expect(rows.map((row) => row.movie_id)).toEqual([DARK_KNIGHT_MOVIE_ID, DARK_KNIGHT_MOVIE_ID, DARK_KNIGHT_MOVIE_ID])
    expect(rows.find((row) => row.name === "브루스 웨인")?.actor_person_id).toBe(3894)
    expect(rows.find((row) => row.name === "조커")?.avatar_storage_path).toBe(avatarStoragePath(155, "joker"))
  })

  it("allows movie-specific Korean character names and builds rows for another movie", () => {
    const oldboyPrompts = new Map(oldboyCharacters.map((character) => [character.slug, validPrompt]))

    expect(() => validateCharacterConfigs(oldboyCharacters, oldboyPrompts, 670)).not.toThrow()

    const rows = buildCharacterRows(oldboyCharacters, oldboyPrompts, 670)

    expect(rows).toHaveLength(3)
    expect(rows.map((row) => row.movie_id)).toEqual([670, 670, 670])
    expect(rows.find((row) => row.name === "오대수")?.actor_person_id).toBe(64880)
    expect(rows.find((row) => row.name === "미도")?.avatar_storage_path).toBe(avatarStoragePath(670, "mi-do"))
    expect(characterId(155, "joker")).not.toBe(characterId(670, "joker"))
  })

  it("rejects character counts outside the movie-level 2 to 4 range", () => {
    expect(() => validateCharacterConfigs([darkKnightCharacters[0]], promptsBySlug())).toThrow("2~4개")
    expect(() =>
      validateCharacterConfigs(
        [
          ...darkKnightCharacters,
          {
            ...darkKnightCharacters[0],
            slug: "extra-one",
            name: "Extra One",
            imageFileName: "extra-one.webp",
            promptFileName: "extra-one.md",
          },
          {
            ...darkKnightCharacters[0],
            slug: "extra-two",
            name: "Extra Two",
            imageFileName: "extra-two.webp",
            promptFileName: "extra-two.md",
          },
        ],
        new Map([
          ...promptsBySlug(),
          ["extra-one", validPrompt],
          ["extra-two", validPrompt],
        ]),
      ),
    ).toThrow("2~4개")
  })

  it("rejects duplicate character slugs", () => {
    expect(() =>
      validateCharacterConfigs(
        [
          ...darkKnightCharacters,
          {
            ...darkKnightCharacters[0],
            name: "Duplicate Bruce",
          },
        ],
        promptsBySlug(),
      ),
    ).toThrow("characters.slug 중복")
  })

  it("validates events and builds event participant rows with deterministic IDs", () => {
    expect(() => validateEventConfigs(darkKnightEvents, darkKnightCharacters)).not.toThrow()

    const eventRows = buildEventRows(darkKnightEvents)
    const participantRows = buildEventParticipantRows(darkKnightEvents)

    expect(eventRows).toHaveLength(11)
    expect(eventRows.map((row) => row.event_order)).toEqual(Array.from({ length: 11 }, (_, index) => index + 1))
    expect(participantRows[0]).toMatchObject({
      event_id: eventId(155, 1),
      character_id: characterId(155, "joker"),
    })
  })

  it("allows movie-level 8 to 15 event configs", () => {
    expect(() => validateEventConfigs(oldboyEvents, oldboyCharacters)).not.toThrow()
    expect(() => validateEventConfigs(darkKnightEvents.slice(0, 7), darkKnightCharacters)).toThrow("8~15개")
    expect(() =>
      validateEventConfigs(
        Array.from({ length: 16 }, (_, index) => ({
          ...darkKnightEvents[0],
          eventOrder: index + 1,
          title: `테스트 사건 ${index + 1}`,
        })),
        darkKnightCharacters,
      ),
    ).toThrow("8~15개")
  })

  it("rejects unknown event participants", () => {
    expect(() =>
      validateEventConfigs(
        [
          {
            ...darkKnightEvents[0],
            participants: [
              ...darkKnightEvents[0].participants,
              {
                ...darkKnightEvents[0].participants[0],
                characterSlug: "unknown",
              },
            ],
          },
          ...darkKnightEvents.slice(1),
        ],
        darkKnightCharacters,
      ),
    ).toThrow("알 수 없는 characterSlug")
  })

  it("validates default questions and strips category from generated rows", () => {
    expect(() => validateDefaultQuestionConfigs(darkKnightDefaultQuestions, darkKnightCharacters)).not.toThrow()

    const rows = buildDefaultQuestionRows(darkKnightDefaultQuestions)

    expect(rows).toHaveLength(12)
    expect(rows.filter((row) => row.character_id === characterId(155, "bruce-wayne")).map((row) => row.display_order)).toEqual([
      1, 2, 3, 4,
    ])
    expect(Object.keys(rows[0])).not.toContain("category")
  })

  it("validates all configured movie seed data and required local assets", async () => {
    expect(characterChatMovieSeeds.map((movieSeed) => movieSeed.movieId)).toEqual([155, 670])

    for (const movieSeed of characterChatMovieSeeds) {
      const prompts = await loadPromptsBySlug(movieSeed.movieId, movieSeed.characters)

      expect(() => validateCharacterConfigs(movieSeed.characters, prompts, movieSeed.movieId)).not.toThrow()
      expect(() => validateEventConfigs(movieSeed.events, movieSeed.characters)).not.toThrow()
      expect(() => validateDefaultQuestionConfigs(movieSeed.defaultQuestions, movieSeed.characters)).not.toThrow()

      for (const character of movieSeed.characters) {
        await expect(
          access(
            path.join(
              ROOT_DIR,
              "data",
              "seeds",
              "character-chat",
              "movies",
              String(movieSeed.movieId),
              "images",
              "characters",
              character.imageFileName,
            ),
          ),
        ).resolves.toBeUndefined()
      }
    }
  })

  it("rejects invalid default question category distribution", () => {
    expect(() =>
      validateDefaultQuestionConfigs(
        darkKnightDefaultQuestions.map((question) =>
          question.characterSlug === "bruce-wayne" && question.displayOrder === 4
            ? { ...question, category: "event" }
            : question,
        ),
        darkKnightCharacters,
      ),
    ).toThrow("category 구성")
  })
})
