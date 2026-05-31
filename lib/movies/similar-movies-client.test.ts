import { describe, expect, it, vi } from "vitest"
import { getSimilarMovies, SimilarMoviesApiError } from "./similar-movies-client"

describe("getSimilarMovies", () => {
  it("requests similar movies with query params", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ movies: [] }))

    await expect(getSimilarMovies(550, { limit: 4 }, fetchImpl)).resolves.toEqual({ movies: [] })
    expect(fetchImpl).toHaveBeenCalledWith("/api/movies/550/similar?limit=4", {
      cache: "no-store",
    })
  })

  it("omits the query string when limit is not provided", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ movies: [] }))

    await getSimilarMovies(550, {}, fetchImpl)

    expect(fetchImpl).toHaveBeenCalledWith("/api/movies/550/similar", {
      cache: "no-store",
    })
  })

  it("throws a typed API error with server error details", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        { error: { code: "similar_movies_failed", message: "비슷한 영화를 조회하지 못했습니다.", requestId: "request-1" } },
        { status: 500 },
      ),
    )

    await expect(getSimilarMovies(550, {}, fetchImpl)).rejects.toMatchObject({
      status: 500,
      code: "similar_movies_failed",
      requestId: "request-1",
    } satisfies Partial<SimilarMoviesApiError>)
  })
})

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json" },
  })
}
