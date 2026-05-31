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

export type RecommendationChatDebugQuestion = {
  id: string
  text: string
  isBuggy: boolean
  createdAt: string
}

export type RecommendationChatDebugQuestionsResponse = {
  questions: RecommendationChatDebugQuestion[]
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

export type RecommendationChatDebugRunStatus = "success" | "unsupported" | "no_candidate" | "error"

export type RecommendationChatFailureStage =
  | "analysis"
  | "reason_generation"
  | "embedding"
  | "tag_mapping"
  | "candidate_query"
  | "persistence"
  | "response_validation"
  | "unsupported"
  | "auth"
  | "unknown"

export type RecommendationChatDebugRunResponse = {
  conversationId: string | null
  status: RecommendationChatDebugRunStatus
  trace: {
    availableOptions: {
      genres: { id: number; name: string; nameKo: string | null }[]
      countries: { code: string }[]
      languages: { code: string }[]
    } | null
    recentExchanges: { request: string; response: string; movies: { id: number; title: string }[] }[]
    excludedMovieIds: number[]
    rawAnalysis: RecommendationChatAnalysis | null
    normalizedAnalysis: RecommendationChatAnalysis | null
    filters: RecommendationChatFilters | null
    embeddingInputs: string[]
    mappedTagsByUserTag: Record<string, { userTag: string; tagId: number; tag: string; relevance: number }[]>
    candidateQueryType: "tagged" | "tagless" | null
    candidateCount: number | null
    selectedMovies: { id: number; title: string; year: number | null; matchedUserTags: string[] }[]
    generatedReasons: Record<string, string>
    answer: string | null
    movies: RecommendationChatMovie[]
    failureStage: string | null
    error: { name: string; message: string; cause?: { name: string; message: string }[] } | null
  }
}

export type RecommendationChatAnalysis = {
  intent: "new_recommendation" | "refine_recommendation" | "unsupported"
  genreIds: number[]
  countryCodes: string[]
  languageCodes: string[]
  yearRange: RecommendationChatRange | null
  runtimeRange: RecommendationChatRange | null
  userTagQueries: { userTag: string; embeddingTerms: string[] }[]
  excludedTerms: string[]
  confidence: number
}

export type RecommendationChatRange = {
  from: number | null
  to: number | null
}

export type RecommendationChatFilters = {
  genreIds: number[]
  countryCodes: string[]
  languageCodes: string[]
  yearRange: RecommendationChatRange | null
  runtimeRange: RecommendationChatRange | null
}

export class RecommendationChatApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly requestId?: string,
    public readonly failureStage?: RecommendationChatFailureStage,
    public readonly failureSource?: string,
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

export async function getRecommendationChatDebugQuestions(
  fetchImpl: typeof fetch = fetch,
): Promise<RecommendationChatDebugQuestionsResponse> {
  const response = await fetchImpl("/api/recommendation-chat/debug/questions", { cache: "no-store" })
  return parseJsonResponse(response)
}

export async function createRecommendationChatDebugQuestion(
  input: { text: string },
  fetchImpl: typeof fetch = fetch,
): Promise<{ question: RecommendationChatDebugQuestion }> {
  const response = await fetchImpl("/api/recommendation-chat/debug/questions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: input.text }),
  })
  return parseJsonResponse(response)
}

export async function deleteRecommendationChatDebugQuestion(
  input: { questionId: string },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(`/api/recommendation-chat/debug/questions/${input.questionId}`, {
    method: "DELETE",
  })
  if (response.status === 204) {
    return
  }
  return parseJsonResponse(response)
}

export async function updateRecommendationChatDebugQuestion(
  input: { questionId: string; isBuggy: boolean },
  fetchImpl: typeof fetch = fetch,
): Promise<{ question: RecommendationChatDebugQuestion }> {
  const response = await fetchImpl(`/api/recommendation-chat/debug/questions/${input.questionId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ isBuggy: input.isBuggy }),
  })
  return parseJsonResponse(response)
}

export async function runRecommendationChatDebug(
  input: { message: string },
  fetchImpl: typeof fetch = fetch,
): Promise<RecommendationChatDebugRunResponse> {
  const response = await fetchImpl("/api/recommendation-chat/debug/runs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: input.message }),
  })
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
      parseRecommendationChatFailureStage(error?.details),
      parseRecommendationChatFailureSource(error?.details),
    )
  }

  return body as T
}

function parseRecommendationChatFailureStage(details: unknown) {
  if (!details || typeof details !== "object" || !("failureStage" in details)) {
    return undefined
  }

  const failureStage = details.failureStage
  return isRecommendationChatFailureStage(failureStage) ? failureStage : undefined
}

function parseRecommendationChatFailureSource(details: unknown) {
  if (!details || typeof details !== "object" || !("failureSource" in details)) {
    return undefined
  }

  return typeof details.failureSource === "string" ? details.failureSource : undefined
}

function isRecommendationChatFailureStage(value: unknown): value is RecommendationChatFailureStage {
  return (
    value === "analysis" ||
    value === "reason_generation" ||
    value === "embedding" ||
    value === "tag_mapping" ||
    value === "candidate_query" ||
    value === "persistence" ||
    value === "response_validation" ||
    value === "unsupported" ||
    value === "auth" ||
    value === "unknown"
  )
}
