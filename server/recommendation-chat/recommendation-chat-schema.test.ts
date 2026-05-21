import { describe, expect, it } from "vitest"
import {
  recommendationChatAnalysisSchema,
  recommendationChatReasonResponseSchema,
  submitRecommendationChatMessageRequestSchema,
  submitRecommendationChatMessageResponseSchema,
} from "./recommendation-chat-schema"

describe("recommendation chat schema", () => {
  it("validates trimmed submit message request body", () => {
    expect(submitRecommendationChatMessageRequestSchema.parse({ message: "  코미디 추천  " })).toEqual({
      message: "코미디 추천",
    })
    expect(() => submitRecommendationChatMessageRequestSchema.parse({ message: "   " })).toThrow()
  })

  it("validates LLM analysis JSON", () => {
    expect(
      recommendationChatAnalysisSchema.parse({
        intent: "unsupported",
        genreIds: [],
        countryCodes: [],
        languageCodes: [],
        yearRange: null,
        runtimeRange: null,
        userTagQueries: [
          {
            userTag: "잔잔한",
            embeddingTerms: ["잔잔한", "차분한", "고요한", "느린 호흡", "감성적인", "일상 정서", "여운"],
          },
        ],
        excludedTerms: [],
        confidence: 0.8,
      }),
    ).toMatchObject({ intent: "unsupported", userTagQueries: [{ userTag: "잔잔한" }] })
  })

  it("rejects invalid user tag query embedding terms", () => {
    const analysis = {
      intent: "new_recommendation",
      genreIds: [],
      countryCodes: [],
      languageCodes: [],
      yearRange: null,
      runtimeRange: null,
      excludedTerms: [],
      confidence: 0.8,
    }

    expect(() =>
      recommendationChatAnalysisSchema.parse({
        ...analysis,
        userTagQueries: [{ userTag: "좀비", embeddingTerms: ["언데드", "좀비물", "감염", "공포", "생존", "습격", "폐허"] }],
      }),
    ).toThrow()

    expect(() =>
      recommendationChatAnalysisSchema.parse({
        ...analysis,
        userTagQueries: [{ userTag: "좀비", embeddingTerms: ["좀비", "언데드"] }],
      }),
    ).toThrow()

  })

  it("rejects invalid range and confidence values", () => {
    expect(() =>
      recommendationChatAnalysisSchema.parse({
        intent: "new_recommendation",
        genreIds: [],
        countryCodes: [],
        languageCodes: [],
        yearRange: { from: 2020, to: 2010 },
        runtimeRange: null,
        userTagQueries: [],
        excludedTerms: [],
        confidence: 1.2,
      }),
    ).toThrow()
  })

  it("rejects unsupported analysis fields", () => {
    expect(() =>
      recommendationChatAnalysisSchema.parse({
        intent: "new_recommendation",
        genreIds: [],
        countryCodes: [],
        languageCodes: [],
        yearRange: null,
        runtimeRange: null,
        ratingPreference: "high",
        userTagQueries: [],
        excludedTerms: [],
        confidence: 0.8,
      }),
    ).toThrow()
  })

  it("requires reason text for reason generation output", () => {
    expect(recommendationChatReasonResponseSchema.parse({ reasons: [{ movieId: 1, reason: "조건과 잘 맞아요." }] })).toEqual({
      reasons: [{ movieId: 1, reason: "조건과 잘 맞아요." }],
    })
    expect(() => recommendationChatReasonResponseSchema.parse({ reasons: [{ movieId: 1, reason: "" }] })).toThrow()
  })

  it("validates submit response DTO", () => {
    expect(
      submitRecommendationChatMessageResponseSchema.parse({
        conversationId: "00000000-0000-4000-8000-000000000001",
        answer: "ok",
        movies: [
          {
            id: 1,
            title: "영화",
            year: 2020,
            rating: 4.5,
            genres: [{ id: 1, name: "드라마" }],
            posterUrl: null,
            reason: "좋아요.",
          },
        ],
      }),
    ).toMatchObject({ movies: [{ reason: "좋아요." }] })
  })
})
