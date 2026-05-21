import "server-only"

import OpenAI from "openai"
import { RecommendationChatEmbeddingApiError } from "./recommendation-chat-errors"
import type { RecommendationChatEmbeddingClient } from "./recommendation-chat-types"

export function createOpenAiRecommendationChatEmbeddingClient(
  client = new OpenAI(),
): RecommendationChatEmbeddingClient {
  return {
    async embedUserTagQueries(input) {
      try {
        const response = await client.embeddings.create({
          model: input.embeddingModel,
          input: input.embeddingInputs,
        })

        return response.data.map((item) => item.embedding)
      } catch (error) {
        throw new RecommendationChatEmbeddingApiError(error)
      }
    },
  }
}
