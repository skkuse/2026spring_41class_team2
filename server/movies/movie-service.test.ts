import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { MovieNotFoundError } from "./movie-errors"
import { createMovieService } from "./movie-service"
import type { MovieRepository } from "./movie-types"
import type { ItemCfRecommendationRepository } from "@/server/recommendations/item-cf-types"

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

  it("passes genreId to the repository when provided", async () => {
    const repository = createRepository({
      listMovies: vi.fn().mockResolvedValue({ movies: [], totalCount: 0 }),
    })
    const service = createMovieService({ repository })

    await service.listMovies(context, { sort: "popular", page: 1, size: 20, genreId: 28 })

    expect(repository.listMovies).toHaveBeenCalledWith(
      expect.objectContaining({ genreId: 28 }),
    )
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

describe("movieService.listSimilarMovies", () => {
  it("throws MovieNotFoundError when the source movie does not exist", async () => {
    const service = createMovieService({
      repository: createRepository({ getMovieDetail: vi.fn().mockResolvedValue(null) }),
      itemCfRepository: createItemCfRepository(),
    })

    await expect(service.listSimilarMovies(context, 404, {})).rejects.toBeInstanceOf(MovieNotFoundError)
  })

  it("returns Item CF movies first and fills shortages with fallback popular movies", async () => {
    const itemCfRepository = createItemCfRepository({
      findExcludedMovieIds: vi.fn().mockResolvedValue(new Set([10, 101])),
      listItemCfCandidates: vi
        .fn()
        .mockResolvedValue([createRecommendationMovie(101), createRecommendationMovie(102, { score: 0.9 })]),
      listFallbackCandidates: vi.fn().mockResolvedValue([
        createRecommendationMovie(102),
        createRecommendationMovie(103, { posterPath: null }),
        createRecommendationMovie(104),
      ]),
    })
    const service = createMovieService({
      repository: createRepository({ getMovieDetail: vi.fn().mockResolvedValue(createDetailRow({ id: 10 })) }),
      itemCfRepository,
    })

    await expect(
      service.listSimilarMovies({ requestId: "request-1", user: { id: "user-1", email: "a@b.com" } }, 10, { limit: 3 }),
    ).resolves.toEqual({
      movies: [
        {
          id: 102,
          title: "Movie 102",
          year: 2000,
          rating: 4,
          genres: [],
          posterUrl: "https://image.tmdb.org/t/p/w500/poster-102.jpg",
          isBookmarked: false,
        },
        {
          id: 103,
          title: "Movie 103",
          year: 2000,
          rating: 4,
          genres: [],
          posterUrl: null,
          isBookmarked: false,
        },
        {
          id: 104,
          title: "Movie 104",
          year: 2000,
          rating: 4,
          genres: [],
          posterUrl: "https://image.tmdb.org/t/p/w500/poster-104.jpg",
          isBookmarked: false,
        },
      ],
    })
    expect(itemCfRepository.findExcludedMovieIds).toHaveBeenCalledWith({ userId: "user-1" })
    expect(itemCfRepository.listItemCfCandidates).toHaveBeenCalledWith({ sourceMovieId: 10, limit: 15 })
    expect(itemCfRepository.listFallbackCandidates).toHaveBeenCalledWith({ excludedMovieIds: [10, 101], limit: 15 })
  })

  it("does not load user exclusions for guests", async () => {
    const itemCfRepository = createItemCfRepository({
      listItemCfCandidates: vi.fn().mockResolvedValue([createRecommendationMovie(10), createRecommendationMovie(20)]),
    })
    const service = createMovieService({
      repository: createRepository({ getMovieDetail: vi.fn().mockResolvedValue(createDetailRow({ id: 10 })) }),
      itemCfRepository,
    })

    const result = await service.listSimilarMovies(context, 10, { limit: 1 })

    expect(result.movies.map((movie) => movie.id)).toEqual([20])
    expect(itemCfRepository.findExcludedMovieIds).not.toHaveBeenCalled()
    expect(itemCfRepository.listFallbackCandidates).not.toHaveBeenCalled()
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

function createDetailRow(input: { id: number }) {
  return {
    ...createListRow(input),
    originalTitle: `Original ${input.id}`,
    runtime: 120,
    originalLanguage: "en",
    productionCountries: [],
    overview: null,
    backdropPath: null,
    trailerUrl: null,
    director: null,
    cast: [],
    reviewCount: 0,
  }
}

function createRecommendationMovie(
  id: number,
  overrides: Partial<ReturnType<typeof createRecommendationMovieBase>> = {},
) {
  return {
    ...createRecommendationMovieBase(id),
    ...overrides,
  }
}

function createRecommendationMovieBase(id: number) {
  return {
    ...createListRow({ id }),
    posterPath: `/poster-${id}.jpg`,
    isBookmarked: false,
    score: 0.8,
    coRatingCount: 20,
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

function createItemCfRepository(overrides: Partial<ItemCfRecommendationRepository> = {}): ItemCfRecommendationRepository {
  return {
    listSeedMovies: vi.fn().mockResolvedValue([]),
    findExcludedMovieIds: vi.fn().mockResolvedValue(new Set<number>()),
    listItemCfCandidates: vi.fn().mockResolvedValue([]),
    listFallbackCandidates: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}
