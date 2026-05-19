import { describe, expect, it } from "vitest"
import { buildTmdbImageUrl, calculateMovieRating, normalizeMovieListInput } from "./movie-rules"

describe("calculateMovieRating", () => {
  it("combines MovieLens and Cinemate ratings", () => {
    expect(
      calculateMovieRating({
        movielensAvgRating: "4.00",
        movielensRatingCount: 10,
        cinemateRatingSum: "9.00",
        cinemateReviewCount: 2,
      }),
    ).toBe(4.08)
  })

  it("returns 0 when there are no ratings", () => {
    expect(
      calculateMovieRating({
        movielensAvgRating: "0",
        movielensRatingCount: 0,
        cinemateRatingSum: "0",
        cinemateReviewCount: 0,
      }),
    ).toBe(0)
  })
})

describe("buildTmdbImageUrl", () => {
  it("builds a sized TMDB image URL", () => {
    expect(buildTmdbImageUrl("/poster.jpg", "w500")).toBe("https://image.tmdb.org/t/p/w500/poster.jpg")
  })

  it("keeps nullable image fields nullable", () => {
    expect(buildTmdbImageUrl(null, "w500")).toBeNull()
  })
})

describe("normalizeMovieListInput", () => {
  it("trims blank search terms and clamps size", () => {
    expect(normalizeMovieListInput({ q: "   ", sort: "popular", page: 2, size: 200 })).toEqual({
      sort: "popular",
      page: 2,
      size: 60,
      offset: 60,
    })
  })

  it("keeps a non-empty query and default pagination", () => {
    expect(normalizeMovieListInput({ q: " matrix ", sort: "rating" })).toEqual({
      q: "matrix",
      sort: "rating",
      page: 1,
      size: 20,
      offset: 0,
    })
  })
})
