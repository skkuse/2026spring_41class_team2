import { NextResponse } from "next/server"
import { createOptionalRequestContext, createRequestId } from "@/server/auth/request-context"
import { apiErrorCodes, createApiFailureResponse, createUnauthorizedResponse } from "@/server/error"
import { logger } from "@/server/logger"
import {
  recommendationChatService,
  UnauthorizedRecommendationChatError,
} from "@/server/recommendation-chat"
import { getRecommendationChatConversationResponseSchema } from "@/server/recommendation-chat/recommendation-chat-schema"

const route = "GET /api/recommendation-chat/conversation"
const deleteRoute = "DELETE /api/recommendation-chat/conversation"

export async function GET() {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route })
    const context = await createOptionalRequestContext(requestId)
    const response = await recommendationChatService.getMyRecommendationChatConversation(context)
    logger.debug("recommendation_chat.conversation_loaded", {
      requestId,
      route,
      userId: context.user?.id,
      conversationId: response.conversationId,
      messageCount: response.messages.length,
    })

    return NextResponse.json(getRecommendationChatConversationResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedRecommendationChatError) {
      logger.warn("recommendation_chat.unauthorized", { requestId, route, error })
      return createUnauthorizedResponse({ requestId })
    }

    logger.error("recommendation_chat.conversation_failed", { requestId, route, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.recommendationChatFailed,
      message: "추천 채팅 대화를 조회하지 못했습니다.",
    })
  }
}

export async function DELETE() {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route: deleteRoute })
    const context = await createOptionalRequestContext(requestId)
    const response = await recommendationChatService.resetMyRecommendationChatConversation(context)
    logger.info("recommendation_chat.conversation_reset", {
      requestId,
      route: deleteRoute,
      userId: context.user?.id,
    })

    return NextResponse.json(getRecommendationChatConversationResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedRecommendationChatError) {
      logger.warn("recommendation_chat.unauthorized", { requestId, route: deleteRoute, error })
      return createUnauthorizedResponse({ requestId })
    }

    logger.error("recommendation_chat.conversation_reset_failed", { requestId, route: deleteRoute, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.recommendationChatFailed,
      message: "추천 채팅 대화를 초기화하지 못했습니다.",
    })
  }
}
