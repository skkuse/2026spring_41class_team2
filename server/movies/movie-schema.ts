import { z } from "zod"
import { DEFAULT_MOVIE_PAGE, DEFAULT_MOVIE_PAGE_SIZE, MAX_MOVIE_PAGE_SIZE } from "./movie-rules"

export const DEFAULT_SIMILAR_MOVIES_LIMIT = 4
export const MIN_SIMILAR_MOVIES_LIMIT = 1
export const MAX_SIMILAR_MOVIES_LIMIT = 20

export const genreSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
})

export const movieListQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((value) => (value ? value : undefined)),
    sort: z.enum(["popular", "rating"]).default("popular"),
    page: z.coerce.number().int().positive().optional().default(DEFAULT_MOVIE_PAGE),
    size: z.coerce
      .number()
      .int()
      .positive()
      .max(MAX_MOVIE_PAGE_SIZE)
      .optional()
      .default(DEFAULT_MOVIE_PAGE_SIZE),
    genreId: z.coerce.number().int().positive().optional(),
  })
  .strict()
  .transform((value) => ({
    ...(value.q ? { q: value.q } : {}),
    sort: value.sort,
    page: value.page,
    size: value.size,
    ...(value.genreId ? { genreId: value.genreId } : {}),
  }))

export const movieIdParamsSchema = z.object({
  movieId: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform((value) => Number(value)),
})

export const movieCardSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  year: z.number().int().nullable(),
  rating: z.number(),
  genres: z.array(genreSchema),
  posterUrl: z.string().url().nullable(),
  isBookmarked: z.boolean(),
})

export const movieListResponseSchema = z.object({
  movies: z.array(movieCardSchema),
  page: z.number().int().positive(),
  size: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
})

export const similarMoviesQuerySchema = z
  .object({
    limit: z.coerce
      .number()
      .int()
      .min(MIN_SIMILAR_MOVIES_LIMIT)
      .max(MAX_SIMILAR_MOVIES_LIMIT)
      .optional()
      .default(DEFAULT_SIMILAR_MOVIES_LIMIT),
  })
  .strict()

export const similarMoviesResponseSchema = z.object({
  movies: z.array(movieCardSchema),
})

export const movieCastMemberSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  characterName: z.string().nullable(),
  profileUrl: z.string().url().nullable(),
})

export const movieDetailSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  originalTitle: z.string().nullable(),
  year: z.number().int().nullable(),
  rating: z.number(),
  genres: z.array(genreSchema),
  runtime: z.number().int().nullable(),
  originalLanguage: z.string().nullable(),
  countries: z.array(z.string()),
  director: z.string().nullable(),
  cast: z.array(movieCastMemberSchema),
  synopsis: z.string().nullable(),
  posterUrl: z.string().url().nullable(),
  backdropUrl: z.string().url().nullable(),
  trailerUrl: z.string().url().nullable(),
  isBookmarked: z.boolean(),
  reviewCount: z.number().int().nonnegative(),
})

export const movieDetailResponseSchema = z.object({
  movie: movieDetailSchema,
})

export const genreListResponseSchema = z.object({
  genres: z.array(genreSchema),
})
