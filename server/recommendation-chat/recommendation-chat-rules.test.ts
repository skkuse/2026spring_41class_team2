import { describe, expect, it } from "vitest"
import {
  buildCandidateQueryFailedRecommendationChatAnswer,
  buildRecommendationChatAnswer,
  buildTagMappingFailedRecommendationChatAnswer,
  buildUnsupportedRecommendationChatAnswer,
  calculateFinalTagScore,
  calculateUserTagScore,
  selectMappedTags,
  selectRecommendationMovies,
} from "./recommendation-chat-rules"
import type { RecommendationChatCandidate } from "./recommendation-chat-types"

describe("recommendation chat rules", () => {
  it("calculates user tag score and treats missing movie tag relevance as zero", () => {
    expect(
      calculateUserTagScore({
        mappedTags: [
          { tagId: 1, relevance: 0.8 },
          { tagId: 2, relevance: 0.2 },
        ],
        movieTagRelevances: new Map([[1, 0.5]]),
      }),
    ).toBeCloseTo(0.4)
  })

  it("calculates final tag score from average and minimum scores", () => {
    expect(calculateFinalTagScore([0.8, 0.2])).toBeCloseTo(0.41)
  })

  it("keeps only user tags whose top mapping passes the similarity threshold", () => {
    const mapped = selectMappedTags({
      userTags: ["잔잔한", "무서운", "따뜻한", "웃긴"],
      mappingResults: [
        [
          { tagId: 1, tag: "quiet", relevance: 0.6 },
          { tagId: 2, tag: "calm", relevance: 0.5 },
          { tagId: 3, tag: "slow", relevance: 0.49 },
          { tagId: 4, tag: "extra", relevance: 0.48 },
        ],
        [{ tagId: 5, tag: "scary", relevance: 0.44 }],
        [{ tagId: 6, tag: "warm", relevance: 0.45 }],
        [{ tagId: 7, tag: "funny", relevance: 0.9 }],
      ],
    })

    expect(mapped).toEqual([
      { userTag: "잔잔한", tagId: 1, tag: "quiet", relevance: 0.6 },
      { userTag: "잔잔한", tagId: 2, tag: "calm", relevance: 0.5 },
      { userTag: "잔잔한", tagId: 3, tag: "slow", relevance: 0.49 },
      { userTag: "따뜻한", tagId: 6, tag: "warm", relevance: 0.45 },
    ])
  })

  it("sorts tagless candidates by rating, rating count, and movie id", () => {
    const selected = selectRecommendationMovies({
      candidates: [
        candidate({ id: 3, avg: 4.5, count: 100 }),
        candidate({ id: 1, avg: 4.7, count: 50 }),
        candidate({ id: 2, avg: 4.5, count: 200 }),
      ],
    })

    expect(selected.map((movie) => movie.id)).toEqual([1, 2, 3])
  })

  it("sorts tagged candidates by final tag score and movie id", () => {
    const selected = selectRecommendationMovies({
      candidates: [
        candidate({ id: 2, tags: [[10, 0.6]] }),
        candidate({ id: 1, tags: [[10, 0.6]] }),
        candidate({ id: 3, tags: [[10, 0.9]] }),
      ],
      mappedTagsByUserTag: new Map([["잔잔한", [{ userTag: "잔잔한", tagId: 10, tag: "quiet", relevance: 1 }]]]),
    })

    expect(selected.map((movie) => movie.id)).toEqual([3, 1, 2])
  })

  it("builds fixed answer strings", () => {
    expect(buildUnsupportedRecommendationChatAnswer()).toContain("지원하지 않는 요청입니다")
    expect(buildUnsupportedRecommendationChatAnswer()).toContain("영화 추천 조건")
    expect(buildTagMappingFailedRecommendationChatAnswer()).toContain("내부 추천 데이터 오류")
    expect(buildCandidateQueryFailedRecommendationChatAnswer()).toContain("내부 후보 조회 오류")
    expect(buildRecommendationChatAnswer()).toBe("요청하신 조건에 맞는 영화를 골라봤어요.")
  })
})

function candidate(input: { id: number; avg?: number; count?: number; tags?: Array<[number, number]> }): RecommendationChatCandidate {
  return {
    id: input.id,
    title: `movie-${input.id}`,
    releaseYear: 2020,
    overview: null,
    posterPath: null,
    movielensAvgRating: input.avg ?? 0,
    movielensRatingCount: input.count ?? 0,
    cinemateRatingSum: 0,
    cinemateReviewCount: 0,
    genres: [],
    tagRelevances: new Map(input.tags ?? []),
  }
}
