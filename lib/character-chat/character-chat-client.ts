export type CharacterChatActor = {
  id: number
  name: string
}

export type CharacterChatCharacter = {
  id: string
  name: string
  description: string
  greeting: string
  avatarUrl: string
  actor: CharacterChatActor | null
}

export type CharacterChatMovie = {
  id: number
  title: string
  genres: { id: number; name: string }[]
  posterUrl: string
  description: string
  actors: string[]
  characters: CharacterChatCharacter[]
}

export type CharacterChatMoviesResponse = {
  movies: CharacterChatMovie[]
}

export type CreateCharacterChatConversationResponse = {
  conversationId: string
  initialMessage: string
  suggestedQuestions: string[]
}

export type CharacterChatConversationMessage = {
  id: string
  role: "user" | "character"
  content: string
  createdAt: string
}

export type GetCharacterChatConversationResponse = {
  conversationId: string | null
  initialMessage: string
  messages: CharacterChatConversationMessage[]
  suggestedQuestions: string[]
}

export type SendCharacterChatMessageResponse = {
  messageId: string
  reply: string
  suggestedQuestions: string[]
  createdAt: string
}

export class CharacterChatApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly requestId?: string,
  ) {
    super(message)
    this.name = "CharacterChatApiError"
  }

  get isUnauthorized() {
    return this.status === 401
  }
}

export async function getCharacterChatMovies(fetchImpl: typeof fetch = fetch): Promise<CharacterChatMoviesResponse> {
  const response = await fetchImpl("/api/character-chat/movies", { cache: "no-store" })
  return parseJsonResponse(response)
}

export async function getCharacterChatConversation(
  input: { movieId: number; characterId: string },
  fetchImpl: typeof fetch = fetch,
): Promise<GetCharacterChatConversationResponse> {
  const params = new URLSearchParams({
    movieId: String(input.movieId),
    characterId: input.characterId,
  })
  const response = await fetchImpl(`/api/character-chat/conversations?${params.toString()}`, { cache: "no-store" })
  return parseJsonResponse(response)
}

export async function createCharacterChatConversation(
  input: { movieId: number; characterId: string },
  fetchImpl: typeof fetch = fetch,
): Promise<CreateCharacterChatConversationResponse> {
  const response = await fetchImpl("/api/character-chat/conversations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })
  return parseJsonResponse(response)
}

export async function sendCharacterChatMessage(
  input: { conversationId: string; message: string },
  fetchImpl: typeof fetch = fetch,
): Promise<SendCharacterChatMessageResponse> {
  const response = await fetchImpl(
    `/api/character-chat/conversations/${encodeURIComponent(input.conversationId)}/messages`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: input.message }),
    },
  )
  return parseJsonResponse(response)
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const error = body?.error
    throw new CharacterChatApiError(
      typeof error?.message === "string" ? error.message : "요청을 처리하지 못했습니다.",
      response.status,
      typeof error?.code === "string" ? error.code : undefined,
      typeof error?.requestId === "string" ? error.requestId : undefined,
    )
  }

  return body as T
}
