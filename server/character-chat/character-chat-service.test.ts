import { beforeEach, describe, expect, it, vi } from "vitest"
import { CharacterChatConversationNotFoundError, CharacterChatInvalidCharacterError, UnauthorizedCharacterChatError } from "./character-chat-errors"
import { createCharacterChatService, type CharacterChatServiceDeps } from "./character-chat-service"
import type { CharacterChatConversationContext, CharacterChatRepository } from "./character-chat-types"

vi.mock("server-only", () => ({}))

describe("character chat service", () => {
  let repository: MockRepository
  let deps: CharacterChatServiceDeps

  beforeEach(() => {
    repository = createMockRepository()
    deps = {
      repository,
      avatarUrlSigner: { sign: vi.fn(async (path) => `https://signed.example/${path}`) },
      llmClient: {
        generateReply: vi.fn(async () => ({
          reply: "고담은 선택을 요구하지.",
          suggestedQuestions: ["왜 Harvey를 믿었나요?"],
        })),
      },
    }
  })

  it("requires login for every use case", async () => {
    const service = createCharacterChatService(deps)
    const context = { requestId: "request-1", user: null }

    await expect(service.listMovies(context)).rejects.toBeInstanceOf(UnauthorizedCharacterChatError)
    await expect(
      service.createConversation(context, { movieId: 155, characterId: "00000000-0000-4000-8000-000000000001" }),
    ).rejects.toBeInstanceOf(UnauthorizedCharacterChatError)
    await expect(
      service.sendMessage(context, { conversationId: "00000000-0000-4000-8000-000000000002", message: "안녕" }),
    ).rejects.toBeInstanceOf(UnauthorizedCharacterChatError)
    await expect(
      service.getConversation(context, { movieId: 155, characterId: "00000000-0000-4000-8000-000000000001" }),
    ).rejects.toBeInstanceOf(UnauthorizedCharacterChatError)
  })

  it("lists supported movies with signed avatar urls", async () => {
    const service = createCharacterChatService(deps)

    await expect(service.listMovies(userContext())).resolves.toMatchObject({
      movies: [
        {
          id: 155,
          title: "다크 나이트",
          posterUrl: "https://image.tmdb.org/t/p/w500/poster.jpg",
          characters: [{ name: "Bruce Wayne", avatarUrl: "https://signed.example/movies/155/characters/bruce-wayne.webp" }],
        },
      ],
    })
    expect(repository.listSupportedMovies).toHaveBeenCalledWith({ movieIds: [155, 670] })
  })

  it("creates a conversation only when the character belongs to the movie", async () => {
    const service = createCharacterChatService(deps)

    await expect(
      service.createConversation(userContext(), {
        movieId: 155,
        characterId: "00000000-0000-4000-8000-000000000001",
      }),
    ).resolves.toEqual({
      conversationId: "00000000-0000-4000-8000-000000000010",
      initialMessage: "고담은 늘 선택을 요구하지.",
      suggestedQuestions: ["하비를 왜 믿었나요?"],
    })
  })

  it("rejects invalid movie-character combinations without creating a conversation", async () => {
    repository.findCharacterForMovie.mockResolvedValue(null)
    const service = createCharacterChatService(deps)

    await expect(
      service.createConversation(userContext(), {
        movieId: 155,
        characterId: "00000000-0000-4000-8000-000000000999",
      }),
    ).rejects.toBeInstanceOf(CharacterChatInvalidCharacterError)
    expect(repository.createConversation).not.toHaveBeenCalled()
  })

  it("generates a reply with persona, selected events, and recent messages before saving messages", async () => {
    const service = createCharacterChatService(deps)

    await expect(
      service.sendMessage(userContext(), {
        conversationId: "00000000-0000-4000-8000-000000000010",
        message: "조커가 호송대를 습격했을 때 어땠어?",
      }),
    ).resolves.toMatchObject({
      messageId: "00000000-0000-4000-8000-000000000012",
      reply: "고담은 선택을 요구하지.",
      suggestedQuestions: ["왜 Harvey를 믿었나요?"],
    })
    expect(deps.llmClient.generateReply).toHaveBeenCalledWith(
      expect.objectContaining({
        personaPrompt: "# 역할\nBruce Wayne",
        currentMessage: "조커가 호송대를 습격했을 때 어땠어?",
        eventContexts: expect.arrayContaining([expect.objectContaining({ title: "호송대 습격" })]),
        recentMessages: [{ senderType: "user", content: "Harvey는 어떤 사람이었어?" }],
      }),
    )
    expect(repository.insertMessage).toHaveBeenNthCalledWith(1, {
      conversationId: "00000000-0000-4000-8000-000000000010",
      senderType: "user",
      content: "조커가 호송대를 습격했을 때 어땠어?",
    })
    expect(repository.insertMessage).toHaveBeenNthCalledWith(2, {
      conversationId: "00000000-0000-4000-8000-000000000010",
      senderType: "character",
      content: "고담은 선택을 요구하지.",
      suggestedQuestions: ["왜 Harvey를 믿었나요?"],
    })
  })

  it("loads the latest conversation with saved suggested questions", async () => {
    repository.findLatestConversationForCharacter.mockResolvedValue({
      conversation: {
        id: "00000000-0000-4000-8000-000000000010",
        userId: "user-1",
        characterId: "00000000-0000-4000-8000-000000000001",
      },
      messages: [
        {
          id: "00000000-0000-4000-8000-000000000011",
          conversationId: "00000000-0000-4000-8000-000000000010",
          senderType: "user",
          content: "안녕",
          suggestedQuestions: null,
          createdAt: new Date("2026-05-28T00:00:00.000Z"),
        },
        {
          id: "00000000-0000-4000-8000-000000000012",
          conversationId: "00000000-0000-4000-8000-000000000010",
          senderType: "character",
          content: "고담은 선택을 요구하지.",
          suggestedQuestions: ["왜 Harvey를 믿었나요?"],
          createdAt: new Date("2026-05-28T00:00:01.000Z"),
        },
      ],
    })
    const service = createCharacterChatService(deps)

    await expect(
      service.getConversation(userContext(), {
        movieId: 155,
        characterId: "00000000-0000-4000-8000-000000000001",
      }),
    ).resolves.toEqual({
      conversationId: "00000000-0000-4000-8000-000000000010",
      initialMessage: "고담은 늘 선택을 요구하지.",
      messages: [
        {
          id: "00000000-0000-4000-8000-000000000011",
          role: "user",
          content: "안녕",
          createdAt: "2026-05-28T00:00:00.000Z",
        },
        {
          id: "00000000-0000-4000-8000-000000000012",
          role: "character",
          content: "고담은 선택을 요구하지.",
          createdAt: "2026-05-28T00:00:01.000Z",
        },
      ],
      suggestedQuestions: ["왜 Harvey를 믿었나요?"],
    })
  })

  it("loads an empty conversation state with default questions", async () => {
    repository.findLatestConversationForCharacter.mockResolvedValue(null)
    const service = createCharacterChatService(deps)

    await expect(
      service.getConversation(userContext(), {
        movieId: 155,
        characterId: "00000000-0000-4000-8000-000000000001",
      }),
    ).resolves.toEqual({
      conversationId: null,
      initialMessage: "고담은 늘 선택을 요구하지.",
      messages: [],
      suggestedQuestions: ["하비를 왜 믿었나요?"],
    })
  })

  it("does not save messages when the conversation is missing or the LLM fails", async () => {
    repository.findConversationContext.mockResolvedValueOnce(null)
    const service = createCharacterChatService(deps)

    await expect(
      service.sendMessage(userContext(), {
        conversationId: "00000000-0000-4000-8000-000000000999",
        message: "안녕",
      }),
    ).rejects.toBeInstanceOf(CharacterChatConversationNotFoundError)
    expect(repository.insertMessage).not.toHaveBeenCalled()

    repository.findConversationContext.mockResolvedValueOnce(conversationContext())
    deps.llmClient.generateReply = vi.fn(async () => {
      throw new Error("failed")
    })

    await expect(
      service.sendMessage(userContext(), {
        conversationId: "00000000-0000-4000-8000-000000000010",
        message: "안녕",
      }),
    ).rejects.toThrow("Character chat LLM request failed")
    expect(repository.insertMessage).not.toHaveBeenCalled()
  })
})

type MockRepository = CharacterChatRepository & {
  [K in keyof CharacterChatRepository]: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    listSupportedMovies: vi.fn(async () => [
      {
        id: 155,
        title: "다크 나이트",
        overview: "고담시를 공포로 몰아넣는 조커와 배트맨의 대결.",
        posterPath: "/poster.jpg",
        genres: [{ id: 80, name: "Crime" }],
        characters: [character()],
      },
    ]),
    findCharacterForMovie: vi.fn(async () => character()),
    createConversation: vi.fn(async () => ({
      id: "00000000-0000-4000-8000-000000000010",
      userId: "user-1",
      characterId: "00000000-0000-4000-8000-000000000001",
    })),
    listDefaultQuestions: vi.fn(async () => ["하비를 왜 믿었나요?"]),
    findConversationContext: vi.fn(async () => conversationContext()),
    insertMessage: vi
      .fn()
      .mockResolvedValueOnce({
        id: "00000000-0000-4000-8000-000000000011",
        conversationId: "00000000-0000-4000-8000-000000000010",
        senderType: "user",
        content: "조커가 호송대를 습격했을 때 어땠어?",
        suggestedQuestions: null,
        createdAt: new Date("2026-05-28T00:00:00.000Z"),
      })
      .mockResolvedValueOnce({
        id: "00000000-0000-4000-8000-000000000012",
        conversationId: "00000000-0000-4000-8000-000000000010",
        senderType: "character",
        content: "고담은 선택을 요구하지.",
        suggestedQuestions: ["왜 Harvey를 믿었나요?"],
        createdAt: new Date("2026-05-28T00:00:01.000Z"),
      }),
    findLatestConversationForCharacter: vi.fn(async () => null),
  } as MockRepository
}

function userContext() {
  return { requestId: "request-1", user: { id: "user-1", email: "user@example.com" } }
}

function character() {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    movieId: 155,
    actorPersonId: 3894,
    actorName: "Christian Bale",
    name: "Bruce Wayne",
    description: "고담의 억만장자",
    greeting: "고담은 늘 선택을 요구하지.",
    personaPrompt: "# 역할\nBruce Wayne",
    avatarStoragePath: "movies/155/characters/bruce-wayne.webp",
  }
}

function conversationContext(): CharacterChatConversationContext {
  return {
    conversation: {
      id: "00000000-0000-4000-8000-000000000010",
      userId: "user-1",
      characterId: "00000000-0000-4000-8000-000000000001",
    },
    movie: {
      id: 155,
      title: "다크 나이트",
      overview: "고담시",
      posterPath: "/poster.jpg",
      genres: [{ id: 80, name: "Crime" }],
    },
    character: character(),
    recentMessages: [{ senderType: "user", content: "Harvey는 어떤 사람이었어?" }],
    events: [
      {
        eventOrder: 1,
        title: "고담 은행 강도",
        summary: "조커가 은행을 습격한다.",
        role: "opponent",
        perspectiveSummary: "Bruce는 조커의 등장을 경계한다.",
        emotionalImpact: "긴장",
        knowledgeState: "조커가 위협이라는 것을 안다.",
      },
      {
        eventOrder: 6,
        title: "호송대 습격",
        summary: "조커가 Harvey 호송대를 습격한다.",
        role: "protector",
        perspectiveSummary: "Bruce는 Harvey를 지키려 한다.",
        emotionalImpact: "압박",
        knowledgeState: "Harvey가 표적이 된 것을 안다.",
      },
    ],
  }
}
