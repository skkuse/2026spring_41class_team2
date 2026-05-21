import { NextResponse } from "next/server"
import { createOptionalRequestContext, createRequestId } from "@/server/auth/request-context"
import {
  apiErrorCodes,
  createApiFailureResponse,
  createInvalidBodyResponse,
  createUnauthorizedResponse,
} from "@/server/error"
import { logger } from "@/server/logger"
import {
  RecommendationChatEmbeddingApiError,
  RecommendationChatLlmApiError,
  recommendationChatService,
  RecommendationChatVectorSearchError,
  UnauthorizedRecommendationChatError,
} from "@/server/recommendation-chat"
import {
  submitRecommendationChatMessageRequestSchema,
  submitRecommendationChatMessageResponseSchema,
} from "@/server/recommendation-chat/recommendation-chat-schema"

const route = "POST /api/recommendation-chat/messages"

export async function POST(request: Request) {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route })
    const body = await request.json().catch(() => null)
    const parseResult = submitRecommendationChatMessageRequestSchema.safeParse(body)
    if (!parseResult.success) {
      logger.warn("request.validation_failed", { requestId, route, error: parseResult.error.flatten() })
      return createInvalidBodyResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await recommendationChatService.submitRecommendationChatMessage(context, parseResult.data)
    logger.info("recommendation_chat.message_submitted", {
      requestId,
      route,
      userId: context.user?.id,
      conversationId: response.conversationId,
      movieCount: response.movies.length,
    })

    return NextResponse.json(submitRecommendationChatMessageResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedRecommendationChatError) {
      logger.warn("recommendation_chat.unauthorized", { requestId, route, error })
      return createUnauthorizedResponse({ requestId })
    }

    if (error instanceof RecommendationChatLlmApiError) {
      logger.error("recommendation_chat.llm_failed", { requestId, route, error })
      return createApiFailureResponse({
        requestId,
        code: apiErrorCodes.recommendationChatLlmApiFailed,
        message: "추천 요청을 분석하지 못했습니다.",
      })
    }

    if (error instanceof RecommendationChatEmbeddingApiError) {
      logger.error("recommendation_chat.embedding_failed", { requestId, route, error })
      return createApiFailureResponse({
        requestId,
        code: apiErrorCodes.recommendationChatEmbeddingApiFailed,
        message: "추천 태그를 처리하지 못했습니다.",
      })
    }

    if (error instanceof RecommendationChatVectorSearchError) {
      logger.error("recommendation_chat.vector_search_failed", { requestId, route, error })
      return createApiFailureResponse({
        requestId,
        code: apiErrorCodes.recommendationChatVectorSearchFailed,
        message: "추천 후보를 조회하지 못했습니다.",
      })
    }

    logger.error("recommendation_chat.submit_failed", { requestId, route, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.recommendationChatFailed,
      message: "추천 채팅 메시지를 처리하지 못했습니다.",
    })
  }
}
