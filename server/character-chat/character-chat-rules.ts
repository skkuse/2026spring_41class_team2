import type {
  CharacterChatEventContext,
  CharacterChatMovieDto,
  CharacterChatSupportedMovieRepoResult,
} from "./character-chat-types"

export const CHARACTER_CHAT_SUPPORTED_MOVIE_IDS = [155, 670]
export const CHARACTER_CHAT_RECENT_MESSAGE_LIMIT = 8
export const CHARACTER_CHAT_EVENT_CONTEXT_LIMIT = 5
export const CHARACTER_CHAT_FALLBACK_QUESTIONS = [
  "그 순간 당신은 무엇을 가장 두려워했나요?",
  "그 선택을 다시 해도 똑같이 할 건가요?",
]

export function mapSupportedMovieDto(
  movie: CharacterChatSupportedMovieRepoResult,
  avatarUrlsByPath: Map<string, string>,
  posterUrl: string | null,
): CharacterChatMovieDto {
  return {
    id: movie.id,
    title: movie.title,
    genres: movie.genres,
    posterUrl: posterUrl ?? "",
    description: movie.overview ?? "",
    actors: unique(movie.characters.flatMap((character) => (character.actorName ? [character.actorName] : []))),
    characters: movie.characters.map((character) => ({
      id: character.id,
      name: character.name,
      description: character.description,
      greeting: character.greeting,
      avatarUrl: avatarUrlsByPath.get(character.avatarStoragePath) ?? "",
      actor:
        character.actorPersonId && character.actorName
          ? { id: character.actorPersonId, name: character.actorName }
          : null,
    })),
  }
}

export function selectRelevantEventContexts(input: {
  message: string
  recentMessages: { content: string }[]
  events: CharacterChatEventContext[]
}) {
  const queryTokens = tokenize([input.message, ...input.recentMessages.slice(-2).map((message) => message.content)].join(" "))
  if (queryTokens.size === 0) {
    return input.events.slice(0, CHARACTER_CHAT_EVENT_CONTEXT_LIMIT)
  }

  return input.events
    .map((event, index) => ({ event, index, score: scoreEvent(queryTokens, event) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, CHARACTER_CHAT_EVENT_CONTEXT_LIMIT)
    .map((item) => item.event)
}

export function normalizeSuggestedQuestions(questions: string[]) {
  const normalized = unique(questions.map((question) => question.trim()).filter(Boolean)).slice(0, 4)
  return normalized.length > 0 ? normalized : CHARACTER_CHAT_FALLBACK_QUESTIONS
}

function scoreEvent(tokens: Set<string>, event: CharacterChatEventContext) {
  const haystack = [
    event.title,
    event.summary,
    event.role,
    event.perspectiveSummary,
    event.emotionalImpact,
    event.knowledgeState,
  ].join(" ")
  const eventTokens = tokenize(haystack)
  let score = 0
  for (const token of tokens) {
    if (eventTokens.has(token)) {
      score += token.length >= 3 ? 2 : 1
    }
  }
  return score
}

function tokenize(text: string) {
  return new Set(
    text
      .toLowerCase()
      .split(/[^0-9a-z가-힣]+/u)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2),
  )
}

function unique<T>(values: T[]) {
  return [...new Set(values)]
}
