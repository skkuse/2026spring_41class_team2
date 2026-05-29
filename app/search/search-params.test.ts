import { describe, expect, it } from "vitest"
import { normalizeSearchPageParams } from "./search-params"

describe("normalizeSearchPageParams", () => {
  it("trims search query and keeps supported sort", () => {
    expect(normalizeSearchPageParams({ q: " matrix ", sort: "rating" })).toEqual({
      q: "matrix",
      sort: "rating",
      genreId: undefined,
    })
  })

  it("falls back to popular sort for empty or unsupported params", () => {
    expect(normalizeSearchPageParams({ q: "   ", sort: "newest" })).toEqual({
      q: "",
      sort: "popular",
      genreId: undefined,
    })
  })

  it("uses the first value for repeated query params", () => {
    expect(normalizeSearchPageParams({ q: ["alien", "matrix"], sort: ["rating", "popular"] })).toEqual({
      q: "alien",
      sort: "rating",
      genreId: undefined,
    })
  })

  it("parses a valid genreId as a positive integer", () => {
    expect(normalizeSearchPageParams({ genreId: "28" })).toMatchObject({ genreId: 28 })
  })

  it("returns undefined genreId for zero", () => {
    expect(normalizeSearchPageParams({ genreId: "0" })).toMatchObject({ genreId: undefined })
  })

  it("returns undefined genreId for negative value", () => {
    expect(normalizeSearchPageParams({ genreId: "-5" })).toMatchObject({ genreId: undefined })
  })

  it("returns undefined genreId for non-numeric string", () => {
    expect(normalizeSearchPageParams({ genreId: "abc" })).toMatchObject({ genreId: undefined })
  })

  it("uses the first value for repeated genreId params", () => {
    expect(normalizeSearchPageParams({ genreId: ["28", "18"] })).toMatchObject({ genreId: 28 })
  })
})
