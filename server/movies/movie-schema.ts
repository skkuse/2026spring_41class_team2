import { z } from "zod"

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
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .default(50)
      .transform((value) => Math.min(value, 50)),
  })
  .transform((value) => ({
    ...(value.q ? { q: value.q } : {}),
    sort: value.sort,
    limit: value.limit,
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
