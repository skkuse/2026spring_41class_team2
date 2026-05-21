import type { RequestContext } from "@/server/auth/auth-types"

// HTTP DTO
export type RecommendationChatMovieDto = {
  id: number
  title: string
  year: number | null
  rating: number
  genres: { id: number; name: string }[]
  posterUrl: string | null
  reason: string
}

export type RecommendationChatMessageDto = {
  id: string
  role: "request" | "response"
  content: string
  createdAt: string
  movies: RecommendationChatMovieDto[]
}

export type InitialQuestionsResponseDto = {
  questions: string[]
}

export type SubmitRecommendationChatMessageRequestDto = {
  message: string
}

export type SubmitRecommendationChatMessageResponseDto = {
  conversationId: string
  answer: string
  movies: RecommendationChatMovieDto[]
}

export type GetRecommendationChatConversationResponseDto = {
  conversationId: string | null
  messages: RecommendationChatMessageDto[]
}

// Service input
export type SubmitRecommendationChatMessageInput = {
  message: string
}

export type RecommendationChatAnalysis = {
  intent: "new_recommendation" | "refine_recommendation" | "unsupported"
  genreIds: number[]
  countryCodes: string[]
  languageCodes: string[]
  yearRange: { from: number | null; to: number | null } | null
  runtimeRange: { from: number | null; to: number | null } | null
  userTagQueries: RecommendationChatUserTagQuery[]
  excludedTerms: string[]
  confidence: number
}

export type RecommendationChatUserTagQuery = {
  userTag: string
  embeddingTerms: string[]
}

export type RecommendationChatFilters = Omit<
  RecommendationChatAnalysis,
  "intent" | "userTagQueries" | "excludedTerms" | "confidence"
>

export type RecommendationChatService = {
  listInitialQuestions(): InitialQuestionsResponseDto
  submitRecommendationChatMessage(
    context: RequestContext,
    input: SubmitRecommendationChatMessageInput,
  ): Promise<SubmitRecommendationChatMessageResponseDto>
  getMyRecommendationChatConversation(context: RequestContext): Promise<GetRecommendationChatConversationResponseDto>
  resetMyRecommendationChatConversation(context: RequestContext): Promise<GetRecommendationChatConversationResponseDto>
}

// Domain
export type AvailableRecommendationChatOptions = {
  genres: { id: number; name: string; nameKo: string | null }[]
  countries: { code: string }[]
  languages: { code: string }[]
}

export type RecommendationChatRecentExchange = {
  request: string
  response: string
  movies: { id: number; title: string }[]
}

export type RecommendationChatSelectedMovie = RecommendationChatCandidate & {
  matchedUserTags: string[]
}

export type RecommendationChatMappedTag = {
  userTag: string
  tagId: number
  relevance: number
}

// Repository params
export type FindConversationByUserIdRepoParams = {
  userId: string
}

export type FindOrCreateConversationRepoParams = {
  userId: string
}

export type DeleteConversationByUserIdRepoParams = {
  userId: string
}

export type InsertRequestMessageRepoParams = {
  conversationId: string
  content: string
}

export type InsertResponseMessageRepoParams = {
  conversationId: string
  content: string
  analysisResult?: RecommendationChatAnalysis
}

export type InsertRecommendedMoviesRepoParams = {
  messageId: string
  movies: { movieId: number; rank: number; reason: string }[]
}

export type ListRecentRecommendationExchangesRepoParams = {
  conversationId: string
  limit: number
}

export type ListRecommendedMovieIdsRepoParams = {
  conversationId: string
}

export type GetConversationMessagesRepoParams = {
  conversationId: string
}

export type ListTagMappingTopNRepoParams = {
  embedding: number[]
  embeddingModel: string
  limit: number
}

export type ListTaggedCandidatesRepoParams = {
  filters: RecommendationChatFilters
  mappedTagIds: number[]
  excludedMovieIds: number[]
}

export type ListTaglessCandidatesRepoParams = {
  filters: RecommendationChatFilters
  excludedMovieIds: number[]
  limit: number
}

// Repository results
export type RecommendationChatConversationRow = {
  id: string
  userId: string
}

export type RecommendationChatMessageRow = {
  id: string
  conversationId: string
}

export type RecommendationChatCandidate = {
  id: number
  title: string
  releaseYear: number | null
  overview: string | null
  posterPath: string | null
  movielensAvgRating: string | number
  movielensRatingCount: number
  cinemateRatingSum: string | number
  cinemateReviewCount: number
  genres: { id: number; name: string }[]
  tagRelevances: Map<number, number>
}

export type RecommendationChatStoredMessageRepoResult = {
  id: string
  role: "request" | "response"
  content: string
  createdAt: Date
  movies: RecommendationChatStoredMovieRepoResult[]
}

export type RecommendationChatStoredMovieRepoResult = Omit<RecommendationChatCandidate, "tagRelevances"> & {
  rank: number
  reason: string
}

export type RecommendationChatTagMappingRepoResult = {
  tagId: number
  tag: string
  relevance: number
}

// Repository port
export type RecommendationChatRepository = {
  findConversationByUserId(params: FindConversationByUserIdRepoParams): Promise<RecommendationChatConversationRow | null>
  findOrCreateConversation(params: FindOrCreateConversationRepoParams): Promise<RecommendationChatConversationRow>
  deleteConversationByUserId(params: DeleteConversationByUserIdRepoParams): Promise<void>
  insertRequestMessage(params: InsertRequestMessageRepoParams): Promise<RecommendationChatMessageRow>
  insertResponseMessage(params: InsertResponseMessageRepoParams): Promise<RecommendationChatMessageRow>
  insertRecommendedMovies(params: InsertRecommendedMoviesRepoParams): Promise<void>
  listRecentRecommendationExchanges(
    params: ListRecentRecommendationExchangesRepoParams,
  ): Promise<RecommendationChatRecentExchange[]>
  listRecommendedMovieIds(params: ListRecommendedMovieIdsRepoParams): Promise<Set<number>>
  getConversationMessages(params: GetConversationMessagesRepoParams): Promise<RecommendationChatStoredMessageRepoResult[]>
  listAvailableOptions(): Promise<AvailableRecommendationChatOptions>
  listTagMappingTopN(params: ListTagMappingTopNRepoParams): Promise<RecommendationChatTagMappingRepoResult[]>
  listTaggedCandidates(params: ListTaggedCandidatesRepoParams): Promise<RecommendationChatCandidate[]>
  listTaglessCandidates(params: ListTaglessCandidatesRepoParams): Promise<RecommendationChatCandidate[]>
}

export type RecommendationChatLlmClient = {
  analyzeRequest(input: {
    currentMessage: string
    availableOptions: AvailableRecommendationChatOptions
    recentExchanges: RecommendationChatRecentExchange[]
  }): Promise<RecommendationChatAnalysis>
  generateMovieReasons(input: {
    currentMessage: string
    conditions: RecommendationChatAnalysis
    selectedMovies: Array<{
      id: number
      title: string
      year: number | null
      genres: string[]
      overview: string | null
      matchedUserTags: string[]
    }>
  }): Promise<{ reasons: { movieId: number; reason: string }[] }>
}

export type RecommendationChatEmbeddingClient = {
  embedUserTagQueries(input: { embeddingInputs: string[]; embeddingModel: string }): Promise<number[][]>
}
