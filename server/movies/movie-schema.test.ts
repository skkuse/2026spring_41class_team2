import { describe, expect, it } from "vitest"
import { movieIdParamsSchema, movieListQuerySchema } from "./movie-schema"

describe("movieListQuerySchema", () => {
  it("defaults sort and limit without pagination fields", () => {
    expect(movieListQuerySchema.parse({})).toEqual({
      sort: "popular",
      limit: 50,
    })
  })

  it("trims q and caps limit at 50", () => {
    expect(movieListQuerySchema.parse({ q: "  기생충  ", limit: "99" })).toEqual({
      q: "기생충",
      sort: "popular",
      limit: 50,
    })
  })

  it("rejects unsupported sort", () => {
    expect(() => movieListQuerySchema.parse({ sort: "latest" })).toThrow()
  })

  it("rejects non-positive limits", () => {
    expect(() => movieListQuerySchema.parse({ limit: "0" })).toThrow()
  })
})

describe("movieIdParamsSchema", () => {
  it("accepts positive integer movie ids", () => {
    expect(movieIdParamsSchema.parse({ movieId: "550" })).toEqual({ movieId: 550 })
  })

  it("rejects non-numeric movie ids", () => {
    expect(() => movieIdParamsSchema.parse({ movieId: "abc" })).toThrow()
  })
})
