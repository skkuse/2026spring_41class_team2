import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  class UnauthorizedCharacterChatError extends Error {}
  class CharacterChatConversationNotFoundError extends Error {}
  class CharacterChatLlmApiError extends Error {}

  return {
    createOptionalRequestContext: vi.fn(),
    createRequestId: vi.fn(),
    characterChatService: {
      sendMessage: vi.fn(),
    },
    UnauthorizedCharacterChatError,
    CharacterChatConversationNotFoundError,
    CharacterChatLlmApiError,
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
  CharacterChatConversationNotFoundError: mocks.CharacterChatConversationNotFoundError,
  CharacterChatLlmApiError: mocks.CharacterChatLlmApiError,
}))

import { apiErrorCodes } from "@/server/error"
import { POST } from "./route"

describe("POST /api/character-chat/conversations/[conversationId]/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.createOptionalRequestContext.mockResolvedValue(context())
    mocks.characterChatService.sendMessage.mockResolvedValue({
      messageId: "00000000-0000-4000-8000-000000000002",
      reply: "reply",
      suggestedQuestions: ["next"],
      createdAt: "2026-05-28T00:00:00.000Z",
    })
  })

  it("returns 400 for invalid conversation id", async () => {
    const response = await POST(jsonRequest({ message: "hello" }), params("bad"))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidQuery, requestId: "request-1" } },
    })
    expect(mocks.createOptionalRequestContext).not.toHaveBeenCalled()
  })

  it("passes trimmed message and conversation id to the service", async () => {
    const conversationId = "00000000-0000-4000-8000-000000000001"

    const response = await POST(jsonRequest({ message: "  안녕  " }), params(conversationId))

    await expect(readResponse(response)).resolves.toMatchObject({ status: 200, body: { reply: "reply" } })
    expect(mocks.characterChatService.sendMessage).toHaveBeenCalledWith(context(), {
      conversationId,
      message: "안녕",
    })
  })

  it("maps missing conversations and llm failures", async () => {
    mocks.characterChatService.sendMessage.mockRejectedValueOnce(new mocks.CharacterChatConversationNotFoundError())

    const missingResponse = await POST(
      jsonRequest({ message: "hello" }),
      params("00000000-0000-4000-8000-000000000001"),
    )

    await expect(readResponse(missingResponse)).resolves.toMatchObject({
      status: 404,
      body: { error: { code: apiErrorCodes.characterChatConversationNotFound, requestId: "request-1" } },
    })

    mocks.characterChatService.sendMessage.mockRejectedValueOnce(new mocks.CharacterChatLlmApiError())

    const failedResponse = await POST(
      jsonRequest({ message: "hello" }),
      params("00000000-0000-4000-8000-000000000001"),
    )

    await expect(readResponse(failedResponse)).resolves.toMatchObject({
      status: 500,
      body: { error: { code: apiErrorCodes.characterChatLlmApiFailed, requestId: "request-1" } },
    })
  })
})

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/character-chat/conversations/id/messages", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

function params(conversationId: string) {
  return { params: Promise.resolve({ conversationId }) }
}

function context() {
  return { requestId: "request-1", user: { id: "user-1", email: "user@example.com" } }
}

async function readResponse(response: Response) {
  return { status: response.status, body: await response.json() }
}
