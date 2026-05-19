import "server-only"

import { and, asc, desc, eq, inArray, notInArray, sql } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import {
  genres,
  movieBookmarks,
  movieGenres,
  movies,
  movieSimilarities,
  movieStats,
  reviews,
  userOnboardingMovies,
} from "@/server/db/schema"
import type {
  ItemCfCandidateRepoResult,
  ItemCfRecommendationRepository,
  RecommendationMovieRepoResult,
  RecommendationSeedMovieRepoResult,
} from "./item-cf-types"

export function createItemCfRecommendationRepository(): ItemCfRecommendationRepository {
  return {
    async listSeedMovies(params) {
      const rows = await getDb()
        .select({
          id: movies.id,
          title: movies.title,
          releaseYear: movies.releaseYear,
          posterPath: movies.posterPath,
          position: userOnboardingMovies.position,
          movielensAvgRating: movieStats.movielensAvgRating,
          movielensRatingCount: movieStats.movielensRatingCount,
          cinemateRatingSum: movieStats.cinemateRatingSum,
          cinemateReviewCount: movieStats.cinemateReviewCount,
          isBookmarked: sql<boolean>`false`,
        })
        .from(userOnboardingMovies)
        .innerJoin(movies, eq(movies.id, userOnboardingMovies.movieId))
        .innerJoin(movieStats, eq(movieStats.movieId, movies.id))
        .where(eq(userOnboardingMovies.userId, params.userId))
        .orderBy(asc(userOnboardingMovies.position))
        .limit(params.limit)

      return attachGenres(rows)
    },

    async findExcludedMovieIds(params) {
      const [onboardingRows, bookmarkRows, reviewRows] = await Promise.all([
        getDb()
          .select({ movieId: userOnboardingMovies.movieId })
          .from(userOnboardingMovies)
          .where(eq(userOnboardingMovies.userId, params.userId)),
        getDb()
          .select({ movieId: movieBookmarks.movieId })
          .from(movieBookmarks)
          .where(eq(movieBookmarks.userId, params.userId)),
        getDb().select({ movieId: reviews.movieId }).from(reviews).where(eq(reviews.userId, params.userId)),
      ])

      return new Set([
        ...onboardingRows.map((row) => row.movieId),
        ...bookmarkRows.map((row) => row.movieId),
        ...reviewRows.map((row) => row.movieId),
      ])
    },

    async listItemCfCandidates(params) {
      const rows = await getDb()
        .select({
          id: movies.id,
          title: movies.title,
          releaseYear: movies.releaseYear,
          posterPath: movies.posterPath,
          movielensAvgRating: movieStats.movielensAvgRating,
          movielensRatingCount: movieStats.movielensRatingCount,
          cinemateRatingSum: movieStats.cinemateRatingSum,
          cinemateReviewCount: movieStats.cinemateReviewCount,
          isBookmarked: sql<boolean>`false`,
          score: movieSimilarities.score,
          coRatingCount: movieSimilarities.coRatingCount,
        })
        .from(movieSimilarities)
        .innerJoin(movies, eq(movies.id, movieSimilarities.targetMovieId))
        .innerJoin(movieStats, eq(movieStats.movieId, movieSimilarities.targetMovieId))
        .where(eq(movieSimilarities.sourceMovieId, params.sourceMovieId))
        .orderBy(desc(movieSimilarities.score), desc(movieSimilarities.coRatingCount), asc(movieSimilarities.targetMovieId))
        .limit(params.limit)

      return attachGenres(rows)
    },

    async listFallbackCandidates(params) {
      const conditions = params.excludedMovieIds.length > 0 ? [notInArray(movies.id, params.excludedMovieIds)] : []
      const rows = await getDb()
        .select({
          id: movies.id,
          title: movies.title,
          releaseYear: movies.releaseYear,
          posterPath: movies.posterPath,
          movielensAvgRating: movieStats.movielensAvgRating,
          movielensRatingCount: movieStats.movielensRatingCount,
          cinemateRatingSum: movieStats.cinemateRatingSum,
          cinemateReviewCount: movieStats.cinemateReviewCount,
          isBookmarked: sql<boolean>`false`,
        })
        .from(movieStats)
        .innerJoin(movies, eq(movies.id, movieStats.movieId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(movieStats.movielensRatingCount), desc(movieStats.movielensAvgRating), asc(movieStats.movieId))
        .limit(params.limit)

      return attachGenres(rows)
    },
  }
}

async function attachGenres<T extends RecommendationMovieRepoResult | ItemCfCandidateRepoResult | RecommendationSeedMovieRepoResult>(
  rows: Omit<T, "genres">[],
): Promise<T[]> {
  if (rows.length === 0) {
    return []
  }

  const genresByMovieId = await findGenresByMovieIds(rows.map((row) => row.id))
  return rows.map((row) => ({
    ...row,
    genres: genresByMovieId.get(row.id) ?? [],
  })) as T[]
}

async function findGenresByMovieIds(movieIds: number[]) {
  const rows = await getDb()
    .select({
      movieId: movieGenres.movieId,
      id: genres.id,
      name: sql<string>`coalesce(${genres.nameKo}, ${genres.name})`,
    })
    .from(movieGenres)
    .innerJoin(genres, eq(genres.id, movieGenres.genreId))
    .where(inArray(movieGenres.movieId, movieIds))
    .orderBy(asc(movieGenres.movieId), asc(genres.name))

  const result = new Map<number, RecommendationMovieRepoResult["genres"]>()
  for (const row of rows) {
    const movieGenres = result.get(row.movieId) ?? []
    movieGenres.push({ id: row.id, name: row.name })
    result.set(row.movieId, movieGenres)
  }

  return result
}
