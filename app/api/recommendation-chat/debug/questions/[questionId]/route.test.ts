import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createRequestId: vi.fn(),
  recommendationChatService: {
    deleteDebugQuestion: vi.fn(),
  },
}))

vi.mock("server-only", () => ({}))
vi.mock("@/server/auth/request-context", () => ({ createRequestId: mocks.createRequestId }))
vi.mock("@/server/logger", () => ({
  logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))
vi.mock("@/server/recommendation-chat", () => ({
  recommendationChatService: mocks.recommendationChatService,
}))

import { apiErrorCodes } from "@/server/error"
import { DELETE } from "./route"

describe("DELETE /api/recommendation-chat/debug/questions/{questionId}", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.recommendationChatService.deleteDebugQuestion.mockResolvedValue(undefined)
  })

  it("deletes a debug question", async () => {
    const response = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ questionId: "00000000-0000-4000-8000-000000000001" }),
    })

    expect(response.status).toBe(204)
    expect(mocks.recommendationChatService.deleteDebugQuestion).toHaveBeenCalledWith({
      questionId: "00000000-0000-4000-8000-000000000001",
    })
  })

  it("rejects invalid question id", async () => {
    const response = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ questionId: "bad-id" }),
    })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidQuery, requestId: "request-1" } },
    })
  })
})

async function readResponse(response: Response) {
  return { status: response.status, body: await response.json() }
}
