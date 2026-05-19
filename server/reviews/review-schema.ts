import { z } from "zod"
import { DEFAULT_REVIEW_PAGE, DEFAULT_REVIEW_PAGE_SIZE, MAX_REVIEW_PAGE_SIZE } from "./review-rules"

export const movieReviewsParamsSchema = z.object({
  movieId: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform((value) => Number(value)),
})

export const reviewIdParamsSchema = z.object({
  reviewId: z.string().uuid(),
})

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(DEFAULT_REVIEW_PAGE),
  size: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_REVIEW_PAGE_SIZE)
    .optional()
    .default(DEFAULT_REVIEW_PAGE_SIZE),
})

export const movieReviewsQuerySchema = paginationQuerySchema
  .extend({
    sort: z.enum(["latest", "likes"]).optional().default("latest"),
  })
  .transform((value) => ({
    page: value.page,
    size: value.size,
    sort: value.sort,
  }))

export const myReviewsQuerySchema = paginationQuerySchema.transform((value) => ({
  page: value.page,
  size: value.size,
}))

export const createReviewBodySchema = z.object({
  rating: z.number().min(0.5).max(5).refine((value) => Number.isInteger(value * 2), {
    message: "평점은 0.5 단위여야 합니다.",
  }),
  content: z.string().trim().min(1).max(2000),
})

export const userSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  profileImageUrl: z.string().url().nullable(),
})

export const reviewSchema = z.object({
  id: z.string().uuid(),
  user: userSummarySchema,
  rating: z.number(),
  content: z.string(),
  date: z.string(),
  likes: z.number().int().nonnegative(),
  isLiked: z.boolean(),
})

export const movieReviewsResponseSchema = z.object({
  reviews: z.array(reviewSchema),
  totalCount: z.number().int().nonnegative(),
})

export const createReviewResponseSchema = z.object({
  reviewId: z.string().uuid(),
  rating: z.number(),
  content: z.string(),
  date: z.string(),
})

export const reviewLikeResponseSchema = z.object({
  reviewId: z.string().uuid(),
  likes: z.number().int().nonnegative(),
  isLiked: z.boolean(),
})

export const myReviewSchema = z.object({
  id: z.string().uuid(),
  movieId: z.number().int().positive(),
  movieTitle: z.string(),
  posterUrl: z.string().url().nullable(),
  rating: z.number(),
  content: z.string(),
  date: z.string(),
  likes: z.number().int().nonnegative(),
})

export const myReviewsResponseSchema = z.object({
  reviews: z.array(myReviewSchema),
  totalCount: z.number().int().nonnegative(),
})
