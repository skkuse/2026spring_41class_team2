import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createRequestId: vi.fn(),
  recommendationChatService: {
    listDebugQuestions: vi.fn(),
    createDebugQuestion: vi.fn(),
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
import { GET, POST } from "./route"

describe("/api/recommendation-chat/debug/questions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.recommendationChatService.listDebugQuestions.mockResolvedValue({
      questions: [{ id: "00000000-0000-4000-8000-000000000001", text: "코미디 추천", createdAt: "2026-05-31T00:00:00.000Z" }],
    })
    mocks.recommendationChatService.createDebugQuestion.mockResolvedValue({
      question: { id: "00000000-0000-4000-8000-000000000002", text: "공포 추천", createdAt: "2026-05-31T00:00:00.000Z" },
    })
  })

  it("lists debug questions", async () => {
    const response = await GET()

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 200,
      body: { questions: [{ text: "코미디 추천" }] },
    })
  })

  it("creates debug question from valid body", async () => {
    const response = await POST(jsonRequest({ text: "  공포 추천  " }))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 201,
      body: { question: { text: "공포 추천" } },
    })
    expect(mocks.recommendationChatService.createDebugQuestion).toHaveBeenCalledWith({ text: "공포 추천" })
  })

  it("rejects invalid create body", async () => {
    const response = await POST(jsonRequest({ text: "" }))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidBody, requestId: "request-1" } },
    })
  })
})

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/recommendation-chat/debug/questions", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

async function readResponse(response: Response) {
  return { status: response.status, body: await response.json() }
}
