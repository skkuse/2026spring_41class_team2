import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createRequestId: vi.fn(),
  recommendationChatService: {
    deleteDebugQuestion: vi.fn(),
    updateDebugQuestion: vi.fn(),
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
import { DELETE, PATCH } from "./route"

describe("DELETE /api/recommendation-chat/debug/questions/{questionId}", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.recommendationChatService.deleteDebugQuestion.mockResolvedValue(undefined)
    mocks.recommendationChatService.updateDebugQuestion.mockResolvedValue({
      question: {
        id: "00000000-0000-4000-8000-000000000001",
        text: "코미디 추천",
        isBuggy: true,
        createdAt: "2026-05-31T00:00:00.000Z",
      },
    })
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

  it("updates a debug question bug marker", async () => {
    const response = await PATCH(jsonRequest({ isBuggy: true }), {
      params: Promise.resolve({ questionId: "00000000-0000-4000-8000-000000000001" }),
    })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 200,
      body: { question: { text: "코미디 추천", isBuggy: true } },
    })
    expect(mocks.recommendationChatService.updateDebugQuestion).toHaveBeenCalledWith({
      questionId: "00000000-0000-4000-8000-000000000001",
      isBuggy: true,
    })
  })

  it("rejects invalid update body", async () => {
    const response = await PATCH(jsonRequest({ isBuggy: "yes" }), {
      params: Promise.resolve({ questionId: "00000000-0000-4000-8000-000000000001" }),
    })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidBody, requestId: "request-1" } },
    })
  })
})

function jsonRequest(body: unknown) {
  return new Request("http://localhost", {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

async function readResponse(response: Response) {
  return { status: response.status, body: await response.json() }
}
