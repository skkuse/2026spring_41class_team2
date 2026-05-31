import { NextResponse } from "next/server"
import { z } from "zod"
import { createRequestId } from "@/server/auth/request-context"
import { apiErrorCodes, createApiFailureResponse, createInvalidQueryResponse } from "@/server/error"
import { logger } from "@/server/logger"
import { recommendationChatService } from "@/server/recommendation-chat"

const route = "/api/recommendation-chat/debug/questions/{questionId}"
const paramsSchema = z.object({ questionId: z.string().uuid() })

export async function DELETE(_request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  const requestId = createRequestId()

  try {
    const rawParams = await params
    logger.debug("request.start", { requestId, route: `DELETE ${route}`, params: rawParams })
    const parseResult = paramsSchema.safeParse(rawParams)
    if (!parseResult.success) {
      logger.warn("request.validation_failed", { requestId, route: `DELETE ${route}`, error: parseResult.error.flatten() })
      return createInvalidQueryResponse({ requestId })
    }

    await recommendationChatService.deleteDebugQuestion(parseResult.data)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error("recommendation_chat.debug_questions.delete_failed", { requestId, route: `DELETE ${route}`, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.recommendationChatFailed,
      message: "추천 채팅 디버그 질문을 삭제하지 못했습니다.",
    })
  }
}
