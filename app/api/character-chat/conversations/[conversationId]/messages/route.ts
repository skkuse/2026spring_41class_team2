import { NextResponse } from "next/server"
import { z } from "zod"
import { createOptionalRequestContext, createRequestId } from "@/server/auth/request-context"
import {
  apiErrorCodes,
  createApiErrorResponse,
  createApiFailureResponse,
  createInvalidBodyResponse,
  createInvalidQueryResponse,
  createUnauthorizedResponse,
} from "@/server/error"
import { logger } from "@/server/logger"
import {
  characterChatService,
  CharacterChatConversationNotFoundError,
  CharacterChatLlmApiError,
  UnauthorizedCharacterChatError,
} from "@/server/character-chat"
import {
  sendCharacterChatMessageRequestSchema,
  sendCharacterChatMessageResponseSchema,
} from "@/server/character-chat/character-chat-schema"

const route = "POST /api/character-chat/conversations/[conversationId]/messages"
const paramsSchema = z.object({ conversationId: z.string().uuid() })

export async function POST(request: Request, context: { params: Promise<{ conversationId: string }> }) {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route })
    const paramsResult = paramsSchema.safeParse(await context.params)
    if (!paramsResult.success) {
      logger.warn("request.params_validation_failed", { requestId, route, error: paramsResult.error.flatten() })
      return createInvalidQueryResponse({ requestId })
    }

    const body = await request.json().catch(() => null)
    const bodyResult = sendCharacterChatMessageRequestSchema.safeParse(body)
    if (!bodyResult.success) {
      logger.warn("request.validation_failed", { requestId, route, error: bodyResult.error.flatten() })
      return createInvalidBodyResponse({ requestId })
    }

    const requestContext = await createOptionalRequestContext(requestId)
    const response = await characterChatService.sendMessage(requestContext, {
      conversationId: paramsResult.data.conversationId,
      message: bodyResult.data.message,
    })
    logger.info("character_chat.message_sent", {
      requestId,
      route,
      userId: requestContext.user?.id,
      conversationId: paramsResult.data.conversationId,
      messageId: response.messageId,
    })

    return NextResponse.json(sendCharacterChatMessageResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedCharacterChatError) {
      logger.warn("character_chat.unauthorized", { requestId, route, error })
      return createUnauthorizedResponse({ requestId })
    }

    if (error instanceof CharacterChatConversationNotFoundError) {
      logger.warn("character_chat.conversation_not_found", { requestId, route, error })
      return createApiErrorResponse({
        status: 404,
        code: apiErrorCodes.characterChatConversationNotFound,
        message: "캐릭터 채팅 대화를 찾을 수 없습니다.",
        requestId,
      })
    }

    if (error instanceof CharacterChatLlmApiError) {
      logger.error("character_chat.llm_failed", { requestId, route, error })
      return createApiFailureResponse({
        requestId,
        code: apiErrorCodes.characterChatLlmApiFailed,
        message: "캐릭터 응답을 생성하지 못했습니다.",
      })
    }

    logger.error("character_chat.send_message_failed", { requestId, route, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.characterChatFailed,
      message: "캐릭터 채팅 메시지를 처리하지 못했습니다.",
    })
  }
}
