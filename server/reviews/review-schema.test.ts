import { describe, expect, it } from "vitest"
import {
  createReviewBodySchema,
  movieReviewsQuerySchema,
  myReviewsQuerySchema,
  reviewIdParamsSchema,
} from "./review-schema"

describe("movieReviewsQuerySchema", () => {
  it("defaults pagination and sort", () => {
    expect(movieReviewsQuerySchema.parse({})).toEqual({ page: 1, size: 20, sort: "latest" })
  })

  it("rejects unsupported sort values", () => {
    expect(movieReviewsQuerySchema.safeParse({ sort: "oldest" }).success).toBe(false)
  })
})

describe("myReviewsQuerySchema", () => {
  it("uses bookmark-style pagination", () => {
    expect(myReviewsQuerySchema.parse({ page: "2", size: "10" })).toEqual({ page: 2, size: 10 })
  })
})

describe("createReviewBodySchema", () => {
  it("trims content and accepts half-point rating", () => {
    expect(createReviewBodySchema.parse({ rating: 4.5, content: "  좋았어요  " })).toEqual({
      rating: 4.5,
      content: "좋았어요",
    })
  })

  it("rejects blank content", () => {
    expect(createReviewBodySchema.safeParse({ rating: 4.5, content: "   " }).success).toBe(false)
  })
})

describe("reviewIdParamsSchema", () => {
  it("accepts UUID review ids", () => {
    expect(reviewIdParamsSchema.parse({ reviewId: "123e4567-e89b-12d3-a456-426614174000" })).toEqual({
      reviewId: "123e4567-e89b-12d3-a456-426614174000",
    })
  })
})
