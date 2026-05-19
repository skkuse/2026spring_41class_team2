import { describe, expect, it } from "vitest"
import {
  buildRecommendationReason,
  buildSectionTitle,
  calculateItemCfCandidateFetchLimit,
  MAX_SIMILAR_MOVIES_PER_SOURCE,
  pickSectionMovies,
} from "./item-cf-rules"

describe("item-cf rules", () => {
  it("caps Item CF candidate fetches at the seed max constant", () => {
    expect(calculateItemCfCandidateFetchLimit(20)).toBe(MAX_SIMILAR_MOVIES_PER_SOURCE)
  })

  it("filters excluded and already used movies while preserving candidate order", () => {
    const usedMovieIds = new Set([4])
    const movies = pickSectionMovies({
      candidates: [
        createCandidate(1),
        createCandidate(2),
        createCandidate(3),
        createCandidate(4),
        createCandidate(5),
      ],
      excludedMovieIds: new Set([1, 3]),
      usedMovieIds,
      limit: 2,
    })

    expect(movies.map((movie) => movie.id)).toEqual([2, 5])
    expect([...usedMovieIds].sort((a, b) => a - b)).toEqual([2, 4, 5])
  })

  it("uses 을/를 in server-generated recommendation copy", () => {
    expect(buildSectionTitle(createSeedMovie("매트릭스"))).toBe("매트릭스를 좋아한 사람들이 함께 좋아한 영화")
    expect(buildSectionTitle(createSeedMovie("기생충"))).toBe("기생충을 좋아한 사람들이 함께 좋아한 영화")
    expect(buildRecommendationReason(createSeedMovie("매트릭스"), "item_cf")).toBe(
      "매트릭스를 좋아한 사용자들이 함께 높게 평가한 영화",
    )
  })
})

function createCandidate(id: number) {
  return {
    id,
    title: `Movie ${id}`,
    releaseYear: 2000,
    posterPath: null,
    movielensAvgRating: "4.00",
    movielensRatingCount: 100,
    cinemateRatingSum: "0",
    cinemateReviewCount: 0,
    genres: [],
    isBookmarked: false,
    source: "item_cf" as const,
    score: 0.9,
    coRatingCount: 20,
  }
}

function createSeedMovie(title: string) {
  return {
    ...createCandidate(1),
    title,
    position: 1,
  }
}
