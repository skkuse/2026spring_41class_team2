import { NextResponse } from "next/server"
import { createOptionalRequestContext, createRequestId } from "@/server/auth/request-context"
import { apiErrorCodes, createApiFailureResponse, createInvalidBodyResponse, createUnauthorizedResponse } from "@/server/error"
import { logger } from "@/server/logger"
import { recommendationChatService, UnauthorizedRecommendationChatError } from "@/server/recommendation-chat"
import {
  runRecommendationChatDebugRequestSchema,
  runRecommendationChatDebugResponseSchema,
} from "@/server/recommendation-chat/recommendation-chat-schema"

const route = "POST /api/recommendation-chat/debug/runs"

export async function POST(request: Request) {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route })
    const body = await request.json().catch(() => null)
    const parseResult = runRecommendationChatDebugRequestSchema.safeParse(body)
    if (!parseResult.success) {
      logger.warn("request.validation_failed", { requestId, route, error: parseResult.error.flatten() })
      return createInvalidBodyResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await recommendationChatService.runDebugRecommendationChatMessage(context, parseResult.data)
    logger.info("recommendation_chat.debug_run.completed", {
      requestId,
      route,
      userId: context.user?.id,
      conversationId: response.conversationId,
      status: response.status,
    })

    return NextResponse.json(runRecommendationChatDebugResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedRecommendationChatError) {
      logger.warn("recommendation_chat.debug_run.unauthorized", { requestId, route, error })
      return createUnauthorizedResponse({ requestId })
    }

    logger.error("recommendation_chat.debug_run.failed", { requestId, route, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.recommendationChatFailed,
      message: "추천 채팅 디버그 실행을 처리하지 못했습니다.",
    })
  }
}
