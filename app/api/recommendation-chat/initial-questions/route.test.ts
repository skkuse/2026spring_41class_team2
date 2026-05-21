import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  recommendationChatService: {
    listInitialQuestions: vi.fn(),
  },
}))

vi.mock("server-only", () => ({}))
vi.mock("@/server/recommendation-chat", () => ({
  recommendationChatService: mocks.recommendationChatService,
}))

import { GET } from "./route"

describe("GET /api/recommendation-chat/initial-questions", () => {
  it("returns initial questions without authentication", async () => {
    const questions = [
      "잔잔하고 여운 남는 일본 로맨스 영화 추천해줘",
      "좀비가 등장하는 숨 막히는 공포 영화 추천해줘",
      "어두운 범죄 스릴러 중에 분위기 묵직한 거 추천해줘",
      "우주 배경의 SF 모험 영화 찾아줘",
      "가볍고 웃긴 코미디 영화 추천해줘",
      "러닝타임 2시간 이하 코미디 추천해줘",
    ]

    mocks.recommendationChatService.listInitialQuestions.mockReturnValue({
      questions,
    })

    const response = await GET()

    await expect(readResponse(response)).resolves.toEqual({
      status: 200,
      body: {
        questions,
      },
    })
  })
})

async function readResponse(response: Response) {
  return { status: response.status, body: await response.json() }
}
