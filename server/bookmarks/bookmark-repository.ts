import "server-only"

import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import { genres, movieBookmarks, movieGenres, movies, movieStats } from "@/server/db/schema"
import type { BookmarkRepository, BookmarkedMovieRepoResult } from "./bookmark-types"

export function createBookmarkRepository(): BookmarkRepository {
  return {
    async movieExists(movieId: number) {
      const [row] = await getDb().select({ id: movies.id }).from(movies).where(eq(movies.id, movieId)).limit(1)
      return Boolean(row)
    },

    async addBookmark(params) {
      await getDb()
        .insert(movieBookmarks)
        .values({ userId: params.userId, movieId: params.movieId })
        .onConflictDoNothing()
    },

    async removeBookmark(params) {
      await getDb()
        .delete(movieBookmarks)
        .where(and(eq(movieBookmarks.userId, params.userId), eq(movieBookmarks.movieId, params.movieId)))
    },

    async listBookmarkedMovies(params) {
      const [totalRow] = await getDb()
        .select({ count: count() })
        .from(movieBookmarks)
        .where(eq(movieBookmarks.userId, params.userId))

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
        })
        .from(movieBookmarks)
        .innerJoin(movies, eq(movies.id, movieBookmarks.movieId))
        .innerJoin(movieStats, eq(movieStats.movieId, movies.id))
        .where(eq(movieBookmarks.userId, params.userId))
        .orderBy(desc(movieBookmarks.createdAt), asc(movieBookmarks.movieId))
        .limit(params.limit)
        .offset(params.offset)

      const genresByMovieId = rows.length > 0 ? await findGenresByMovieIds(rows.map((row) => row.id)) : new Map()

      return {
        movies: rows.map((row) => ({
          ...row,
          genres: genresByMovieId.get(row.id) ?? [],
        })),
        totalCount: totalRow?.count ?? 0,
      }
    },
  }
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

  const result = new Map<number, BookmarkedMovieRepoResult["genres"]>()
  for (const row of rows) {
    const movieGenres = result.get(row.movieId) ?? []
    movieGenres.push({ id: row.id, name: row.name })
    result.set(row.movieId, movieGenres)
  }

  return result
}
