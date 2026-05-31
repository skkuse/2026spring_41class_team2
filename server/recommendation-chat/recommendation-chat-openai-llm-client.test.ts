import { describe, expect, it, vi } from "vitest"
import { createOpenAiRecommendationChatLlmClient } from "./recommendation-chat-openai-llm-client"

vi.mock("server-only", () => ({}))

describe("openai recommendation chat llm client", () => {
  it("prompts the analyzer to support country-only recommendation requests", async () => {
    const parse = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            parsed: {
              intent: "new_recommendation",
              genreIds: [],
              countryCodes: ["JP"],
              languageCodes: [],
              yearRange: null,
              runtimeRange: null,
              userTagQueries: [],
              excludedTerms: [],
              confidence: 0.9,
            },
          },
        },
      ],
    })
    const client = createOpenAiRecommendationChatLlmClient({
      chat: { completions: { parse } },
    } as never)

    await client.analyzeRequest({
      currentMessage: "제작국가가 일본인 영화 추천해줘",
      availableOptions: {
        genres: [],
        countries: [{ code: "JP" }],
        languages: [],
      },
      recentExchanges: [],
    })

    const request = parse.mock.calls[0]?.[0]
    const systemPrompt = request.messages[0].content
    expect(systemPrompt).toContain("Country-only, language-only, genre-only, year-only, and runtime-only recommendation requests are supported.")
    expect(systemPrompt).toContain('"제작국가가 일본인 영화 추천해줘" is new_recommendation with JP country and empty userTagQueries.')
  })

  it("prompts reason generation to return one reason for every selected movie id", async () => {
    const parse = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            parsed: { reasons: [{ movieId: 1, reason: "조건과 잘 맞아요." }] },
          },
        },
      ],
    })
    const client = createOpenAiRecommendationChatLlmClient({
      chat: { completions: { parse } },
    } as never)

    await client.generateMovieReasons({
      currentMessage: "코미디 추천",
      conditions: {
        intent: "new_recommendation",
        genreIds: [1],
        countryCodes: [],
        languageCodes: [],
        yearRange: null,
        runtimeRange: null,
        userTagQueries: [],
        excludedTerms: [],
        confidence: 0.9,
      },
      selectedMovies: [{ id: 1, title: "movie-1", year: 2020, genres: ["Comedy"], overview: "overview", matchedUserTags: [] }],
    })

    const request = parse.mock.calls[0]?.[0]
    const systemPrompt = request.messages[0].content
    expect(systemPrompt).toContain("Return exactly one reason object for each selectedMovies item.")
    expect(systemPrompt).toContain("Do not omit, duplicate, invent, reorder, or replace movie ids.")
    expect(systemPrompt).toContain("The reasons array length must equal selectedMovies.length.")
  })
})
