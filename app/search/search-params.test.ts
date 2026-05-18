import { describe, expect, it } from "vitest"
import { normalizeSearchPageParams } from "./search-params"

describe("normalizeSearchPageParams", () => {
  it("trims search query and keeps supported sort", () => {
    expect(normalizeSearchPageParams({ q: " matrix ", sort: "rating" })).toEqual({
      q: "matrix",
      sort: "rating",
    })
  })

  it("falls back to popular sort for empty or unsupported params", () => {
    expect(normalizeSearchPageParams({ q: "   ", sort: "newest" })).toEqual({
      q: "",
      sort: "popular",
    })
  })

  it("uses the first value for repeated query params", () => {
    expect(normalizeSearchPageParams({ q: ["alien", "matrix"], sort: ["rating", "popular"] })).toEqual({
      q: "alien",
      sort: "rating",
    })
  })
})
