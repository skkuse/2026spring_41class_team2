import { describe, expect, it } from "vitest"
import { bookmarkedMoviesQuerySchema, bookmarkMovieParamsSchema } from "./bookmark-schema"

describe("bookmarkMovieParamsSchema", () => {
  it("parses positive integer movie ids", () => {
    expect(bookmarkMovieParamsSchema.parse({ movieId: "550" })).toEqual({ movieId: 550 })
  })

  it("rejects invalid movie ids", () => {
    expect(bookmarkMovieParamsSchema.safeParse({ movieId: "0" }).success).toBe(false)
    expect(bookmarkMovieParamsSchema.safeParse({ movieId: "abc" }).success).toBe(false)
  })
})

describe("bookmarkedMoviesQuerySchema", () => {
  it("applies defaults", () => {
    expect(bookmarkedMoviesQuerySchema.parse({})).toEqual({ page: 1, size: 20 })
  })

  it("rejects sizes over 50", () => {
    expect(bookmarkedMoviesQuerySchema.safeParse({ page: "1", size: "51" }).success).toBe(false)
  })
})
