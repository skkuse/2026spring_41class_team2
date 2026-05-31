import { NextResponse } from "next/server"
import { ZodError } from "zod"
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
  RecommendationChatPersistenceError,
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
      return createUnauthorizedResponse({ requestId, details: recommendationChatFailureDetails("auth") })
    }

    if (error instanceof RecommendationChatLlmApiError) {
      logger.error("recommendation_chat.llm_failed", { requestId, route, error })
      return createApiFailureResponse({
        requestId,
        code: apiErrorCodes.recommendationChatLlmApiFailed,
        message: "추천 요청을 분석하지 못했습니다.",
        details: recommendationChatFailureDetails(error.failureStage),
      })
    }

    if (error instanceof RecommendationChatEmbeddingApiError) {
      logger.error("recommendation_chat.embedding_failed", { requestId, route, error })
      return createApiFailureResponse({
        requestId,
        code: apiErrorCodes.recommendationChatEmbeddingApiFailed,
        message: "추천 태그를 처리하지 못했습니다.",
        details: recommendationChatFailureDetails("embedding"),
      })
    }

    if (error instanceof RecommendationChatVectorSearchError) {
      logger.error("recommendation_chat.vector_search_failed", { requestId, route, error })
      return createApiFailureResponse({
        requestId,
        code: apiErrorCodes.recommendationChatVectorSearchFailed,
        message: "추천 후보를 조회하지 못했습니다.",
        details: recommendationChatFailureDetails("candidate_query"),
      })
    }

    if (error instanceof RecommendationChatPersistenceError) {
      logger.error("recommendation_chat.persistence_failed", { requestId, route, error })
      return createApiFailureResponse({
        requestId,
        code: apiErrorCodes.recommendationChatFailed,
        message: "추천 결과를 저장하지 못했습니다.",
        details: recommendationChatFailureDetails("persistence"),
      })
    }

    if (error instanceof ZodError) {
      logger.error("recommendation_chat.response_validation_failed", { requestId, route, error })
      return createApiFailureResponse({
        requestId,
        code: apiErrorCodes.recommendationChatFailed,
        message: "추천 응답 형식이 올바르지 않습니다.",
        details: recommendationChatFailureDetails("response_validation"),
      })
    }

    logger.error("recommendation_chat.submit_failed", { requestId, route, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.recommendationChatFailed,
      message: "추천 채팅 메시지를 처리하지 못했습니다.",
      details: recommendationChatFailureDetails("unknown"),
    })
  }
}

function recommendationChatFailureDetails(failureStage: string) {
  return {
    failureStage,
    failureSource: recommendationChatFailureSource(failureStage),
  }
}

function recommendationChatFailureSource(failureStage: string) {
  if (failureStage === "analysis" || failureStage === "reason_generation" || failureStage === "embedding") {
    return "external_ai_service"
  }
  if (failureStage === "auth") {
    return "auth"
  }
  if (failureStage === "persistence") {
    return "internal_storage"
  }
  if (failureStage === "response_validation") {
    return "internal_response_validation"
  }
  if (failureStage === "candidate_query") {
    return "internal_candidate_query"
  }
  return "unknown"
}
