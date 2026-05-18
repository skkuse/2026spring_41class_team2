import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  class MovieNotFoundError extends Error {
    constructor(movieId: number) {
      super(`Movie not found: ${movieId}`)
      this.name = "MovieNotFoundError"
    }
  }

  return {
    createOptionalRequestContext: vi.fn(),
    createRequestId: vi.fn(),
    MovieNotFoundError,
    movieService: {
      getMovieDetail: vi.fn(),
    },
  }
})

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
  MovieNotFoundError: mocks.MovieNotFoundError,
  movieService: mocks.movieService,
}))

import { apiErrorCodes } from "@/server/error"
import { GET } from "./route"

describe("GET /api/movies/{movieId}", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.createOptionalRequestContext.mockResolvedValue({ requestId: "request-1", user: null })
    mocks.movieService.getMovieDetail.mockResolvedValue(createMovieDetail())
  })

  it("returns 400 when movieId is invalid", async () => {
    const response = await GET(new Request("http://localhost/api/movies/abc"), {
      params: Promise.resolve({ movieId: "abc" }),
    })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidMovieId, requestId: "request-1" } },
    })
    expect(mocks.createOptionalRequestContext).not.toHaveBeenCalled()
    expect(mocks.movieService.getMovieDetail).not.toHaveBeenCalled()
  })

  it("returns 404 when movie is not found", async () => {
    mocks.movieService.getMovieDetail.mockRejectedValue(new mocks.MovieNotFoundError(404))

    const response = await GET(new Request("http://localhost/api/movies/404"), {
      params: Promise.resolve({ movieId: "404" }),
    })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 404,
      body: { error: { code: apiErrorCodes.movieNotFound, requestId: "request-1" } },
    })
  })

  it("returns 500 when an unknown error is thrown", async () => {
    mocks.movieService.getMovieDetail.mockRejectedValue(new Error("DB failed"))

    const response = await GET(new Request("http://localhost/api/movies/550"), {
      params: Promise.resolve({ movieId: "550" }),
    })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 500,
      body: { error: { code: apiErrorCodes.movieDetailFailed, requestId: "request-1" } },
    })
  })
})

function createMovieDetail() {
  return {
    id: 550,
    title: "Fight Club",
    originalTitle: "Fight Club",
    year: 1999,
    rating: 4.2,
    genres: [],
    runtime: 139,
    originalLanguage: "en",
    countries: [],
    director: null,
    cast: [],
    synopsis: null,
    posterUrl: null,
    backdropUrl: null,
    trailerUrl: null,
    isBookmarked: false,
    reviewCount: 0,
  }
}

async function readResponse(response: Response) {
  return {
    status: response.status,
    body: await response.json(),
  }
}
