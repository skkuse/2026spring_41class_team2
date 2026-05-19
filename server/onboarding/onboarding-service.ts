import "server-only"

import type { RequestContext } from "@/server/auth/auth-types"
import { buildTmdbImageUrl, calculateMovieRating } from "@/server/movies/movie-rules"
import { InvalidPreferredMoviesError, UnauthorizedOnboardingError } from "./onboarding-errors"
import { createOnboardingRepository } from "./onboarding-repository"
import { createPreferredMoviePositions } from "./onboarding-rules"
import type {
  OnboardingMovieRepoResult,
  OnboardingRepository,
  OnboardingService,
  PreferredMoviesResponseDto,
  SavePreferredMoviesInput,
  SavePreferredMoviesResponseDto,
} from "./onboarding-types"

export type OnboardingServiceDeps = {
  repository: OnboardingRepository
  clock: () => Date
}

export function createOnboardingService(deps: OnboardingServiceDeps): OnboardingService {
  return {
    async listPreferredMovies(context: RequestContext): Promise<PreferredMoviesResponseDto> {
      const userId = requireUserId(context)
      const movies = await deps.repository.listPreferredMovies(userId)

      return {
        movies: movies.map(mapMovieCard),
      }
    },

    async savePreferredMovies(
      context: RequestContext,
      input: SavePreferredMoviesInput,
    ): Promise<SavePreferredMoviesResponseDto> {
      const userId = requireUserId(context)
      const positionedMovies = createPreferredMoviePositions(input.movieIds)
      const candidates = await deps.repository.findOnboardingCandidateMovies({ movieIds: input.movieIds })
      ensureAllMoviesAreValidCandidates(input.movieIds, candidates)

      await deps.repository.replacePreferredMovies({
        userId,
        movies: positionedMovies,
        updatedAt: deps.clock(),
      })

      return {
        movieIds: input.movieIds,
        onboardingCompleted: true,
      }
    },
  }
}

function requireUserId(context: RequestContext) {
  if (!context.user) {
    throw new UnauthorizedOnboardingError()
  }

  return context.user.id
}

function ensureAllMoviesAreValidCandidates(movieIds: number[], candidates: OnboardingMovieRepoResult[]) {
  const candidatesById = new Map(candidates.map((movie) => [movie.id, movie]))

  for (const movieId of movieIds) {
    const candidate = candidatesById.get(movieId)
    if (!candidate) {
      throw new InvalidPreferredMoviesError("Preferred movies must exist")
    }

    if (candidate.movielensId === null) {
      throw new InvalidPreferredMoviesError("Preferred movies must have MovieLens mapping")
    }
  }
}

function mapMovieCard(movie: OnboardingMovieRepoResult) {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.releaseYear,
    rating: calculateMovieRating(movie),
    genres: movie.genres,
    posterUrl: buildTmdbImageUrl(movie.posterPath, "w500"),
    isBookmarked: movie.isBookmarked,
  }
}

export const onboardingService = createOnboardingService({
  repository: createOnboardingRepository(),
  clock: () => new Date(),
})
