import { describe, expect, it } from "vitest"
import { itemCfRecommendationsQuerySchema, itemCfRecommendationsResponseSchema } from "./item-cf-schema"

describe("itemCfRecommendationsQuerySchema", () => {
  it("applies defaults and validates bounds", () => {
    expect(itemCfRecommendationsQuerySchema.parse({})).toEqual({ seedLimit: 3, limitPerSeed: 10 })
    expect(itemCfRecommendationsQuerySchema.safeParse({ seedLimit: "6" }).success).toBe(false)
    expect(itemCfRecommendationsQuerySchema.safeParse({ limitPerSeed: "21" }).success).toBe(false)
  })
})

describe("itemCfRecommendationsResponseSchema", () => {
  it("allows nullable posterUrl for seed and recommended movies", () => {
    expect(
      itemCfRecommendationsResponseSchema.parse({
        sections: [
          {
            seedMovie: { id: 1, title: "Seed", year: null, posterUrl: null },
            title: "Seed 기반 추천",
            movies: [
              {
                id: 2,
                title: "Candidate",
                year: null,
                rating: 0,
                genres: [],
                posterUrl: null,
                reason: "reason",
                source: "fallback",
                score: null,
                coRatingCount: null,
                isBookmarked: false,
              },
            ],
          },
        ],
      }),
    ).toMatchObject({ sections: [{ seedMovie: { posterUrl: null }, movies: [{ posterUrl: null }] }] })
  })
})
