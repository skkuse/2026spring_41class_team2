import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { BookmarkMovieNotFoundError, UnauthorizedBookmarkError } from "./bookmark-errors"
import { createBookmarkService } from "./bookmark-service"
import type { BookmarkRepository } from "./bookmark-types"

const guestContext = { requestId: "request-1", user: null }
const userContext = { requestId: "request-1", user: { id: "user-1", email: "user@example.com" } }

describe("bookmarkService.addBookmark", () => {
  it("requires an authenticated user", async () => {
    const service = createBookmarkService({ repository: createRepository() })

    await expect(service.addBookmark(guestContext, { movieId: 550 })).rejects.toBeInstanceOf(UnauthorizedBookmarkError)
  })

  it("throws when the movie does not exist", async () => {
    const service = createBookmarkService({
      repository: createRepository({ movieExists: vi.fn().mockResolvedValue(false) }),
    })

    await expect(service.addBookmark(userContext, { movieId: 404 })).rejects.toBeInstanceOf(BookmarkMovieNotFoundError)
  })

  it("adds a bookmark idempotently", async () => {
    const repository = createRepository()
    const service = createBookmarkService({ repository })

    await expect(service.addBookmark(userContext, { movieId: 550 })).resolves.toEqual({
      movieId: 550,
      isBookmarked: true,
    })
    expect(repository.addBookmark).toHaveBeenCalledWith({ userId: "user-1", movieId: 550 })
  })
})

describe("bookmarkService.removeBookmark", () => {
  it("returns false when an existing movie has no bookmark row", async () => {
    const repository = createRepository()
    const service = createBookmarkService({ repository })

    await expect(service.removeBookmark(userContext, { movieId: 550 })).resolves.toEqual({
      movieId: 550,
      isBookmarked: false,
    })
    expect(repository.removeBookmark).toHaveBeenCalledWith({ userId: "user-1", movieId: 550 })
  })
})

describe("bookmarkService.getBookmarkedMovies", () => {
  it("maps bookmarked movies to MovieCard DTOs", async () => {
    const repository = createRepository({
      listBookmarkedMovies: vi.fn().mockResolvedValue({
        movies: [
          {
            id: 550,
            title: "Fight Club",
            releaseYear: 1999,
            posterPath: "/poster.jpg",
            movielensAvgRating: "4.20",
            movielensRatingCount: 10000,
            cinemateRatingSum: "5.00",
            cinemateReviewCount: 1,
            genres: [{ id: 18, name: "Drama" }],
          },
        ],
        totalCount: 1,
      }),
    })
    const service = createBookmarkService({ repository })

    await expect(service.getBookmarkedMovies(userContext, { page: 2, size: 10 })).resolves.toEqual({
      movies: [
        {
          id: 550,
          title: "Fight Club",
          year: 1999,
          rating: 4.2,
          genres: [{ id: 18, name: "Drama" }],
          posterUrl: "https://image.tmdb.org/t/p/w500/poster.jpg",
          isBookmarked: true,
        },
      ],
      totalCount: 1,
    })
    expect(repository.listBookmarkedMovies).toHaveBeenCalledWith({ userId: "user-1", limit: 10, offset: 10 })
  })
})

function createRepository(overrides: Partial<BookmarkRepository> = {}): BookmarkRepository {
  return {
    movieExists: vi.fn().mockResolvedValue(true),
    addBookmark: vi.fn().mockResolvedValue(undefined),
    removeBookmark: vi.fn().mockResolvedValue(undefined),
    listBookmarkedMovies: vi.fn().mockResolvedValue({ movies: [], totalCount: 0 }),
    ...overrides,
  }
}
