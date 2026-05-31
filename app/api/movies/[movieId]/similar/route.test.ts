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
      listSimilarMovies: vi.fn(),
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

describe("GET /api/movies/{movieId}/similar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.createOptionalRequestContext.mockResolvedValue({ requestId: "request-1", user: null })
    mocks.movieService.listSimilarMovies.mockResolvedValue({ movies: [createMovieCard()] })
  })

  it("returns 400 when movieId is invalid", async () => {
    const response = await GET(new Request("http://localhost/api/movies/abc/similar"), {
      params: Promise.resolve({ movieId: "abc" }),
    })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidMovieId, requestId: "request-1" } },
    })
    expect(mocks.createOptionalRequestContext).not.toHaveBeenCalled()
    expect(mocks.movieService.listSimilarMovies).not.toHaveBeenCalled()
  })

  it("returns 400 when query is invalid", async () => {
    const response = await GET(new Request("http://localhost/api/movies/550/similar?limit=0"), {
      params: Promise.resolve({ movieId: "550" }),
    })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidQuery, requestId: "request-1" } },
    })
    expect(mocks.createOptionalRequestContext).not.toHaveBeenCalled()
    expect(mocks.movieService.listSimilarMovies).not.toHaveBeenCalled()
  })

  it("passes context, movieId, and query to movieService", async () => {
    const response = await GET(new Request("http://localhost/api/movies/550/similar?limit=12"), {
      params: Promise.resolve({ movieId: "550" }),
    })

    await expect(readResponse(response)).resolves.toEqual({
      status: 200,
      body: { movies: [createMovieCard()] },
    })
    expect(mocks.movieService.listSimilarMovies).toHaveBeenCalledWith(
      { requestId: "request-1", user: null },
      550,
      { limit: 12 },
    )
  })

  it("returns 404 when source movie is not found", async () => {
    mocks.movieService.listSimilarMovies.mockRejectedValue(new mocks.MovieNotFoundError(404))

    const response = await GET(new Request("http://localhost/api/movies/404/similar"), {
      params: Promise.resolve({ movieId: "404" }),
    })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 404,
      body: { error: { code: apiErrorCodes.movieNotFound, requestId: "request-1" } },
    })
  })

  it("returns 500 when an unknown error is thrown", async () => {
    mocks.movieService.listSimilarMovies.mockRejectedValue(new Error("DB failed"))

    const response = await GET(new Request("http://localhost/api/movies/550/similar"), {
      params: Promise.resolve({ movieId: "550" }),
    })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 500,
      body: { error: { code: apiErrorCodes.similarMoviesFailed, requestId: "request-1" } },
    })
  })
})

function createMovieCard() {
  return {
    id: 550,
    title: "Fight Club",
    year: 1999,
    rating: 4.2,
    genres: [],
    posterUrl: null,
    isBookmarked: false,
  }
}

async function readResponse(response: Response) {
  return {
    status: response.status,
    body: await response.json(),
  }
}
