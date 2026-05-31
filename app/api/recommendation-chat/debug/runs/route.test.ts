import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  class UnauthorizedRecommendationChatError extends Error {}

  return {
    createOptionalRequestContext: vi.fn(),
    createRequestId: vi.fn(),
    recommendationChatService: {
      runDebugRecommendationChatMessage: vi.fn(),
    },
    UnauthorizedRecommendationChatError,
  }
})

vi.mock("server-only", () => ({}))
vi.mock("@/server/auth/request-context", () => ({
  createOptionalRequestContext: mocks.createOptionalRequestContext,
  createRequestId: mocks.createRequestId,
}))
vi.mock("@/server/logger", () => ({
  logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))
vi.mock("@/server/recommendation-chat", () => ({
  recommendationChatService: mocks.recommendationChatService,
  UnauthorizedRecommendationChatError: mocks.UnauthorizedRecommendationChatError,
}))

import { apiErrorCodes } from "@/server/error"
import { POST } from "./route"

describe("POST /api/recommendation-chat/debug/runs", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.createOptionalRequestContext.mockResolvedValue({
      requestId: "request-1",
      user: { id: "user-1", email: "user@example.com" },
    })
    mocks.recommendationChatService.runDebugRecommendationChatMessage.mockResolvedValue(debugResponse())
  })

  it("passes parsed message to debug service", async () => {
    const response = await POST(jsonRequest({ message: "  코미디 추천  " }))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 200,
      body: { status: "success", trace: { candidateCount: 1 } },
    })
    expect(mocks.recommendationChatService.runDebugRecommendationChatMessage).toHaveBeenCalledWith(
      { requestId: "request-1", user: { id: "user-1", email: "user@example.com" } },
      { message: "코미디 추천" },
    )
  })

  it("returns existing unauthorized error shape", async () => {
    mocks.recommendationChatService.runDebugRecommendationChatMessage.mockRejectedValue(
      new mocks.UnauthorizedRecommendationChatError(),
    )

    const response = await POST(jsonRequest({ message: "코미디 추천" }))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 401,
      body: { error: { code: apiErrorCodes.unauthorized, requestId: "request-1" } },
    })
  })
})

function debugResponse() {
  return {
    conversationId: "00000000-0000-4000-8000-000000000001",
    status: "success",
    trace: {
      availableOptions: { genres: [], countries: [], languages: [] },
      recentExchanges: [],
      excludedMovieIds: [],
      rawAnalysis: baseAnalysis(),
      normalizedAnalysis: baseAnalysis(),
      filters: {
        genreIds: [1],
        countryCodes: [],
        languageCodes: [],
        yearRange: null,
        runtimeRange: null,
      },
      embeddingInputs: [],
      mappedTagsByUserTag: {},
      candidateQueryType: "tagless",
      candidateCount: 1,
      selectedMovies: [{ id: 1, title: "movie-1", year: 2020, matchedUserTags: [] }],
      generatedReasons: { "1": "조건과 맞아요." },
      answer: "추천 결과입니다.",
      movies: [],
      failureStage: null,
      error: null,
    },
  }
}

function baseAnalysis() {
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

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/recommendation-chat/debug/runs", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

async function readResponse(response: Response) {
  return { status: response.status, body: await response.json() }
}
