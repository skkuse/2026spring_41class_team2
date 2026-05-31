import { describe, expect, it, vi } from "vitest"
import {
  getMyRecommendationChatConversation,
  createRecommendationChatDebugQuestion,
  deleteRecommendationChatDebugQuestion,
  getRecommendationChatDebugQuestions,
  getRecommendationChatInitialQuestions,
  RecommendationChatApiError,
  resetMyRecommendationChatConversation,
  runRecommendationChatDebug,
  submitRecommendationChatMessage,
} from "./recommendation-chat-client"

describe("recommendation chat client", () => {
  it("fetches initial questions", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ questions: ["a", "b", "c"] }))

    await expect(getRecommendationChatInitialQuestions(fetchImpl)).resolves.toEqual({ questions: ["a", "b", "c"] })
    expect(fetchImpl).toHaveBeenCalledWith("/api/recommendation-chat/initial-questions", { cache: "no-store" })
  })

  it("manages debug questions", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ questions: [{ id: "question-1", text: "코미디 추천", createdAt: "now" }] }))
      .mockResolvedValueOnce(jsonResponse({ question: { id: "question-2", text: "공포 추천", createdAt: "now" } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(getRecommendationChatDebugQuestions(fetchImpl)).resolves.toEqual({
      questions: [{ id: "question-1", text: "코미디 추천", createdAt: "now" }],
    })
    await expect(createRecommendationChatDebugQuestion({ text: "공포 추천" }, fetchImpl)).resolves.toEqual({
      question: { id: "question-2", text: "공포 추천", createdAt: "now" },
    })
    await expect(deleteRecommendationChatDebugQuestion({ questionId: "question-2" }, fetchImpl)).resolves.toBeUndefined()

    expect(fetchImpl).toHaveBeenNthCalledWith(1, "/api/recommendation-chat/debug/questions", { cache: "no-store" })
    expect(fetchImpl).toHaveBeenNthCalledWith(2, "/api/recommendation-chat/debug/questions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "공포 추천" }),
    })
    expect(fetchImpl).toHaveBeenNthCalledWith(3, "/api/recommendation-chat/debug/questions/question-2", {
      method: "DELETE",
    })
  })

  it("posts debug run body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ conversationId: null, status: "unsupported", trace: {} }))

    await expect(runRecommendationChatDebug({ message: "코미디 추천" }, fetchImpl)).resolves.toMatchObject({
      status: "unsupported",
    })
    expect(fetchImpl).toHaveBeenCalledWith("/api/recommendation-chat/debug/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "코미디 추천" }),
    })
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
        {
          error: {
            code: "unauthorized",
            message: "로그인이 필요합니다.",
            requestId: "request-1",
            details: { failureStage: "auth", failureSource: "auth" },
          },
        },
        { status: 401 },
      ),
    )

    await expect(getMyRecommendationChatConversation(fetchImpl)).rejects.toMatchObject({
      status: 401,
      code: "unauthorized",
      requestId: "request-1",
      failureStage: "auth",
      failureSource: "auth",
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
