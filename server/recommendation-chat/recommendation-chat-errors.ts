export class UnauthorizedRecommendationChatError extends Error {
  constructor() {
    super("Recommendation chat requires authentication.")
    this.name = "UnauthorizedRecommendationChatError"
  }
}

export class RecommendationChatLlmApiError extends Error {
  constructor(cause?: unknown) {
    super("Recommendation chat LLM request failed.", { cause })
    this.name = "RecommendationChatLlmApiError"
  }
}

export class RecommendationChatEmbeddingApiError extends Error {
  constructor(cause?: unknown) {
    super("Recommendation chat embedding request failed.", { cause })
    this.name = "RecommendationChatEmbeddingApiError"
  }
}

export class RecommendationChatVectorSearchError extends Error {
  constructor(cause?: unknown) {
    super("Recommendation chat vector search failed.", { cause })
    this.name = "RecommendationChatVectorSearchError"
  }
}
