import "server-only"

import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import {
  genres,
  movieBookmarks,
  movieCasts,
  movieCrew,
  movieGenres,
  movies,
  movieStats,
  people,
  reviews,
} from "@/server/db/schema"
import type {
  GenreDto,
  ListMoviesRepoParams,
  MovieDetailRepoResult,
  MovieRepository,
} from "./movie-types"

export function createMovieRepository(): MovieRepository {
  return {
    async listMovies(params: ListMoviesRepoParams) {
      const where = buildListWhere(params)
      const [totalRow] = await getDb().select({ count: count() }).from(movies).innerJoin(movieStats, eq(movieStats.movieId, movies.id)).where(where)

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
        .from(movies)
        .innerJoin(movieStats, eq(movieStats.movieId, movies.id))
        .where(where)
        .orderBy(...buildListOrderBy(params))
        .limit(params.limit)
        .offset(params.offset)

      if (rows.length === 0) {
        return { movies: [], totalCount: totalRow?.count ?? 0 }
      }

      const genresByMovieId = await findGenresByMovieIds(rows.map((row) => row.id))

      return {
        movies: rows.map((row) => ({
          ...row,
          genres: genresByMovieId.get(row.id) ?? [],
        })),
        totalCount: totalRow?.count ?? 0,
      }
    },

    async getMovieDetail(movieId: number): Promise<MovieDetailRepoResult | null> {
      const [row] = await getDb()
        .select({
          id: movies.id,
          title: movies.title,
          originalTitle: movies.originalTitle,
          releaseYear: movies.releaseYear,
          runtime: movies.runtime,
          originalLanguage: movies.originalLanguage,
          productionCountries: movies.productionCountries,
          overview: movies.overview,
          posterPath: movies.posterPath,
          backdropPath: movies.backdropPath,
          trailerUrl: movies.trailerUrl,
          movielensAvgRating: movieStats.movielensAvgRating,
          movielensRatingCount: movieStats.movielensRatingCount,
          cinemateRatingSum: movieStats.cinemateRatingSum,
          cinemateReviewCount: movieStats.cinemateReviewCount,
        })
        .from(movies)
        .innerJoin(movieStats, eq(movieStats.movieId, movies.id))
        .where(eq(movies.id, movieId))
        .limit(1)

      if (!row) {
        return null
      }

      const [genresByMovieId, director, cast, reviewCount] = await Promise.all([
        findGenresByMovieIds([movieId]),
        findDirectorName(movieId),
        findCast(movieId),
        countReviews(movieId),
      ])

      return {
        ...row,
        genres: genresByMovieId.get(movieId) ?? [],
        director,
        cast,
        reviewCount,
      }
    },

    async listGenres(): Promise<GenreDto[]> {
      const rows = await getDb()
        .select({
          id: genres.id,
          name: sql<string>`coalesce(${genres.nameKo}, ${genres.name})`,
        })
        .from(genres)
        .orderBy(sql`coalesce(${genres.nameKo}, ${genres.name}) asc`)

      return rows
    },

    async findBookmarkedMovieIds(params) {
      if (params.movieIds.length === 0) {
        return new Set()
      }

      const rows = await getDb()
        .select({ movieId: movieBookmarks.movieId })
        .from(movieBookmarks)
        .where(and(eq(movieBookmarks.userId, params.userId), inArray(movieBookmarks.movieId, params.movieIds)))

      return new Set(rows.map((row) => row.movieId))
    },

    async isMovieBookmarked(params) {
      const [row] = await getDb()
        .select({ movieId: movieBookmarks.movieId })
        .from(movieBookmarks)
        .where(and(eq(movieBookmarks.userId, params.userId), eq(movieBookmarks.movieId, params.movieId)))
        .limit(1)

      return Boolean(row)
    },
  }
}

function buildListWhere(params: ListMoviesRepoParams) {
  const conditions = []

  if (params.q) {
    conditions.push(or(ilike(movies.title, `%${params.q}%`), ilike(movies.originalTitle, `%${params.q}%`)))
  }

  if (params.sort === "rating" && params.minMovielensRatingCount) {
    conditions.push(sql`${movieStats.movielensRatingCount} >= ${params.minMovielensRatingCount}`)
  }

  return conditions.length > 0 ? and(...conditions) : undefined
}

function buildListOrderBy(params: ListMoviesRepoParams) {
  if (params.sort === "rating") {
    const rating = sql`(
      (${movieStats.movielensAvgRating} * ${movieStats.movielensRatingCount} + ${movieStats.cinemateRatingSum})
      / nullif(${movieStats.movielensRatingCount} + ${movieStats.cinemateReviewCount}, 0)
    )`
    return [desc(rating), desc(movieStats.movielensRatingCount), asc(movies.id)]
  }

  return [desc(movieStats.movielensRatingCount), asc(movies.id)]
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

  const result = new Map<number, GenreDto[]>()
  for (const row of rows) {
    const movieGenres = result.get(row.movieId) ?? []
    movieGenres.push({ id: row.id, name: row.name })
    result.set(row.movieId, movieGenres)
  }

  return result
}

async function findDirectorName(movieId: number) {
  const [row] = await getDb()
    .select({ name: people.name })
    .from(movieCrew)
    .innerJoin(people, eq(people.id, movieCrew.personId))
    .where(and(eq(movieCrew.movieId, movieId), eq(movieCrew.job, "Director")))
    .orderBy(asc(people.name))
    .limit(1)

  return row?.name ?? null
}

async function findCast(movieId: number) {
  return getDb()
    .select({
      id: people.id,
      name: people.name,
      characterName: movieCasts.characterName,
      profilePath: people.profilePath,
    })
    .from(movieCasts)
    .innerJoin(people, eq(people.id, movieCasts.personId))
    .where(eq(movieCasts.movieId, movieId))
    .orderBy(asc(movieCasts.castOrder), asc(people.name))
}

async function countReviews(movieId: number) {
  const [row] = await getDb().select({ count: count() }).from(reviews).where(eq(reviews.movieId, movieId))
  return row?.count ?? 0
}
