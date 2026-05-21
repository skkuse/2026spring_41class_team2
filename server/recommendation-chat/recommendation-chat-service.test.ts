import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  RecommendationChatEmbeddingApiError,
  RecommendationChatLlmApiError,
  RecommendationChatVectorSearchError,
  UnauthorizedRecommendationChatError,
} from "./recommendation-chat-errors"
import { createRecommendationChatService } from "./recommendation-chat-service"
import type {
  RecommendationChatAnalysis,
  RecommendationChatEmbeddingClient,
  RecommendationChatLlmClient,
  RecommendationChatRepository,
} from "./recommendation-chat-types"

vi.mock("server-only", () => ({}))
vi.mock("./recommendation-chat-repository", () => ({ createRecommendationChatRepository: vi.fn() }))
vi.mock("./recommendation-chat-openai-llm-client", () => ({ createOpenAiRecommendationChatLlmClient: vi.fn() }))
vi.mock("./recommendation-chat-openai-embedding-client", () => ({ createOpenAiRecommendationChatEmbeddingClient: vi.fn() }))

describe("recommendation chat service", () => {
  let repository: MockRepository
  let llmClient: MockLlmClient
  let embeddingClient: MockEmbeddingClient

  beforeEach(() => {
    repository = createMockRepository()
    llmClient = createMockLlmClient()
    embeddingClient = createMockEmbeddingClient()
  })

  it("rejects unauthenticated submit", async () => {
    await expect(createService(repository, llmClient, embeddingClient).submitRecommendationChatMessage({ requestId: "request-1", user: null }, { message: "추천" })).rejects.toBeInstanceOf(
      UnauthorizedRecommendationChatError,
    )
  })

  it("creates or reuses the user's single conversation and returns unsupported answer", async () => {
    llmClient.analyzeRequest.mockResolvedValue({ ...baseAnalysis(), intent: "unsupported" })

    await expect(createService(repository, llmClient, embeddingClient).submitRecommendationChatMessage(context(), { message: "줄거리 알려줘" })).resolves.toMatchObject({
      conversationId: "conversation-1",
      movies: [],
    })
    expect(repository.findOrCreateConversation).toHaveBeenCalledWith({ userId: "user-1" })
    expect(repository.insertRequestMessage).toHaveBeenCalledWith({
      conversationId: "conversation-1",
      content: "줄거리 알려줘",
    })
    expect(repository.insertResponseMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: "conversation-1",
        analysisResult: expect.objectContaining({ intent: "unsupported" }),
      }),
    )
    expect(repository.listTaglessCandidates).not.toHaveBeenCalled()
  })

  it("passes recent three exchanges to LLM analyzer", async () => {
    repository.listRecentRecommendationExchanges.mockResolvedValue([
      { request: "a", response: "b", movies: [{ id: 1, title: "A" }] },
    ])
    llmClient.analyzeRequest.mockResolvedValue({ ...baseAnalysis(), intent: "unsupported" })

    await createService(repository, llmClient, embeddingClient).submitRecommendationChatMessage(context(), { message: "추천" })

    expect(repository.listRecentRecommendationExchanges).toHaveBeenCalledWith({
      conversationId: "conversation-1",
      limit: 3,
    })
    expect(llmClient.analyzeRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        currentMessage: "추천",
        recentExchanges: [{ request: "a", response: "b", movies: [{ id: 1, title: "A" }] }],
      }),
    )
  })

  it("resets the user's conversation", async () => {
    await expect(createService(repository, llmClient, embeddingClient).resetMyRecommendationChatConversation(context())).resolves.toEqual({
      conversationId: null,
      messages: [],
    })
    expect(repository.deleteConversationByUserId).toHaveBeenCalledWith({ userId: "user-1" })
  })

  it("returns fallback when user tags have no valid mapping", async () => {
    llmClient.analyzeRequest.mockResolvedValue({ ...baseAnalysis(), userTagQueries: [userTagQuery("잔잔한")] })
    repository.listTagMappingTopN.mockResolvedValue([{ tagId: 1, tag: "quiet", relevance: 0.44 }])

    const response = await createService(repository, llmClient, embeddingClient).submitRecommendationChatMessage(context(), { message: "잔잔한 영화" })

    expect(response.answer).toContain("찾지 못했어요")
    expect(embeddingClient.embedUserTagQueries).toHaveBeenCalledWith({
      embeddingInputs: ["잔잔한 차분한 고요한 느린 호흡 감성적인 일상 정서 여운"],
      embeddingModel: "text-embedding-3-small",
    })
    expect(repository.listTaggedCandidates).not.toHaveBeenCalled()
    expect(llmClient.generateMovieReasons).not.toHaveBeenCalled()
  })

  it("embeds at most three user tag query inputs", async () => {
    llmClient.analyzeRequest.mockResolvedValue({
      ...baseAnalysis(),
      userTagQueries: [userTagQuery("잔잔한"), userTagQuery("무서운"), userTagQuery("따뜻한"), userTagQuery("웃긴")],
    })
    repository.listTagMappingTopN.mockResolvedValue([{ tagId: 1, tag: "quiet", relevance: 0.44 }])

    await createService(repository, llmClient, embeddingClient).submitRecommendationChatMessage(context(), { message: "추천" })

    expect(embeddingClient.embedUserTagQueries).toHaveBeenCalledWith({
      embeddingInputs: [
        "잔잔한 차분한 고요한 느린 호흡 감성적인 일상 정서 여운",
        "무서운 차분한 고요한 느린 호흡 감성적인 일상 정서 여운",
        "따뜻한 차분한 고요한 느린 호흡 감성적인 일상 정서 여운",
      ],
      embeddingModel: "text-embedding-3-small",
    })
  })

  it("drops non-content user tag queries before embedding", async () => {
    llmClient.analyzeRequest.mockResolvedValue({
      ...baseAnalysis(),
      userTagQueries: [
        {
          userTag: "친구랑",
          embeddingTerms: ["친구랑", "우정", "동료", "코미디", "청춘", "모임", "일상"],
        },
        userTagQuery("좀비"),
      ],
    })
    repository.listTagMappingTopN.mockResolvedValue([{ tagId: 10, tag: "zombie", relevance: 0.9 }])
    repository.listTaggedCandidates.mockResolvedValue([candidate(1, [[10, 0.8]])])
    llmClient.generateMovieReasons.mockResolvedValue({ reasons: [{ movieId: 1, reason: "좀비 소재가 조건과 맞아요." }] })

    await createService(repository, llmClient, embeddingClient).submitRecommendationChatMessage(context(), { message: "친구랑 보기 좋은 좀비 영화" })

    expect(embeddingClient.embedUserTagQueries).toHaveBeenCalledWith({
      embeddingInputs: ["좀비 차분한 고요한 느린 호흡 감성적인 일상 정서 여운"],
      embeddingModel: "text-embedding-3-small",
    })
  })

  it("uses tagless candidate lookup when user tag queries are empty", async () => {
    llmClient.analyzeRequest.mockResolvedValue(baseAnalysis())
    repository.listTaglessCandidates.mockResolvedValue([candidate(1)])
    llmClient.generateMovieReasons.mockResolvedValue({ reasons: [{ movieId: 1, reason: "조건과 잘 맞아요." }] })

    await createService(repository, llmClient, embeddingClient).submitRecommendationChatMessage(context(), { message: "코미디 추천" })

    expect(embeddingClient.embedUserTagQueries).not.toHaveBeenCalled()
    expect(repository.listTagMappingTopN).not.toHaveBeenCalled()
    expect(repository.listTaglessCandidates).toHaveBeenCalled()
  })

  it("returns unsupported when analysis has no usable recommendation conditions", async () => {
    llmClient.analyzeRequest.mockResolvedValue({
      ...baseAnalysis(),
      genreIds: [],
      userTagQueries: [
        {
          userTag: "친구랑",
          embeddingTerms: ["친구랑", "우정", "동료", "코미디", "청춘", "모임", "일상"],
        },
      ],
      excludedTerms: ["친구랑"],
    })

    const response = await createService(repository, llmClient, embeddingClient).submitRecommendationChatMessage(context(), { message: "친구랑 볼만한 거 추천해줘" })

    expect(response.movies).toEqual([])
    expect(response.answer).toContain("추천 채팅")
    expect(embeddingClient.embedUserTagQueries).not.toHaveBeenCalled()
    expect(repository.listTaglessCandidates).not.toHaveBeenCalled()
  })

  it("stores successful recommendations with LLM-generated reasons", async () => {
    llmClient.analyzeRequest.mockResolvedValue(baseAnalysis())
    repository.listTaglessCandidates.mockResolvedValue([candidate(2), candidate(1)])
    llmClient.generateMovieReasons.mockResolvedValue({
      reasons: [
        { movieId: 2, reason: "평점이 높아 조건에 맞아요." },
        { movieId: 1, reason: "가볍게 보기 좋아요." },
      ],
    })

    const response = await createService(repository, llmClient, embeddingClient).submitRecommendationChatMessage(context(), { message: "코미디 추천" })

    expect(response.movies.map((movie) => movie.reason)).toEqual(["평점이 높아 조건에 맞아요.", "가볍게 보기 좋아요."])
    expect(repository.insertRecommendedMovies).toHaveBeenCalledWith({
      messageId: "message-response-1",
      movies: [
        { movieId: 2, rank: 1, reason: "평점이 높아 조건에 맞아요." },
        { movieId: 1, rank: 2, reason: "가볍게 보기 좋아요." },
      ],
    })
  })

  it("fails when reason generation omits a selected movie", async () => {
    llmClient.analyzeRequest.mockResolvedValue(baseAnalysis())
    repository.listTaglessCandidates.mockResolvedValue([candidate(1)])
    llmClient.generateMovieReasons.mockResolvedValue({ reasons: [] })

    await expect(createService(repository, llmClient, embeddingClient).submitRecommendationChatMessage(context(), { message: "추천" })).rejects.toBeInstanceOf(
      RecommendationChatLlmApiError,
    )
  })

  it("maps embedding and vector failures to domain errors", async () => {
    llmClient.analyzeRequest.mockResolvedValue({ ...baseAnalysis(), userTagQueries: [userTagQuery("잔잔한")] })
    embeddingClient.embedUserTagQueries.mockRejectedValue(new Error("embedding failed"))

    await expect(createService(repository, llmClient, embeddingClient).submitRecommendationChatMessage(context(), { message: "추천" })).rejects.toBeInstanceOf(
      RecommendationChatEmbeddingApiError,
    )

    embeddingClient.embedUserTagQueries.mockResolvedValue([[0.1]])
    repository.listTagMappingTopN.mockRejectedValue(new Error("vector failed"))
    await expect(createService(repository, llmClient, embeddingClient).submitRecommendationChatMessage(context(), { message: "추천" })).rejects.toBeInstanceOf(
      RecommendationChatVectorSearchError,
    )
  })
})

type MockRepository = Record<keyof RecommendationChatRepository, ReturnType<typeof vi.fn>>
type MockLlmClient = Record<keyof RecommendationChatLlmClient, ReturnType<typeof vi.fn>>
type MockEmbeddingClient = Record<keyof RecommendationChatEmbeddingClient, ReturnType<typeof vi.fn>>

function createMockRepository(): MockRepository {
  return {
    findConversationByUserId: vi.fn().mockResolvedValue({ id: "conversation-1", userId: "user-1" }),
    findOrCreateConversation: vi.fn().mockResolvedValue({ id: "conversation-1", userId: "user-1" }),
    deleteConversationByUserId: vi.fn().mockResolvedValue(undefined),
    insertRequestMessage: vi.fn().mockResolvedValue({ id: "message-request-1", conversationId: "conversation-1" }),
    insertResponseMessage: vi.fn().mockResolvedValue({ id: "message-response-1", conversationId: "conversation-1" }),
    insertRecommendedMovies: vi.fn().mockResolvedValue(undefined),
    listRecentRecommendationExchanges: vi.fn().mockResolvedValue([]),
    listRecommendedMovieIds: vi.fn().mockResolvedValue(new Set()),
    getConversationMessages: vi.fn().mockResolvedValue([]),
    listAvailableOptions: vi.fn().mockResolvedValue({
      genres: [{ id: 1, name: "Comedy", nameKo: "코미디" }],
      countries: [{ code: "US" }],
      languages: [{ code: "en" }],
    }),
    listTagMappingTopN: vi.fn().mockResolvedValue([{ tagId: 10, tag: "quiet", relevance: 0.9 }]),
    listTaggedCandidates: vi.fn().mockResolvedValue([]),
    listTaglessCandidates: vi.fn().mockResolvedValue([]),
  }
}

function createMockLlmClient(): MockLlmClient {
  return {
    analyzeRequest: vi.fn().mockResolvedValue(baseAnalysis()),
    generateMovieReasons: vi.fn().mockResolvedValue({ reasons: [] }),
  }
}

function createMockEmbeddingClient(): MockEmbeddingClient {
  return {
    embedUserTagQueries: vi.fn().mockResolvedValue([[0.1]]),
  }
}

function createService(repository: MockRepository, llmClient: MockLlmClient, embeddingClient: MockEmbeddingClient) {
  return createRecommendationChatService({
    repository: repository as unknown as RecommendationChatRepository,
    llmClient: llmClient as unknown as RecommendationChatLlmClient,
    embeddingClient: embeddingClient as unknown as RecommendationChatEmbeddingClient,
  })
}

function baseAnalysis(): RecommendationChatAnalysis {
  return {
    intent: "new_recommendation",
    genreIds: [1],
    countryCodes: [],
    languageCodes: [],
    yearRange: null,
    runtimeRange: null,
    userTagQueries: [],
    excludedTerms: [],
    confidence: 0.9,
  }
}

function userTagQuery(userTag: string) {
  return {
    userTag,
    embeddingTerms: [userTag, "차분한", "고요한", "느린 호흡", "감성적인", "일상 정서", "여운"],
  }
}

function candidate(id: number, tagRelevances: Array<[number, number]> = []) {
  return {
    id,
    title: `movie-${id}`,
    releaseYear: 2020,
    overview: "overview",
    posterPath: null,
    movielensAvgRating: id === 2 ? 4.8 : 4.5,
    movielensRatingCount: 100,
    cinemateRatingSum: 0,
    cinemateReviewCount: 0,
    genres: [{ id: 1, name: "코미디" }],
    tagRelevances: new Map(tagRelevances),
  }
}

function context() {
  return { requestId: "request-1", user: { id: "user-1", email: "user@example.com" } }
}
