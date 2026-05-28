import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  class UnauthorizedCharacterChatError extends Error {}

  return {
    createOptionalRequestContext: vi.fn(),
    createRequestId: vi.fn(),
    characterChatService: {
      listMovies: vi.fn(),
    },
    UnauthorizedCharacterChatError,
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
}))

import { apiErrorCodes } from "@/server/error"
import { GET } from "./route"

describe("GET /api/character-chat/movies", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.createOptionalRequestContext.mockResolvedValue(context())
    mocks.characterChatService.listMovies.mockResolvedValue({ movies: [] })
  })

  it("passes request context to the service", async () => {
    const response = await GET()

    await expect(readResponse(response)).resolves.toEqual({ status: 200, body: { movies: [] } })
    expect(mocks.characterChatService.listMovies).toHaveBeenCalledWith(context())
  })

  it("maps unauthorized errors to 401", async () => {
    mocks.characterChatService.listMovies.mockRejectedValue(new mocks.UnauthorizedCharacterChatError())

    const response = await GET()

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 401,
      body: { error: { code: apiErrorCodes.unauthorized, requestId: "request-1" } },
    })
  })
})

function context() {
  return { requestId: "request-1", user: { id: "user-1", email: "user@example.com" } }
}

async function readResponse(response: Response) {
  return { status: response.status, body: await response.json() }
}
