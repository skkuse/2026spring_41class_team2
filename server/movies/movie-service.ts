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
import type { ListMoviesInput, MovieDetailDto, MovieRepository, MovieService } from "./movie-types"

export type MovieServiceDeps = {
  repository: MovieRepository
}

export function createMovieService(deps: MovieServiceDeps): MovieService {
  return {
    async listMovies(context: RequestContext, input: ListMoviesInput) {
      const normalized = normalizeMovieListInput(input)
      const rows = await deps.repository.listMovies({
        ...normalized,
        ...(normalized.sort === "rating" ? { minMovielensRatingCount: MIN_RATING_SORT_MOVIELENS_COUNT } : {}),
      })
      const movieIds = rows.map((row) => row.id)
      const bookmarkedMovieIds =
        context.user && movieIds.length > 0
          ? await deps.repository.findBookmarkedMovieIds({ userId: context.user.id, movieIds })
          : new Set<number>()

      return {
        movies: rows.map((row) => ({
          id: row.id,
          title: row.title,
          year: row.releaseYear,
          rating: calculateMovieRating(row),
          genres: row.genres,
          posterUrl: buildTmdbImageUrl(row.posterPath, "w500"),
          isBookmarked: bookmarkedMovieIds.has(row.id),
        })),
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

    async listGenres() {
      return {
        genres: await deps.repository.listGenres(),
      }
    },
  }
}

export const movieService = createMovieService({
  repository: createMovieRepository(),
})
