import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createOptionalRequestContext: vi.fn(),
  createRequestId: vi.fn(),
  movieService: {
    listMovies: vi.fn(),
  },
}))

vi.mock("server-only", () => ({}))

vi.mock("@/server/auth/request-context", () => ({
  createOptionalRequestContext: mocks.createOptionalRequestContext,
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

describe("GET /api/movies", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.createOptionalRequestContext.mockResolvedValue({ requestId: "request-1", user: null })
    mocks.movieService.listMovies.mockResolvedValue({ movies: [] })
  })

  it("returns 400 when query is invalid", async () => {
    const response = await GET(new Request("http://localhost/api/movies?limit=0"))

    await expect(readResponse(response)).resolves.toEqual({
      status: 400,
      body: {
        error: {
          code: apiErrorCodes.invalidQuery,
          message: "요청 query가 올바르지 않습니다.",
          requestId: "request-1",
        },
      },
    })
    expect(mocks.createOptionalRequestContext).not.toHaveBeenCalled()
    expect(mocks.movieService.listMovies).not.toHaveBeenCalled()
  })

  it("returns 500 when listMovies fails", async () => {
    mocks.movieService.listMovies.mockRejectedValue(new Error("DB failed"))

    const response = await GET(new Request("http://localhost/api/movies"))

    await expect(readResponse(response)).resolves.toEqual({
      status: 500,
      body: {
        error: {
          code: apiErrorCodes.movieListFailed,
          message: "영화 목록을 조회하지 못했습니다.",
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
