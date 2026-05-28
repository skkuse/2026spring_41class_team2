import { describe, expect, it } from "vitest"
import {
  createCharacterChatConversationRequestSchema,
  getCharacterChatConversationQuerySchema,
  getCharacterChatConversationResponseSchema,
  listCharacterChatMoviesResponseSchema,
  sendCharacterChatMessageRequestSchema,
} from "./character-chat-schema"

describe("character chat schema", () => {
  it("validates create conversation request", () => {
    expect(
      createCharacterChatConversationRequestSchema.parse({
        movieId: 155,
        characterId: "00000000-0000-4000-8000-000000000001",
      }),
    ).toEqual({
      movieId: 155,
      characterId: "00000000-0000-4000-8000-000000000001",
    })

    expect(() => createCharacterChatConversationRequestSchema.parse({ movieId: 155, characterId: "bad" })).toThrow()
  })

  it("trims and validates sent messages", () => {
    expect(sendCharacterChatMessageRequestSchema.parse({ message: "  안녕  " })).toEqual({ message: "안녕" })
    expect(() => sendCharacterChatMessageRequestSchema.parse({ message: "   " })).toThrow()
  })

  it("coerces and validates get conversation query", () => {
    expect(
      getCharacterChatConversationQuerySchema.parse({
        movieId: "155",
        characterId: "00000000-0000-4000-8000-000000000001",
      }),
    ).toEqual({
      movieId: 155,
      characterId: "00000000-0000-4000-8000-000000000001",
    })

    expect(() => getCharacterChatConversationQuerySchema.parse({ movieId: "bad", characterId: "bad" })).toThrow()
  })

  it("validates get conversation response shape", () => {
    expect(() =>
      getCharacterChatConversationResponseSchema.parse({
        conversationId: null,
        initialMessage: "hello",
        messages: [
          {
            id: "00000000-0000-4000-8000-000000000002",
            role: "character",
            content: "reply",
            createdAt: "2026-05-28T00:00:00.000Z",
          },
        ],
        suggestedQuestions: ["next"],
      }),
    ).not.toThrow()
  })

  it("validates movie list response shape", () => {
    expect(() =>
      listCharacterChatMoviesResponseSchema.parse({
        movies: [
          {
            id: 155,
            title: "다크 나이트",
            genres: [{ id: 80, name: "Crime" }],
            posterUrl: "https://example.com/poster.jpg",
            description: "description",
            actors: ["Christian Bale"],
            characters: [
              {
                id: "00000000-0000-4000-8000-000000000001",
                name: "Bruce Wayne",
                description: "description",
                greeting: "hello",
                avatarUrl: "https://example.com/avatar.webp",
                actor: { id: 3894, name: "Christian Bale" },
              },
            ],
          },
        ],
      }),
    ).not.toThrow()
  })
})
