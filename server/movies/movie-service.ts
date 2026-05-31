import "server-only"

import type { RequestContext } from "@/server/auth/auth-types"
import {
  buildTmdbImageUrl,
  calculateMovieRating,
  MIN_RATING_SORT_MOVIELENS_COUNT,
  normalizeCountries,
  normalizeMovieListInput,
} from "./movie-rules"
import { MovieNotFoundError } from "./movie-errors"
import { createMovieRepository } from "./movie-repository"
import { createItemCfRecommendationRepository } from "@/server/recommendations/item-cf-repository"
import {
  calculateFallbackCandidateFetchLimit,
  calculateItemCfCandidateFetchLimit,
  pickSectionMovies,
  toFallbackCandidates,
  toItemCfCandidates,
} from "@/server/recommendations/item-cf-rules"
import type { ItemCfRecommendationRepository } from "@/server/recommendations/item-cf-types"
import type { ListMoviesInput, MovieDetailDto, MovieRepository, MovieService } from "./movie-types"

export type MovieServiceDeps = {
  repository: MovieRepository
  itemCfRepository?: Pick<
    ItemCfRecommendationRepository,
    "findExcludedMovieIds" | "listItemCfCandidates" | "listFallbackCandidates"
  >
}

export function createMovieService(deps: MovieServiceDeps): MovieService {
  const itemCfRepository = deps.itemCfRepository ?? createItemCfRecommendationRepository()

  return {
    async listMovies(context: RequestContext, input: ListMoviesInput) {
      const normalized = normalizeMovieListInput(input)
      const result = await deps.repository.listMovies({
        ...(normalized.q ? { q: normalized.q } : {}),
        sort: normalized.sort,
        limit: normalized.size,
        offset: normalized.offset,
        ...(normalized.sort === "rating" ? { minMovielensRatingCount: MIN_RATING_SORT_MOVIELENS_COUNT } : {}),
        ...(normalized.genreId ? { genreId: normalized.genreId } : {}),
      })
      const movieIds = result.movies.map((row) => row.id)
      const bookmarkedMovieIds =
        context.user && movieIds.length > 0
          ? await deps.repository.findBookmarkedMovieIds({ userId: context.user.id, movieIds })
          : new Set<number>()

      return {
        movies: result.movies.map((row) => ({
          id: row.id,
          title: row.title,
          year: row.releaseYear,
          rating: calculateMovieRating(row),
          genres: row.genres,
          posterUrl: buildTmdbImageUrl(row.posterPath, "w500"),
          isBookmarked: bookmarkedMovieIds.has(row.id),
        })),
        page: normalized.page,
        size: normalized.size,
        totalCount: result.totalCount,
      }
    },

    async getMovieDetail(context: RequestContext, movieId: number): Promise<MovieDetailDto> {
      const row = await deps.repository.getMovieDetail(movieId)
      if (!row) {
        throw new MovieNotFoundError(movieId)
      }

      const isBookmarked = context.user
        ? await deps.repository.isMovieBookmarked({ userId: context.user.id, movieId })
        : false

      return {
        id: row.id,
        title: row.title,
        originalTitle: row.originalTitle,
        year: row.releaseYear,
        rating: calculateMovieRating(row),
        genres: row.genres,
        runtime: row.runtime,
        originalLanguage: row.originalLanguage,
        countries: normalizeCountries(row.productionCountries),
        director: row.director,
        cast: row.cast.map((member) => ({
          id: member.id,
          name: member.name,
          characterName: member.characterName,
          profileUrl: buildTmdbImageUrl(member.profilePath, "w185"),
        })),
        synopsis: row.overview,
        posterUrl: buildTmdbImageUrl(row.posterPath, "w500"),
        backdropUrl: buildTmdbImageUrl(row.backdropPath, "w780"),
        trailerUrl: row.trailerUrl,
        isBookmarked,
        reviewCount: row.reviewCount,
      }
    },

    async listSimilarMovies(context: RequestContext, movieId: number, input) {
      const sourceMovie = await deps.repository.getMovieDetail(movieId)
      if (!sourceMovie) {
        throw new MovieNotFoundError(movieId)
      }

      const limit = input.limit ?? 4
      const excludedMovieIds = context.user
        ? new Set([movieId, ...(await itemCfRepository.findExcludedMovieIds({ userId: context.user.id }))])
        : new Set([movieId])
      const usedMovieIds = new Set<number>()
      const itemCfRows = await itemCfRepository.listItemCfCandidates({
        sourceMovieId: movieId,
        limit: calculateItemCfCandidateFetchLimit(limit),
      })
      const itemCfMovies = pickSectionMovies({
        candidates: toItemCfCandidates(itemCfRows),
        excludedMovieIds,
        usedMovieIds,
        limit,
      })
      const fallbackMovies =
        itemCfMovies.length < limit
          ? pickSectionMovies({
              candidates: toFallbackCandidates(
                await itemCfRepository.listFallbackCandidates({
                  excludedMovieIds: [...excludedMovieIds],
                  limit: calculateFallbackCandidateFetchLimit(1, limit),
                }),
              ),
              excludedMovieIds,
              usedMovieIds,
              limit: limit - itemCfMovies.length,
            })
          : []

      return {
        movies: [...itemCfMovies, ...fallbackMovies].map((row) => ({
          id: row.id,
          title: row.title,
          year: row.releaseYear,
          rating: calculateMovieRating(row),
          genres: row.genres,
          posterUrl: buildTmdbImageUrl(row.posterPath, "w500"),
          isBookmarked: false,
        })),
      }
    },

    async listGenres() {
      return {
        genres: await deps.repository.listGenres(),
      }
    },
  }
}

export const movieService = createMovieService({
  repository: createMovieRepository(),
  itemCfRepository: createItemCfRecommendationRepository(),
})
