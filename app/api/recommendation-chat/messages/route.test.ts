import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  class UnauthorizedRecommendationChatError extends Error {}
  class RecommendationChatLlmApiError extends Error {
    constructor(public readonly failureStage = "analysis") {
      super()
    }
  }
  class RecommendationChatEmbeddingApiError extends Error {}
  class RecommendationChatPersistenceError extends Error {}
  class RecommendationChatVectorSearchError extends Error {}

  return {
    createOptionalRequestContext: vi.fn(),
    createRequestId: vi.fn(),
    recommendationChatService: {
      submitRecommendationChatMessage: vi.fn(),
    },
    UnauthorizedRecommendationChatError,
    RecommendationChatLlmApiError,
    RecommendationChatEmbeddingApiError,
    RecommendationChatPersistenceError,
    RecommendationChatVectorSearchError,
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
  RecommendationChatLlmApiError: mocks.RecommendationChatLlmApiError,
  RecommendationChatEmbeddingApiError: mocks.RecommendationChatEmbeddingApiError,
  RecommendationChatPersistenceError: mocks.RecommendationChatPersistenceError,
  RecommendationChatVectorSearchError: mocks.RecommendationChatVectorSearchError,
}))

import { apiErrorCodes } from "@/server/error"
import { POST } from "./route"

describe("POST /api/recommendation-chat/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.createOptionalRequestContext.mockResolvedValue({
      requestId: "request-1",
      user: { id: "user-1", email: "user@example.com" },
    })
    mocks.recommendationChatService.submitRecommendationChatMessage.mockResolvedValue({
      conversationId: "00000000-0000-4000-8000-000000000001",
      answer: "요청하신 조건에 맞는 영화를 골라봤어요.",
      movies: [],
    })
  })

  it("returns 400 for invalid body", async () => {
    const response = await POST(jsonRequest({ message: "" }))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidBody, requestId: "request-1" } },
    })
    expect(mocks.createOptionalRequestContext).not.toHaveBeenCalled()
  })

  it("passes parsed message to the service", async () => {
    const response = await POST(jsonRequest({ message: "  코미디 추천  " }))

    await expect(readResponse(response)).resolves.toMatchObject({ status: 200, body: { movies: [] } })
    expect(mocks.recommendationChatService.submitRecommendationChatMessage).toHaveBeenCalledWith(
      { requestId: "request-1", user: { id: "user-1", email: "user@example.com" } },
      { message: "코미디 추천" },
    )
  })

  it("maps recommendation chat domain failures", async () => {
    mocks.recommendationChatService.submitRecommendationChatMessage.mockRejectedValue(
      new mocks.RecommendationChatVectorSearchError(),
    )

    const response = await POST(jsonRequest({ message: "잔잔한 영화" }))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 500,
      body: {
        error: {
          code: apiErrorCodes.recommendationChatVectorSearchFailed,
          requestId: "request-1",
          details: { failureStage: "candidate_query", failureSource: "internal_candidate_query" },
        },
      },
    })
  })

  it("includes recommendation chat LLM failure stage details", async () => {
    mocks.recommendationChatService.submitRecommendationChatMessage.mockRejectedValue(
      new mocks.RecommendationChatLlmApiError("reason_generation"),
    )

    const response = await POST(jsonRequest({ message: "코미디 추천" }))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 500,
      body: {
        error: {
          code: apiErrorCodes.recommendationChatLlmApiFailed,
          details: { failureStage: "reason_generation", failureSource: "external_ai_service" },
        },
      },
    })
  })
})

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/recommendation-chat/messages", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

async function readResponse(response: Response) {
  return { status: response.status, body: await response.json() }
}
