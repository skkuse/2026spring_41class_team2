import "server-only"

import { and, asc, eq, inArray, sql } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import {
  genres,
  movieBookmarks,
  movieGenres,
  movies,
  movieStats,
  profiles,
  userOnboardingMovies,
} from "@/server/db/schema"
import type { OnboardingMovieRepoResult, OnboardingRepository } from "./onboarding-types"

export function createOnboardingRepository(): OnboardingRepository {
  return {
    async listPreferredMovies(userId: string) {
      const rows = await getDb()
        .select({
          id: movies.id,
          title: movies.title,
          releaseYear: movies.releaseYear,
          posterPath: movies.posterPath,
          movielensId: movies.movielensId,
          movielensAvgRating: movieStats.movielensAvgRating,
          movielensRatingCount: movieStats.movielensRatingCount,
          cinemateRatingSum: movieStats.cinemateRatingSum,
          cinemateReviewCount: movieStats.cinemateReviewCount,
          isBookmarked: sql<boolean>`${movieBookmarks.movieId} is not null`,
        })
        .from(userOnboardingMovies)
        .innerJoin(movies, eq(movies.id, userOnboardingMovies.movieId))
        .innerJoin(movieStats, eq(movieStats.movieId, movies.id))
        .leftJoin(
          movieBookmarks,
          and(eq(movieBookmarks.userId, userId), eq(movieBookmarks.movieId, userOnboardingMovies.movieId)),
        )
        .where(eq(userOnboardingMovies.userId, userId))
        .orderBy(asc(userOnboardingMovies.position))

      return attachGenres(rows)
    },

    async findOnboardingCandidateMovies(params) {
      if (params.movieIds.length === 0) {
        return []
      }

      const rows = await getDb()
        .select({
          id: movies.id,
          title: movies.title,
          releaseYear: movies.releaseYear,
          posterPath: movies.posterPath,
          movielensId: movies.movielensId,
          movielensAvgRating: movieStats.movielensAvgRating,
          movielensRatingCount: movieStats.movielensRatingCount,
          cinemateRatingSum: movieStats.cinemateRatingSum,
          cinemateReviewCount: movieStats.cinemateReviewCount,
          isBookmarked: sql<boolean>`false`,
        })
        .from(movies)
        .innerJoin(movieStats, eq(movieStats.movieId, movies.id))
        .where(inArray(movies.id, params.movieIds))

      return attachGenres(rows)
    },

    async replacePreferredMovies(params) {
      await getDb().transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${params.userId}), 0)`)
        await tx.delete(userOnboardingMovies).where(eq(userOnboardingMovies.userId, params.userId))
        await tx.insert(userOnboardingMovies).values(
          params.movies.map((movie) => ({
            userId: params.userId,
            movieId: movie.movieId,
            position: movie.position,
          })),
        )
        await tx
          .update(profiles)
          .set({ onboardingCompleted: true, updatedAt: params.updatedAt })
          .where(eq(profiles.id, params.userId))
      })
    },
  }
}

async function attachGenres(
  rows: Omit<OnboardingMovieRepoResult, "genres">[],
): Promise<OnboardingMovieRepoResult[]> {
  if (rows.length === 0) {
    return []
  }

  const genresByMovieId = await findGenresByMovieIds(rows.map((row) => row.id))
  return rows.map((row) => ({
    ...row,
    genres: genresByMovieId.get(row.id) ?? [],
  }))
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

  const result = new Map<number, OnboardingMovieRepoResult["genres"]>()
  for (const row of rows) {
    const movieGenres = result.get(row.movieId) ?? []
    movieGenres.push({ id: row.id, name: row.name })
    result.set(row.movieId, movieGenres)
  }

  return result
}
