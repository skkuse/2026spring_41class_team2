import { z } from "zod"
import { movieCardSchema } from "@/server/movies/movie-schema"
import { DEFAULT_BOOKMARK_PAGE, DEFAULT_BOOKMARK_PAGE_SIZE, MAX_BOOKMARK_PAGE_SIZE } from "./bookmark-rules"

export const bookmarkMovieParamsSchema = z.object({
  movieId: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform((value) => Number(value)),
})

export const bookmarkedMoviesQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional().default(DEFAULT_BOOKMARK_PAGE),
    size: z.coerce
      .number()
      .int()
      .positive()
      .max(MAX_BOOKMARK_PAGE_SIZE)
      .optional()
      .default(DEFAULT_BOOKMARK_PAGE_SIZE),
  })
  .transform((value) => ({
    page: value.page,
    size: value.size,
  }))

export const bookmarkMutationResponseSchema = z.object({
  movieId: z.number().int().positive(),
  isBookmarked: z.boolean(),
})

export const bookmarkedMoviesResponseSchema = z.object({
  movies: z.array(movieCardSchema),
  totalCount: z.number().int().nonnegative(),
})
