import { describe, expect, it, vi } from "vitest"
import {
  getMyRecommendationChatConversation,
  getRecommendationChatInitialQuestions,
  RecommendationChatApiError,
  resetMyRecommendationChatConversation,
  submitRecommendationChatMessage,
} from "./recommendation-chat-client"

describe("recommendation chat client", () => {
  it("fetches initial questions", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ questions: ["a", "b", "c"] }))

    await expect(getRecommendationChatInitialQuestions(fetchImpl)).resolves.toEqual({ questions: ["a", "b", "c"] })
    expect(fetchImpl).toHaveBeenCalledWith("/api/recommendation-chat/initial-questions", { cache: "no-store" })
  })

  it("posts message body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ conversationId: "conversation-1", answer: "ok", movies: [] }),
    )

    await expect(submitRecommendationChatMessage({ message: "코미디 추천" }, fetchImpl)).resolves.toMatchObject({
      answer: "ok",
    })
    expect(fetchImpl).toHaveBeenCalledWith("/api/recommendation-chat/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "코미디 추천" }),
    })
  })

  it("fetches my current conversation", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ conversationId: null, messages: [] }))

    await expect(getMyRecommendationChatConversation(fetchImpl)).resolves.toEqual({
      conversationId: null,
      messages: [],
    })
    expect(fetchImpl).toHaveBeenCalledWith("/api/recommendation-chat/conversation", { cache: "no-store" })
  })

  it("resets my current conversation", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ conversationId: null, messages: [] }))

    await expect(resetMyRecommendationChatConversation(fetchImpl)).resolves.toEqual({
      conversationId: null,
      messages: [],
    })
    expect(fetchImpl).toHaveBeenCalledWith("/api/recommendation-chat/conversation", { method: "DELETE" })
  })

  it("preserves api error metadata", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        { error: { code: "unauthorized", message: "로그인이 필요합니다.", requestId: "request-1" } },
        { status: 401 },
      ),
    )

    await expect(getMyRecommendationChatConversation(fetchImpl)).rejects.toMatchObject({
      status: 401,
      code: "unauthorized",
      requestId: "request-1",
      isUnauthorized: true,
    } satisfies Partial<RecommendationChatApiError>)
  })
})

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json" },
  })
}
