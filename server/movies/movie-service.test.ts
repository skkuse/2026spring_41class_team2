import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { MovieNotFoundError } from "./movie-errors"
import { createMovieService } from "./movie-service"
import type { MovieRepository } from "./movie-types"

const context = {
  requestId: "request-1",
  user: null,
}

describe("movieService.listMovies", () => {
  it("maps list rows to MovieCard DTOs and marks guests as not bookmarked", async () => {
    const repository = createRepository({
      listMovies: vi.fn().mockResolvedValue({
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
        totalCount: 12,
      }),
    })
    const service = createMovieService({ repository })

    await expect(service.listMovies(context, { sort: "popular", page: 2, size: 6 })).resolves.toEqual({
      movies: [
        {
          id: 550,
          title: "Fight Club",
          year: 1999,
          rating: 4.2,
          genres: [{ id: 18, name: "Drama" }],
          posterUrl: "https://image.tmdb.org/t/p/w500/poster.jpg",
          isBookmarked: false,
        },
      ],
      page: 2,
      size: 6,
      totalCount: 12,
    })
    expect(repository.listMovies).toHaveBeenCalledWith({ sort: "popular", limit: 6, offset: 6 })
    expect(repository.findBookmarkedMovieIds).not.toHaveBeenCalled()
  })

  it("merges bookmark state for authenticated users", async () => {
    const repository = createRepository({
      listMovies: vi.fn().mockResolvedValue({
        movies: [createListRow({ id: 1 }), createListRow({ id: 2 })],
        totalCount: 2,
      }),
      findBookmarkedMovieIds: vi.fn().mockResolvedValue(new Set([2])),
    })
    const service = createMovieService({ repository })

    const result = await service.listMovies({ requestId: "request-1", user: { id: "user-1", email: "a@b.com" } }, {})

    expect(repository.findBookmarkedMovieIds).toHaveBeenCalledWith({ userId: "user-1", movieIds: [1, 2] })
    expect(result.movies.map((movie) => movie.isBookmarked)).toEqual([false, true])
  })
})

describe("movieService.getMovieDetail", () => {
  it("throws MovieNotFoundError when repository returns null", async () => {
    const service = createMovieService({ repository: createRepository({ getMovieDetail: vi.fn().mockResolvedValue(null) }) })

    await expect(service.getMovieDetail(context, 404)).rejects.toBeInstanceOf(MovieNotFoundError)
  })

  it("maps detail rows with nullable media and full cast", async () => {
    const service = createMovieService({
      repository: createRepository({
        getMovieDetail: vi.fn().mockResolvedValue({
          id: 550,
          title: "Fight Club",
          originalTitle: "Fight Club",
          releaseYear: 1999,
          runtime: 139,
          originalLanguage: "en",
          productionCountries: ["GB", "US"],
          overview: "A story",
          posterPath: null,
          backdropPath: "/backdrop.jpg",
          trailerUrl: null,
          movielensAvgRating: "4.00",
          movielensRatingCount: 20000,
          cinemateRatingSum: "0",
          cinemateReviewCount: 0,
          genres: [{ id: 18, name: "Drama" }],
          director: "David Fincher",
          cast: [{ id: 819, name: "Edward Norton", characterName: "Narrator", profilePath: null }],
          reviewCount: 3,
        }),
      }),
    })

    await expect(service.getMovieDetail(context, 550)).resolves.toMatchObject({
      id: 550,
      posterUrl: null,
      backdropUrl: "https://image.tmdb.org/t/p/w780/backdrop.jpg",
      trailerUrl: null,
      countries: ["GB", "US"],
      cast: [{ id: 819, name: "Edward Norton", characterName: "Narrator", profileUrl: null }],
      reviewCount: 3,
    })
  })
})

function createListRow(input: { id: number }) {
  return {
    id: input.id,
    title: `Movie ${input.id}`,
    releaseYear: 2000,
    posterPath: null,
    movielensAvgRating: "4.00",
    movielensRatingCount: 10000,
    cinemateRatingSum: "0",
    cinemateReviewCount: 0,
    genres: [],
  }
}

function createRepository(overrides: Partial<MovieRepository>): MovieRepository {
  return {
    listMovies: vi.fn().mockResolvedValue({ movies: [], totalCount: 0 }),
    getMovieDetail: vi.fn().mockResolvedValue(null),
    listGenres: vi.fn().mockResolvedValue([]),
    findBookmarkedMovieIds: vi.fn().mockResolvedValue(new Set<number>()),
    isMovieBookmarked: vi.fn().mockResolvedValue(false),
    ...overrides,
  }
}
