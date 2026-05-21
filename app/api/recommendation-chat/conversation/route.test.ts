import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  class UnauthorizedRecommendationChatError extends Error {}

  return {
    createOptionalRequestContext: vi.fn(),
    createRequestId: vi.fn(),
    recommendationChatService: {
      getMyRecommendationChatConversation: vi.fn(),
      resetMyRecommendationChatConversation: vi.fn(),
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
import { DELETE, GET } from "./route"

describe("/api/recommendation-chat/conversation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.createOptionalRequestContext.mockResolvedValue({
      requestId: "request-1",
      user: { id: "user-1", email: "user@example.com" },
    })
    mocks.recommendationChatService.getMyRecommendationChatConversation.mockResolvedValue({
      conversationId: null,
      messages: [],
    })
    mocks.recommendationChatService.resetMyRecommendationChatConversation.mockResolvedValue({
      conversationId: null,
      messages: [],
    })
  })

  it("returns empty conversation state", async () => {
    const response = await GET()

    await expect(readResponse(response)).resolves.toEqual({
      status: 200,
      body: { conversationId: null, messages: [] },
    })
  })

  it("returns 401 when authentication is required", async () => {
    mocks.recommendationChatService.getMyRecommendationChatConversation.mockRejectedValue(
      new mocks.UnauthorizedRecommendationChatError(),
    )

    const response = await GET()

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 401,
      body: { error: { code: apiErrorCodes.unauthorized, requestId: "request-1" } },
    })
  })

  it("resets my conversation", async () => {
    const response = await DELETE()

    await expect(readResponse(response)).resolves.toEqual({
      status: 200,
      body: { conversationId: null, messages: [] },
    })
    expect(mocks.recommendationChatService.resetMyRecommendationChatConversation).toHaveBeenCalledWith({
      requestId: "request-1",
      user: { id: "user-1", email: "user@example.com" },
    })
  })
})

async function readResponse(response: Response) {
  return { status: response.status, body: await response.json() }
}
