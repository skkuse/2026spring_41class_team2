import { describe, expect, it, vi } from "vitest"
import { BookmarkedMoviesApiError, getBookmarkedMovies, toggleMovieBookmark } from "./bookmarked-movies-client"

describe("getBookmarkedMovies", () => {
  it("requests bookmarked movies with page and size", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ movies: [], totalCount: 0 }))

    await expect(getBookmarkedMovies({ page: 1, size: 20 }, fetchImpl)).resolves.toEqual({
      movies: [],
      totalCount: 0,
    })
    expect(fetchImpl).toHaveBeenCalledWith("/api/me/bookmarked-movies?page=1&size=20", { cache: "no-store" })
  })

  it("throws a typed auth error on 401", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ error: { code: "unauthorized", message: "로그인이 필요합니다." } }, { status: 401 }),
    )

    await expect(getBookmarkedMovies({ page: 1, size: 20 }, fetchImpl)).rejects.toMatchObject({
      status: 401,
      code: "unauthorized",
      isUnauthorized: true,
    } satisfies Partial<BookmarkedMoviesApiError>)
  })
})

describe("toggleMovieBookmark", () => {
  it("uses PUT when the next state is bookmarked", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ movieId: 550, isBookmarked: true }))

    await expect(toggleMovieBookmark(550, true, fetchImpl)).resolves.toEqual({ movieId: 550, isBookmarked: true })
    expect(fetchImpl).toHaveBeenCalledWith("/api/me/bookmarked-movies/550", { method: "PUT" })
  })

  it("uses DELETE when the next state is not bookmarked", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ movieId: 550, isBookmarked: false }))

    await expect(toggleMovieBookmark(550, false, fetchImpl)).resolves.toEqual({ movieId: 550, isBookmarked: false })
    expect(fetchImpl).toHaveBeenCalledWith("/api/me/bookmarked-movies/550", { method: "DELETE" })
  })
})

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json" },
  })
}
