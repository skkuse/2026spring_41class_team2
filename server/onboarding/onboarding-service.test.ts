import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { InvalidPreferredMoviesError, UnauthorizedOnboardingError } from "./onboarding-errors"
import { createOnboardingService } from "./onboarding-service"
import type { OnboardingRepository } from "./onboarding-types"

const guestContext = { requestId: "request-1", user: null }
const userContext = { requestId: "request-1", user: { id: "user-1", email: "user@example.com" } }
const now = new Date("2026-05-19T00:00:00.000Z")

describe("onboardingService.listPreferredMovies", () => {
  it("requires an authenticated user", async () => {
    const service = createOnboardingService({ repository: createRepository(), clock: () => now })

    await expect(service.listPreferredMovies(guestContext)).rejects.toBeInstanceOf(UnauthorizedOnboardingError)
  })

  it("maps preferred movies to MovieCard DTOs", async () => {
    const service = createOnboardingService({
      repository: createRepository({
        listPreferredMovies: vi.fn().mockResolvedValue([
          {
            ...createMovie({ id: 550 }),
            title: "Fight Club",
            releaseYear: 1999,
            posterPath: "/poster.jpg",
            genres: [{ id: 18, name: "Drama" }],
          },
        ]),
      }),
      clock: () => now,
    })

    await expect(service.listPreferredMovies(userContext)).resolves.toEqual({
      movies: [
        {
          id: 550,
          title: "Fight Club",
          year: 1999,
          rating: 4,
          genres: [{ id: 18, name: "Drama" }],
          posterUrl: "https://image.tmdb.org/t/p/w500/poster.jpg",
          isBookmarked: false,
        },
      ],
    })
  })
})

describe("onboardingService.savePreferredMovies", () => {
  it("requires an authenticated user", async () => {
    const service = createOnboardingService({ repository: createRepository(), clock: () => now })

    await expect(service.savePreferredMovies(guestContext, { movieIds: [1, 2, 3, 4, 5] })).rejects.toBeInstanceOf(
      UnauthorizedOnboardingError,
    )
  })

  it("rejects invalid counts and duplicates before repository access", async () => {
    const repository = createRepository()
    const service = createOnboardingService({ repository, clock: () => now })

    await expect(service.savePreferredMovies(userContext, { movieIds: [1, 2, 3, 4] })).rejects.toBeInstanceOf(
      InvalidPreferredMoviesError,
    )
    await expect(service.savePreferredMovies(userContext, { movieIds: [1, 2, 3, 4, 4] })).rejects.toBeInstanceOf(
      InvalidPreferredMoviesError,
    )
    expect(repository.findOnboardingCandidateMovies).not.toHaveBeenCalled()
    expect(repository.replacePreferredMovies).not.toHaveBeenCalled()
  })

  it("rejects missing movies and movies without MovieLens mapping", async () => {
    const service = createOnboardingService({
      repository: createRepository({
        findOnboardingCandidateMovies: vi
          .fn()
          .mockResolvedValue([createMovie({ id: 1 }), createMovie({ id: 2 }), createMovie({ id: 3 }), createMovie({ id: 4 })]),
      }),
      clock: () => now,
    })

    await expect(service.savePreferredMovies(userContext, { movieIds: [1, 2, 3, 4, 5] })).rejects.toBeInstanceOf(
      InvalidPreferredMoviesError,
    )

    const serviceWithoutMapping = createOnboardingService({
      repository: createRepository({
        findOnboardingCandidateMovies: vi.fn().mockResolvedValue([
          createMovie({ id: 1 }),
          createMovie({ id: 2 }),
          createMovie({ id: 3, movielensId: null }),
          createMovie({ id: 4 }),
          createMovie({ id: 5 }),
        ]),
      }),
      clock: () => now,
    })

    await expect(
      serviceWithoutMapping.savePreferredMovies(userContext, { movieIds: [1, 2, 3, 4, 5] }),
    ).rejects.toBeInstanceOf(InvalidPreferredMoviesError)
  })

  it("replaces existing preferences with request order", async () => {
    const repository = createRepository({
      findOnboardingCandidateMovies: vi
        .fn()
        .mockResolvedValue([createMovie({ id: 50 }), createMovie({ id: 40 }), createMovie({ id: 30 }), createMovie({ id: 20 }), createMovie({ id: 10 })]),
    })
    const service = createOnboardingService({ repository, clock: () => now })

    await expect(service.savePreferredMovies(userContext, { movieIds: [50, 40, 30, 20, 10] })).resolves.toEqual({
      movieIds: [50, 40, 30, 20, 10],
      onboardingCompleted: true,
    })
    expect(repository.replacePreferredMovies).toHaveBeenCalledWith({
      userId: "user-1",
      movies: [
        { movieId: 50, position: 1 },
        { movieId: 40, position: 2 },
        { movieId: 30, position: 3 },
        { movieId: 20, position: 4 },
        { movieId: 10, position: 5 },
      ],
      updatedAt: now,
    })
  })
})

function createMovie(input: { id: number; movielensId?: number | null }) {
  return {
    id: input.id,
    title: `Movie ${input.id}`,
    releaseYear: 2000,
    posterPath: null,
    movielensId: input.movielensId === undefined ? input.id + 1000 : input.movielensId,
    movielensAvgRating: "4.00",
    movielensRatingCount: 10000,
    cinemateRatingSum: "0",
    cinemateReviewCount: 0,
    isBookmarked: false,
    genres: [],
  }
}

function createRepository(overrides: Partial<OnboardingRepository> = {}): OnboardingRepository {
  return {
    listPreferredMovies: vi.fn().mockResolvedValue([]),
    findOnboardingCandidateMovies: vi
      .fn()
      .mockResolvedValue([createMovie({ id: 1 }), createMovie({ id: 2 }), createMovie({ id: 3 }), createMovie({ id: 4 }), createMovie({ id: 5 })]),
    replacePreferredMovies: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}
