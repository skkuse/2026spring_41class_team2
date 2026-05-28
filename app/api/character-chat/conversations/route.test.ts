import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  class UnauthorizedCharacterChatError extends Error {}
  class CharacterChatInvalidCharacterError extends Error {}

  return {
    createOptionalRequestContext: vi.fn(),
    createRequestId: vi.fn(),
    characterChatService: {
      createConversation: vi.fn(),
      getConversation: vi.fn(),
    },
    UnauthorizedCharacterChatError,
    CharacterChatInvalidCharacterError,
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
vi.mock("@/server/character-chat", () => ({
  characterChatService: mocks.characterChatService,
  UnauthorizedCharacterChatError: mocks.UnauthorizedCharacterChatError,
  CharacterChatInvalidCharacterError: mocks.CharacterChatInvalidCharacterError,
}))

import { apiErrorCodes } from "@/server/error"
import { GET, POST } from "./route"

describe("/api/character-chat/conversations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.createOptionalRequestContext.mockResolvedValue(context())
    mocks.characterChatService.createConversation.mockResolvedValue({
      conversationId: "00000000-0000-4000-8000-000000000001",
      initialMessage: "hello",
      suggestedQuestions: ["question"],
    })
    mocks.characterChatService.getConversation.mockResolvedValue({
      conversationId: "00000000-0000-4000-8000-000000000001",
      initialMessage: "hello",
      messages: [
        {
          id: "00000000-0000-4000-8000-000000000002",
          role: "character",
          content: "reply",
          createdAt: "2026-05-28T00:00:00.000Z",
        },
      ],
      suggestedQuestions: ["question"],
    })
  })

  it("returns 400 for invalid body without creating context", async () => {
    const response = await POST(jsonRequest({ movieId: 155, characterId: "bad" }))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidBody, requestId: "request-1" } },
    })
    expect(mocks.createOptionalRequestContext).not.toHaveBeenCalled()
  })

  it("passes parsed body to the service", async () => {
    const body = { movieId: 155, characterId: "00000000-0000-4000-8000-000000000001" }

    const response = await POST(jsonRequest(body))

    await expect(readResponse(response)).resolves.toMatchObject({ status: 200, body: { initialMessage: "hello" } })
    expect(mocks.characterChatService.createConversation).toHaveBeenCalledWith(context(), body)
  })

  it("maps invalid movie-character combinations to 404", async () => {
    mocks.characterChatService.createConversation.mockRejectedValue(new mocks.CharacterChatInvalidCharacterError())

    const response = await POST(jsonRequest({ movieId: 155, characterId: "00000000-0000-4000-8000-000000000001" }))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 404,
      body: { error: { code: apiErrorCodes.characterChatInvalidCharacter, requestId: "request-1" } },
    })
  })

  it("returns 400 for invalid query without creating context", async () => {
    const response = await GET(new Request("http://localhost/api/character-chat/conversations?movieId=bad&characterId=bad"))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidQuery, requestId: "request-1" } },
    })
    expect(mocks.createOptionalRequestContext).not.toHaveBeenCalled()
  })

  it("passes parsed query to the service", async () => {
    const characterId = "00000000-0000-4000-8000-000000000001"

    const response = await GET(
      new Request(`http://localhost/api/character-chat/conversations?movieId=155&characterId=${characterId}`),
    )

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 200,
      body: { conversationId: "00000000-0000-4000-8000-000000000001", suggestedQuestions: ["question"] },
    })
    expect(mocks.characterChatService.getConversation).toHaveBeenCalledWith(context(), { movieId: 155, characterId })
  })

  it("maps get conversation authentication and invalid character failures", async () => {
    const request = new Request(
      "http://localhost/api/character-chat/conversations?movieId=155&characterId=00000000-0000-4000-8000-000000000001",
    )
    mocks.characterChatService.getConversation.mockRejectedValueOnce(new mocks.UnauthorizedCharacterChatError())

    await expect(readResponse(await GET(request))).resolves.toMatchObject({
      status: 401,
      body: { error: { code: apiErrorCodes.unauthorized, requestId: "request-1" } },
    })

    mocks.characterChatService.getConversation.mockRejectedValueOnce(new mocks.CharacterChatInvalidCharacterError())

    await expect(readResponse(await GET(request))).resolves.toMatchObject({
      status: 404,
      body: { error: { code: apiErrorCodes.characterChatInvalidCharacter, requestId: "request-1" } },
    })
  })
})

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/character-chat/conversations", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

function context() {
  return { requestId: "request-1", user: { id: "user-1", email: "user@example.com" } }
}

async function readResponse(response: Response) {
  return { status: response.status, body: await response.json() }
}
