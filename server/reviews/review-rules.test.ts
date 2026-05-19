import { describe, expect, it } from "vitest"
import { normalizeReviewContent, normalizeReviewPagination, validateReviewRating } from "./review-rules"

describe("normalizeReviewPagination", () => {
  it("uses page 1 and size 20 by default", () => {
    expect(normalizeReviewPagination({})).toEqual({ page: 1, size: 20, offset: 0 })
  })

  it("caps size at 50 and calculates offset", () => {
    expect(normalizeReviewPagination({ page: 3, size: 100 })).toEqual({ page: 3, size: 50, offset: 100 })
  })
})

describe("validateReviewRating", () => {
  it("accepts half-point ratings from 0.5 to 5.0", () => {
    expect(validateReviewRating(0.5)).toBe(true)
    expect(validateReviewRating(4.5)).toBe(true)
    expect(validateReviewRating(5)).toBe(true)
  })

  it("rejects out-of-range or non-half-point ratings", () => {
    expect(validateReviewRating(0)).toBe(false)
    expect(validateReviewRating(5.5)).toBe(false)
    expect(validateReviewRating(4.25)).toBe(false)
  })
})

describe("normalizeReviewContent", () => {
  it("trims content before saving", () => {
    expect(normalizeReviewContent("  좋았어요  ")).toBe("좋았어요")
  })
})
