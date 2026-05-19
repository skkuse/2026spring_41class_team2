import "server-only"

import type { RequestContext } from "@/server/auth/auth-types"
import { buildTmdbImageUrl, calculateMovieRating } from "@/server/movies/movie-rules"
import { createItemCfRecommendationRepository } from "./item-cf-repository"
import { OnboardingRequiredRecommendationError, UnauthorizedRecommendationError } from "./item-cf-errors"
import {
  buildRecommendationReason,
  buildSectionTitle,
  calculateFallbackCandidateFetchLimit,
  calculateItemCfCandidateFetchLimit,
  normalizeItemCfInput,
  pickSectionMovies,
  toFallbackCandidates,
  toItemCfCandidates,
} from "./item-cf-rules"
import type {
  GetItemCfRecommendationsInput,
  ItemCfRecommendationRepository,
  ItemCfRecommendationService,
  RecommendationCandidate,
  RecommendationSectionDto,
  RecommendationSeedMovieRepoResult,
} from "./item-cf-types"

export type ItemCfRecommendationServiceDeps = {
  repository: ItemCfRecommendationRepository
}

export function createItemCfRecommendationService(
  deps: ItemCfRecommendationServiceDeps,
): ItemCfRecommendationService {
  return {
    async getItemCfRecommendations(context: RequestContext, input: GetItemCfRecommendationsInput) {
      const userId = requireUserId(context)
      const normalized = normalizeItemCfInput(input)
      const seedMovies = await deps.repository.listSeedMovies({ userId, limit: normalized.seedLimit })

      if (seedMovies.length === 0) {
        throw new OnboardingRequiredRecommendationError()
      }

      const excludedMovieIds = await deps.repository.findExcludedMovieIds({ userId })
      const fallbackRows = await deps.repository.listFallbackCandidates({
        excludedMovieIds: [...excludedMovieIds],
        limit: calculateFallbackCandidateFetchLimit(seedMovies.length, normalized.limitPerSeed),
      })
      const fallbackCandidates = toFallbackCandidates(fallbackRows)
      const usedMovieIds = new Set<number>()
      const sections: RecommendationSectionDto[] = []

      for (const seedMovie of seedMovies) {
        const itemCfRows = await deps.repository.listItemCfCandidates({
          sourceMovieId: seedMovie.id,
          limit: calculateItemCfCandidateFetchLimit(normalized.limitPerSeed),
        })
        const itemCfMovies = pickSectionMovies({
          candidates: toItemCfCandidates(itemCfRows),
          excludedMovieIds,
          usedMovieIds,
          limit: normalized.limitPerSeed,
        })
        const fallbackMovies = pickSectionMovies({
          candidates: fallbackCandidates,
          excludedMovieIds,
          usedMovieIds,
          limit: normalized.limitPerSeed - itemCfMovies.length,
        })
        const movies = [...itemCfMovies, ...fallbackMovies]

        sections.push({
          seedMovie: mapSeedMovie(seedMovie),
          title: buildSectionTitle(seedMovie),
          movies: movies.map((movie) => mapRecommendedMovie(seedMovie, movie)),
        })
      }

      return { sections }
    },
  }
}

function requireUserId(context: RequestContext) {
  if (!context.user) {
    throw new UnauthorizedRecommendationError()
  }

  return context.user.id
}

function mapSeedMovie(movie: RecommendationSeedMovieRepoResult) {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.releaseYear,
    posterUrl: buildTmdbImageUrl(movie.posterPath, "w500"),
  }
}

function mapRecommendedMovie(seedMovie: RecommendationSeedMovieRepoResult, movie: RecommendationCandidate) {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.releaseYear,
    rating: calculateMovieRating(movie),
    genres: movie.genres,
    posterUrl: buildTmdbImageUrl(movie.posterPath, "w500"),
    reason: buildRecommendationReason(seedMovie, movie.source),
    source: movie.source,
    score: movie.score,
    coRatingCount: movie.coRatingCount,
    isBookmarked: movie.isBookmarked,
  }
}

export const itemCfRecommendationService = createItemCfRecommendationService({
  repository: createItemCfRecommendationRepository(),
})
