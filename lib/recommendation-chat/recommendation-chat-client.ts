export type RecommendationChatMovie = {
  id: number
  title: string
  year: number | null
  rating: number
  genres: { id: number; name: string }[]
  posterUrl: string | null
  reason: string
}

export type RecommendationChatMessage = {
  id: string
  role: "request" | "response"
  content: string
  createdAt: string
  movies: RecommendationChatMovie[]
}

export type RecommendationChatInitialQuestionsResponse = {
  questions: string[]
}

export type SubmitRecommendationChatMessageResponse = {
  conversationId: string
  answer: string
  movies: RecommendationChatMovie[]
}

export type RecommendationChatConversationResponse = {
  conversationId: string | null
  messages: RecommendationChatMessage[]
}

export class RecommendationChatApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly requestId?: string,
  ) {
    super(message)
    this.name = "RecommendationChatApiError"
  }

  get isUnauthorized() {
    return this.status === 401
  }
}

export async function getRecommendationChatInitialQuestions(
  fetchImpl: typeof fetch = fetch,
): Promise<RecommendationChatInitialQuestionsResponse> {
  const response = await fetchImpl("/api/recommendation-chat/initial-questions", { cache: "no-store" })
  return parseJsonResponse(response)
}

export async function submitRecommendationChatMessage(
  input: { message: string },
  fetchImpl: typeof fetch = fetch,
): Promise<SubmitRecommendationChatMessageResponse> {
  const response = await fetchImpl("/api/recommendation-chat/messages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: input.message }),
  })
  return parseJsonResponse(response)
}

export async function getMyRecommendationChatConversation(
  fetchImpl: typeof fetch = fetch,
): Promise<RecommendationChatConversationResponse> {
  const response = await fetchImpl("/api/recommendation-chat/conversation", { cache: "no-store" })
  return parseJsonResponse(response)
}

export async function resetMyRecommendationChatConversation(
  fetchImpl: typeof fetch = fetch,
): Promise<RecommendationChatConversationResponse> {
  const response = await fetchImpl("/api/recommendation-chat/conversation", { method: "DELETE" })
  return parseJsonResponse(response)
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const error = body?.error
    throw new RecommendationChatApiError(
      typeof error?.message === "string" ? error.message : "요청을 처리하지 못했습니다.",
      response.status,
      typeof error?.code === "string" ? error.code : undefined,
      typeof error?.requestId === "string" ? error.requestId : undefined,
    )
  }

  return body as T
}
