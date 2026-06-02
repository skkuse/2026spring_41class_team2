import { describe, expect, it } from "vitest"
import {
  createReviewBodySchema,
  movieReviewsQuerySchema,
  myReviewsQuerySchema,
  reviewIdParamsSchema,
  updateReviewBodySchema,
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

describe("updateReviewBodySchema", () => {
  it("trims content and accepts half-point rating", () => {
    expect(updateReviewBodySchema.parse({ rating: 3.5, content: "  수정된 내용  " })).toEqual({
      rating: 3.5,
      content: "수정된 내용",
    })
  })

  it("rejects rating below 0.5", () => {
    expect(updateReviewBodySchema.safeParse({ rating: 0, content: "내용" }).success).toBe(false)
  })

  it("rejects rating above 5", () => {
    expect(updateReviewBodySchema.safeParse({ rating: 5.5, content: "내용" }).success).toBe(false)
  })

  it("rejects non-half-point rating", () => {
    expect(updateReviewBodySchema.safeParse({ rating: 3.3, content: "내용" }).success).toBe(false)
  })

  it("rejects blank content", () => {
    expect(updateReviewBodySchema.safeParse({ rating: 4.0, content: "   " }).success).toBe(false)
  })
})

describe("reviewIdParamsSchema", () => {
  it("accepts UUID review ids", () => {
    expect(reviewIdParamsSchema.parse({ reviewId: "123e4567-e89b-12d3-a456-426614174000" })).toEqual({
      reviewId: "123e4567-e89b-12d3-a456-426614174000",
    })
  })
})
