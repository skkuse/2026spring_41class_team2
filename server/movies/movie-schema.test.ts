import { describe, expect, it } from "vitest"
import { movieIdParamsSchema, movieListQuerySchema } from "./movie-schema"

describe("movieListQuerySchema", () => {
  it("defaults sort and pagination fields", () => {
    expect(movieListQuerySchema.parse({})).toEqual({
      sort: "popular",
      page: 1,
      size: 20,
    })
  })

  it("trims q and parses page size", () => {
    expect(movieListQuerySchema.parse({ q: "  기생충  ", page: "2", size: "60" })).toEqual({
      q: "기생충",
      sort: "popular",
      page: 2,
      size: 60,
    })
  })

  it("rejects unsupported sort", () => {
    expect(() => movieListQuerySchema.parse({ sort: "latest" })).toThrow()
  })

  it("rejects non-positive pagination fields", () => {
    expect(() => movieListQuerySchema.parse({ page: "0" })).toThrow()
    expect(() => movieListQuerySchema.parse({ size: "0" })).toThrow()
  })

  it("rejects sizes above the maximum", () => {
    expect(() => movieListQuerySchema.parse({ size: "61" })).toThrow()
  })

  it("rejects legacy limit query", () => {
    expect(() => movieListQuerySchema.parse({ limit: "50" })).toThrow()
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
