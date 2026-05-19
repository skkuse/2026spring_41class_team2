import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { OnboardingRequiredRecommendationError, UnauthorizedRecommendationError } from "./item-cf-errors"
import { createItemCfRecommendationService } from "./item-cf-service"
import { MAX_SIMILAR_MOVIES_PER_SOURCE } from "./item-cf-rules"
import type { ItemCfRecommendationRepository } from "./item-cf-types"

const guestContext = { requestId: "request-1", user: null }
const userContext = { requestId: "request-1", user: { id: "user-1", email: "user@example.com" } }

describe("itemCfRecommendationService.getItemCfRecommendations", () => {
  it("requires authentication", async () => {
    const service = createItemCfRecommendationService({ repository: createRepository() })

    await expect(service.getItemCfRecommendations(guestContext, {})).rejects.toBeInstanceOf(
      UnauthorizedRecommendationError,
    )
  })

  it("requires completed onboarding seed movies", async () => {
    const service = createItemCfRecommendationService({
      repository: createRepository({ listSeedMovies: vi.fn().mockResolvedValue([]) }),
    })

    await expect(service.getItemCfRecommendations(userContext, {})).rejects.toBeInstanceOf(
      OnboardingRequiredRecommendationError,
    )
  })

  it("builds sections from seed order and fills shortages with fallback without duplicates", async () => {
    const repository = createRepository({
      listSeedMovies: vi.fn().mockResolvedValue([createSeedMovie(10, 1), createSeedMovie(20, 2)]),
      findExcludedMovieIds: vi.fn().mockResolvedValue(new Set([10, 20, 101])),
      listItemCfCandidates: vi
        .fn()
        .mockResolvedValueOnce([createItemCfMovie(101, 0.9), createItemCfMovie(102, 0.8)])
        .mockResolvedValueOnce([createItemCfMovie(102, 0.95), createItemCfMovie(201, 0.7)]),
      listFallbackCandidates: vi.fn().mockResolvedValue([
        createMovie(102),
        createMovie(103, { posterPath: null }),
        createMovie(202),
        createMovie(203),
      ]),
    })
    const service = createItemCfRecommendationService({ repository })

    await expect(service.getItemCfRecommendations(userContext, { seedLimit: 2, limitPerSeed: 2 })).resolves.toEqual({
      sections: [
        {
          seedMovie: { id: 10, title: "매트릭스", year: 2000, posterUrl: "https://image.tmdb.org/t/p/w500/seed-10.jpg" },
          title: "매트릭스를 좋아한 사람들이 함께 좋아한 영화",
          movies: [
            expect.objectContaining({ id: 102, source: "item_cf", score: 0.8, coRatingCount: 20 }),
            expect.objectContaining({ id: 103, source: "fallback", score: null, coRatingCount: null, posterUrl: null }),
          ],
        },
        {
          seedMovie: { id: 20, title: "기생충", year: 2000, posterUrl: "https://image.tmdb.org/t/p/w500/seed-20.jpg" },
          title: "기생충을 좋아한 사람들이 함께 좋아한 영화",
          movies: [
            expect.objectContaining({ id: 201, source: "item_cf" }),
            expect.objectContaining({ id: 202, source: "fallback" }),
          ],
        },
      ],
    })
  })

  it("caps Item CF repository limit with the source seed max constant", async () => {
    const repository = createRepository({
      listSeedMovies: vi.fn().mockResolvedValue([createSeedMovie(10, 1)]),
      listItemCfCandidates: vi.fn().mockResolvedValue([]),
    })
    const service = createItemCfRecommendationService({ repository })

    await service.getItemCfRecommendations(userContext, { seedLimit: 1, limitPerSeed: 20 })

    expect(repository.listItemCfCandidates).toHaveBeenCalledWith({ sourceMovieId: 10, limit: MAX_SIMILAR_MOVIES_PER_SOURCE })
  })
})

function createRepository(overrides: Partial<ItemCfRecommendationRepository> = {}): ItemCfRecommendationRepository {
  return {
    listSeedMovies: vi.fn().mockResolvedValue([createSeedMovie(1, 1)]),
    findExcludedMovieIds: vi.fn().mockResolvedValue(new Set([1])),
    listItemCfCandidates: vi.fn().mockResolvedValue([]),
    listFallbackCandidates: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

function createSeedMovie(id: number, position: number) {
  return {
    ...createMovie(id, { title: id === 10 ? "매트릭스" : "기생충", posterPath: `/seed-${id}.jpg` }),
    position,
  }
}

function createItemCfMovie(id: number, score: number) {
  return {
    ...createMovie(id),
    score,
    coRatingCount: 20,
  }
}

type TestMovie = Omit<ReturnType<typeof createMovieBase>, "posterPath"> & {
  posterPath: string | null
}

function createMovie(id: number, overrides: Partial<TestMovie> = {}) {
  return {
    ...createMovieBase(id),
    ...overrides,
  }
}

function createMovieBase(id: number) {
  return {
    id,
    title: `Movie ${id}`,
    releaseYear: 2000,
    posterPath: `/poster-${id}.jpg`,
    movielensAvgRating: "4.00",
    movielensRatingCount: 100,
    cinemateRatingSum: "0",
    cinemateReviewCount: 0,
    genres: [],
    isBookmarked: false,
  }
}
