import { createHash } from "node:crypto"

import type {
  CharacterChatDefaultQuestionConfig,
  CharacterChatEventConfig,
  CharacterSeedRow,
  CharacterChatEventParticipantSeedRow,
  CharacterChatEventSeedRow,
  CharacterChatCharacterConfig,
  CharacterChatDefaultQuestionSeedRow,
} from "./seed-types"

export const DARK_KNIGHT_MOVIE_ID = 155
export const CHARACTER_IMAGE_BUCKET = "character-images"
export const REQUIRED_PERSONA_SECTIONS = [
  "# 역할",
  "# 말투",
  "# 핵심 동기",
  "# 영화 지식 범위",
  "# 관계 지도",
  "# 사건 기억",
  "# 감정 기준선",
  "# 대화 규칙",
  "# 안전과 연속성",
] as const

const NULL_VALUE = "\\N"
const DNS_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function uniqueTextKey(value: string) {
  return slugify(value) || value.trim().toLowerCase()
}

function uuidToBytes(uuid: string) {
  const hex = uuid.replaceAll("-", "")

  if (!/^[0-9a-f]{32}$/i.test(hex)) {
    throw new Error(`UUID namespace 형식이 올바르지 않습니다. namespace=${uuid}`)
  }

  return Buffer.from(hex, "hex")
}

function bytesToUuid(bytes: Buffer) {
  const hex = bytes.toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

export function uuidV5(name: string, namespace = DNS_NAMESPACE) {
  const hash = createHash("sha1").update(uuidToBytes(namespace)).update(name).digest()
  const bytes = Buffer.from(hash.subarray(0, 16))
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return bytesToUuid(bytes)
}

export function characterId(movieId: number, characterSlug: string) {
  return uuidV5(`cinemate:character-chat:movie:${movieId}:character:${characterSlug}`)
}

export function eventId(movieId: number, eventOrder: number) {
  return uuidV5(`cinemate:character-chat:movie:${movieId}:event:${eventOrder}`)
}

export function defaultQuestionId(movieId: number, characterSlug: string, displayOrder: number) {
  return uuidV5(`cinemate:character-chat:movie:${movieId}:character:${characterSlug}:default-question:${displayOrder}`)
}

export function avatarStoragePath(movieId: number, characterSlug: string) {
  return `movies/${movieId}/characters/${characterSlug}.webp`
}

export function escapeCsvValue(value: string | number | null) {
  if (value === null) {
    return NULL_VALUE
  }

  const text = String(value)

  if (text.includes(",") || text.includes("\"") || text.includes("\n") || text.includes("\r")) {
    return `"${text.replaceAll("\"", "\"\"")}"`
  }

  return text
}

export function writeCsv<T extends Record<string, string | number | null>>(headers: (keyof T & string)[], rows: T[]) {
  return `${[headers.join(","), ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(","))].join("\n")}\n`
}

function assertNonEmpty(value: string, label: string, errors: string[]) {
  if (value.trim().length === 0) {
    errors.push(`${label} 값이 필요합니다.`)
  }
}

function assertNoDuplicates<T>(items: T[], getKey: (item: T) => string, label: string, errors: string[]) {
  const seen = new Set<string>()

  for (const item of items) {
    const key = getKey(item)

    if (seen.has(key)) {
      errors.push(`${label} 중복 값이 있습니다. key=${key}`)
    }

    seen.add(key)
  }
}

export function validatePersonaPrompt(prompt: string, label: string) {
  const missingSections = REQUIRED_PERSONA_SECTIONS.filter((section) => !prompt.includes(section))

  if (missingSections.length > 0) {
    throw new Error(`${label}: persona prompt 필수 섹션이 없습니다. sections=${missingSections.join(", ")}`)
  }
}

export function validateCharacterConfigs(
  characters: CharacterChatCharacterConfig[],
  promptsBySlug: Map<string, string>,
  movieId = DARK_KNIGHT_MOVIE_ID,
) {
  const errors: string[] = []

  if (characters.length < 2 || characters.length > 4) {
    errors.push(`characters는 영화별 2~4개여야 합니다. movieId=${movieId}, actual=${characters.length}`)
  }

  assertNoDuplicates(characters, (character) => character.slug, "characters.slug", errors)
  assertNoDuplicates(characters, (character) => character.name, "characters.name", errors)

  for (const character of characters) {
    const normalizedName = slugify(character.name)

    if (normalizedName && normalizedName !== character.slug) {
      errors.push(`${character.name}: slug가 name 정규화 결과와 다릅니다. expected=${slugify(character.name)}`)
    }

    if (!Number.isSafeInteger(character.actorPersonId) || character.actorPersonId <= 0) {
      errors.push(`${character.name}: actorPersonId는 양의 정수여야 합니다. actorPersonId=${character.actorPersonId}`)
    }

    if (character.imageFileName !== `${character.slug}.webp`) {
      errors.push(`${character.name}: imageFileName은 ${character.slug}.webp 이어야 합니다.`)
    }

    if (character.promptFileName !== `${character.slug}.md`) {
      errors.push(`${character.name}: promptFileName은 ${character.slug}.md 이어야 합니다.`)
    }

    assertNonEmpty(character.description, `${character.name}.description`, errors)
    assertNonEmpty(character.greeting, `${character.name}.greeting`, errors)

    const prompt = promptsBySlug.get(character.slug)

    if (!prompt) {
      errors.push(`${character.name}: persona prompt 파일이 필요합니다.`)
    } else {
      try {
        validatePersonaPrompt(prompt, character.name)
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error))
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"))
  }
}

export function validateEventConfigs(events: CharacterChatEventConfig[], characters: CharacterChatCharacterConfig[]) {
  const errors: string[] = []
  const characterSlugs = new Set(characters.map((character) => character.slug))

  if (events.length < 8 || events.length > 15) {
    errors.push(`events는 영화별 8~15개여야 합니다. actual=${events.length}`)
  }

  assertNoDuplicates(events, (event) => String(event.eventOrder), "events.eventOrder", errors)
  assertNoDuplicates(events, (event) => uniqueTextKey(event.title), "events.title slug", errors)

  const eventOrders = events.map((event) => event.eventOrder).sort((a, b) => a - b)
  eventOrders.forEach((eventOrder, index) => {
    if (eventOrder !== index + 1) {
      errors.push(`events.eventOrder는 1부터 연속이어야 합니다. expected=${index + 1}, actual=${eventOrder}`)
    }
  })

  for (const event of events) {
    assertNonEmpty(event.title, `event ${event.eventOrder}.title`, errors)
    assertNonEmpty(event.summary, `event ${event.eventOrder}.summary`, errors)

    if (event.participants.length === 0) {
      errors.push(`event ${event.eventOrder}: participant가 최소 1명 필요합니다.`)
    }

    assertNoDuplicates(
      event.participants,
      (participant) => participant.characterSlug,
      `event ${event.eventOrder}.participants.characterSlug`,
      errors,
    )

    for (const participant of event.participants) {
      if (!characterSlugs.has(participant.characterSlug)) {
        errors.push(`event ${event.eventOrder}: 알 수 없는 characterSlug입니다. characterSlug=${participant.characterSlug}`)
      }

      assertNonEmpty(participant.role, `event ${event.eventOrder}.${participant.characterSlug}.role`, errors)
      assertNonEmpty(participant.perspectiveSummary, `event ${event.eventOrder}.${participant.characterSlug}.perspectiveSummary`, errors)
      assertNonEmpty(participant.emotionalImpact, `event ${event.eventOrder}.${participant.characterSlug}.emotionalImpact`, errors)
      assertNonEmpty(participant.knowledgeState, `event ${event.eventOrder}.${participant.characterSlug}.knowledgeState`, errors)
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"))
  }
}

export function validateDefaultQuestionConfigs(
  questions: CharacterChatDefaultQuestionConfig[],
  characters: CharacterChatCharacterConfig[],
) {
  const errors: string[] = []
  const characterSlugs = new Set(characters.map((character) => character.slug))

  for (const question of questions) {
    if (!characterSlugs.has(question.characterSlug)) {
      errors.push(`default question: 알 수 없는 characterSlug입니다. characterSlug=${question.characterSlug}`)
    }

    assertNonEmpty(question.question, `${question.characterSlug}.${question.displayOrder}.question`, errors)
  }

  for (const character of characters) {
    const characterQuestions = questions.filter((question) => question.characterSlug === character.slug)
    const orders = characterQuestions.map((question) => question.displayOrder).sort((a, b) => a - b)
    const categoryCounts = characterQuestions.reduce<Record<string, number>>((counts, question) => {
      counts[question.category] = (counts[question.category] ?? 0) + 1
      return counts
    }, {})

    if (characterQuestions.length !== 4) {
      errors.push(`${character.slug}: default question은 정확히 4개여야 합니다. actual=${characterQuestions.length}`)
    }

    if (orders.join(",") !== "1,2,3,4") {
      errors.push(`${character.slug}: displayOrder는 1,2,3,4여야 합니다. actual=${orders.join(",")}`)
    }

    if (categoryCounts.event !== 2 || categoryCounts.relationship !== 1 || categoryCounts.identity !== 1) {
      errors.push(`${character.slug}: category 구성은 event 2, relationship 1, identity 1이어야 합니다.`)
    }

    assertNoDuplicates(
      characterQuestions,
      (question) => question.question,
      `${character.slug}.question`,
      errors,
    )
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"))
  }
}

export function buildCharacterRows(
  characters: CharacterChatCharacterConfig[],
  promptsBySlug: Map<string, string>,
  movieId = DARK_KNIGHT_MOVIE_ID,
): CharacterSeedRow[] {
  return characters.map((character) => ({
    id: characterId(movieId, character.slug),
    movie_id: movieId,
    actor_person_id: character.actorPersonId,
    name: character.name,
    description: character.description,
    greeting: character.greeting,
    persona_prompt: promptsBySlug.get(character.slug) ?? "",
    avatar_storage_path: avatarStoragePath(movieId, character.slug),
  }))
}

export function buildEventRows(events: CharacterChatEventConfig[], movieId = DARK_KNIGHT_MOVIE_ID): CharacterChatEventSeedRow[] {
  return events.map((event) => ({
    id: eventId(movieId, event.eventOrder),
    movie_id: movieId,
    event_order: event.eventOrder,
    title: event.title,
    summary: event.summary,
  }))
}

export function buildEventParticipantRows(
  events: CharacterChatEventConfig[],
  movieId = DARK_KNIGHT_MOVIE_ID,
): CharacterChatEventParticipantSeedRow[] {
  return events.flatMap((event) =>
    event.participants.map((participant) => ({
      event_id: eventId(movieId, event.eventOrder),
      character_id: characterId(movieId, participant.characterSlug),
      role: participant.role,
      perspective_summary: participant.perspectiveSummary,
      emotional_impact: participant.emotionalImpact,
      knowledge_state: participant.knowledgeState,
    })),
  )
}

export function buildDefaultQuestionRows(
  questions: CharacterChatDefaultQuestionConfig[],
  movieId = DARK_KNIGHT_MOVIE_ID,
): CharacterChatDefaultQuestionSeedRow[] {
  return questions.map((question) => ({
    id: defaultQuestionId(movieId, question.characterSlug, question.displayOrder),
    character_id: characterId(movieId, question.characterSlug),
    question: question.question,
    display_order: question.displayOrder,
  }))
}
