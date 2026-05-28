import { describe, expect, it, vi } from "vitest"
import {
  CharacterChatApiError,
  createCharacterChatConversation,
  getCharacterChatConversation,
  getCharacterChatMovies,
  sendCharacterChatMessage,
} from "./character-chat-client"

describe("character chat client", () => {
  it("fetches character chat movies", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ movies: [] }))

    await expect(getCharacterChatMovies(fetchImpl)).resolves.toEqual({ movies: [] })
    expect(fetchImpl).toHaveBeenCalledWith("/api/character-chat/movies", { cache: "no-store" })
  })

  it("creates a conversation for a selected movie and character", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        conversationId: "conversation-1",
        initialMessage: "hello",
        suggestedQuestions: ["question"],
      }),
    )

    await expect(
      createCharacterChatConversation({ movieId: 155, characterId: "character-1" }, fetchImpl),
    ).resolves.toMatchObject({ conversationId: "conversation-1" })
    expect(fetchImpl).toHaveBeenCalledWith("/api/character-chat/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ movieId: 155, characterId: "character-1" }),
    })
  })

  it("fetches an existing conversation for a selected movie and character", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        conversationId: "conversation-1",
        initialMessage: "hello",
        messages: [{ id: "message-1", role: "character", content: "reply", createdAt: "2026-05-28T00:00:00.000Z" }],
        suggestedQuestions: ["next"],
      }),
    )

    await expect(
      getCharacterChatConversation({ movieId: 155, characterId: "character/1" }, fetchImpl),
    ).resolves.toMatchObject({ conversationId: "conversation-1", suggestedQuestions: ["next"] })
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/character-chat/conversations?movieId=155&characterId=character%2F1",
      { cache: "no-store" },
    )
  })

  it("posts a message to the encoded conversation path", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        messageId: "message-1",
        reply: "reply",
        suggestedQuestions: ["next"],
        createdAt: "2026-05-28T00:00:00.000Z",
      }),
    )

    await expect(
      sendCharacterChatMessage({ conversationId: "conversation/1", message: "조커에 대해 말해줘" }, fetchImpl),
    ).resolves.toMatchObject({ reply: "reply" })
    expect(fetchImpl).toHaveBeenCalledWith("/api/character-chat/conversations/conversation%2F1/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "조커에 대해 말해줘" }),
    })
  })

  it("preserves api error metadata", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        { error: { code: "unauthorized", message: "로그인이 필요합니다.", requestId: "request-1" } },
        { status: 401 },
      ),
    )

    await expect(getCharacterChatMovies(fetchImpl)).rejects.toMatchObject({
      status: 401,
      code: "unauthorized",
      requestId: "request-1",
      isUnauthorized: true,
    } satisfies Partial<CharacterChatApiError>)
  })
})

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json" },
  })
}
