import { NextResponse } from "next/server"
import { createRequestId } from "@/server/auth/request-context"
import { apiErrorCodes, createApiFailureResponse, createInvalidBodyResponse } from "@/server/error"
import { logger } from "@/server/logger"
import { recommendationChatService } from "@/server/recommendation-chat"
import {
  createRecommendationChatDebugQuestionRequestSchema,
  createRecommendationChatDebugQuestionResponseSchema,
  listRecommendationChatDebugQuestionsResponseSchema,
} from "@/server/recommendation-chat/recommendation-chat-schema"

const route = "/api/recommendation-chat/debug/questions"

export async function GET() {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route: `GET ${route}` })
    const response = await recommendationChatService.listDebugQuestions()
    return NextResponse.json(listRecommendationChatDebugQuestionsResponseSchema.parse(response))
  } catch (error) {
    logger.error("recommendation_chat.debug_questions.list_failed", { requestId, route: `GET ${route}`, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.recommendationChatFailed,
      message: "추천 채팅 디버그 질문을 조회하지 못했습니다.",
    })
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route: `POST ${route}` })
    const body = await request.json().catch(() => null)
    const parseResult = createRecommendationChatDebugQuestionRequestSchema.safeParse(body)
    if (!parseResult.success) {
      logger.warn("request.validation_failed", { requestId, route: `POST ${route}`, error: parseResult.error.flatten() })
      return createInvalidBodyResponse({ requestId })
    }

    const response = await recommendationChatService.createDebugQuestion(parseResult.data)
    return NextResponse.json(createRecommendationChatDebugQuestionResponseSchema.parse(response), { status: 201 })
  } catch (error) {
    logger.error("recommendation_chat.debug_questions.create_failed", { requestId, route: `POST ${route}`, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.recommendationChatFailed,
      message: "추천 채팅 디버그 질문을 추가하지 못했습니다.",
    })
  }
}
