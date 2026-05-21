import "server-only"

import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { RecommendationChatLlmApiError } from "./recommendation-chat-errors"
import { recommendationChatAnalysisSchema, recommendationChatReasonResponseSchema } from "./recommendation-chat-schema"
import type { RecommendationChatLlmClient } from "./recommendation-chat-types"

export const RECOMMENDATION_CHAT_MODEL = process.env.OPENAI_RECOMMENDATION_CHAT_MODEL ?? "gpt-4.1-mini"

export function createOpenAiRecommendationChatLlmClient(client = new OpenAI()): RecommendationChatLlmClient {
  return {
    async analyzeRequest(input) {
      try {
        const completion = await client.chat.completions.parse({
          model: RECOMMENDATION_CHAT_MODEL,
          temperature: 0.1,
          messages: [
            {
              role: "system",
              content:
                [
                  "You analyze Korean movie recommendation chat requests. Return only valid JSON matching the schema.",
                  "Mark non-recommendation, plot/info questions, director/actor/similar-movie requests as unsupported.",
                  "Use only available genre, country, and language values.",
                  "Return userTagQueries only for movie content attributes: mood, emotion, material, genre tone, narrative situation.",
                  "Treat concrete movie subjects or creatures such as 좀비, 귀신, 괴물, 외계인, 살인마, 로봇 as content attributes. Keep them in userTagQueries, not excludedTerms.",
                  "Do not put viewing situation, time of day, platform, user state, vague quality requests, request wording, or preference/exclusion wording into userTagQueries.",
                  "Viewing context terms such as 친구랑, 혼자, 밤에, 저녁에, 주말에, 밥 먹으면서, 출근길, 데이트할 때 describe when or with whom the user watches. Put them in excludedTerms, not userTagQueries.",
                  "For each userTagQuery, create exactly 7 embeddingTerms. The first term must exactly equal userTag.",
                  "The remaining terms must be short Korean content-attribute expressions, not prose. Avoid broad expansion beyond the userTag meaning.",
                  "Put removed request/situation/platform/vague terms into excludedTerms.",
                  "Do not put recognized supported metadata or content attributes into excludedTerms.",
                  "Do not treat rating, popularity, famousness, or hidden-gem requests as supported recommendation conditions.",
                  "If no supported genre, country, language, year, runtime, or content-attribute userTag remains after exclusions, set intent to unsupported and userTagQueries to an empty array.",
                  'Example: "잔잔한 일본 로맨스 영화 추천해줘" is new_recommendation with Romance genre, JP country, and a 잔잔한 userTagQuery.',
                  'Example: "좀비가 나오는 긴장감 있는 공포 영화 보고 싶어" is new_recommendation with Horror genre and userTagQueries for 좀비 and 긴장감 있는.',
                  'Example: "혼자 밤에 볼 무서운 공포 영화 추천해줘" is new_recommendation with Horror genre and a 무서운 userTagQuery. Put 혼자 and 밤에 in excludedTerms.',
                  'Example: "친구랑 볼만한 거 추천해줘" is unsupported with empty userTagQueries.',
                  'Example: "평점 높은 영화 추천해줘" is unsupported with empty userTagQueries.',
                  'Example: "아무거나 추천해줘" is unsupported with empty userTagQueries.',
                ].join(" "),
            },
            {
              role: "user",
              content: JSON.stringify(input),
            },
          ],
          response_format: zodResponseFormat(recommendationChatAnalysisSchema, "recommendation_chat_analysis"),
        })

        const parsed = completion.choices[0]?.message.parsed
        if (!parsed) {
          throw new RecommendationChatLlmApiError()
        }
        return parsed
      } catch (error) {
        throw error instanceof RecommendationChatLlmApiError ? error : new RecommendationChatLlmApiError(error)
      }
    },

    async generateMovieReasons(input) {
      try {
        const completion = await client.chat.completions.parse({
          model: RECOMMENDATION_CHAT_MODEL,
          temperature: 0.4,
          messages: [
            {
              role: "system",
              content:
                "Write concise Korean recommendation reasons for every selected movie. Return only valid JSON matching the schema. Use exactly the provided movie ids.",
            },
            {
              role: "user",
              content: JSON.stringify(input),
            },
          ],
          response_format: zodResponseFormat(recommendationChatReasonResponseSchema, "recommendation_chat_reasons"),
        })

        const parsed = completion.choices[0]?.message.parsed
        if (!parsed) {
          throw new RecommendationChatLlmApiError()
        }
        return parsed
      } catch (error) {
        throw error instanceof RecommendationChatLlmApiError ? error : new RecommendationChatLlmApiError(error)
      }
    },
  }
}
