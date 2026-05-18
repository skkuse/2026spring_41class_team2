import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createRequestId: vi.fn(),
  movieService: {
    listGenres: vi.fn(),
  },
}))

vi.mock("server-only", () => ({}))

vi.mock("@/server/auth/request-context", () => ({
  createRequestId: mocks.createRequestId,
}))

vi.mock("@/server/logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock("@/server/movies", () => ({
  movieService: mocks.movieService,
}))

import { apiErrorCodes } from "@/server/error"
import { GET } from "./route"

describe("GET /api/genres", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.movieService.listGenres.mockResolvedValue({ genres: [] })
  })

  it("returns 500 when listGenres fails", async () => {
    mocks.movieService.listGenres.mockRejectedValue(new Error("DB failed"))

    const response = await GET()

    await expect(readResponse(response)).resolves.toEqual({
      status: 500,
      body: {
        error: {
          code: apiErrorCodes.genreListFailed,
          message: "장르 목록을 조회하지 못했습니다.",
          requestId: "request-1",
        },
      },
    })
  })
})

async function readResponse(response: Response) {
  return {
    status: response.status,
    body: await response.json(),
  }
}
