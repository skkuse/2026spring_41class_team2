import { NextResponse } from "next/server"
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
  CharacterChatInvalidCharacterError,
  UnauthorizedCharacterChatError,
} from "@/server/character-chat"
import {
  createCharacterChatConversationRequestSchema,
  createCharacterChatConversationResponseSchema,
  getCharacterChatConversationQuerySchema,
  getCharacterChatConversationResponseSchema,
} from "@/server/character-chat/character-chat-schema"

const getRoute = "GET /api/character-chat/conversations"
const route = "POST /api/character-chat/conversations"

export async function GET(request: Request) {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route: getRoute })
    const query = Object.fromEntries(new URL(request.url).searchParams)
    const parseResult = getCharacterChatConversationQuerySchema.safeParse(query)
    if (!parseResult.success) {
      logger.warn("request.query_validation_failed", { requestId, route: getRoute, error: parseResult.error.flatten() })
      return createInvalidQueryResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await characterChatService.getConversation(context, parseResult.data)
    logger.debug("character_chat.conversation_loaded", {
      requestId,
      route: getRoute,
      userId: context.user?.id,
      conversationId: response.conversationId,
      messageCount: response.messages.length,
    })

    return NextResponse.json(getCharacterChatConversationResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedCharacterChatError) {
      logger.warn("character_chat.unauthorized", { requestId, route: getRoute, error })
      return createUnauthorizedResponse({ requestId })
    }

    if (error instanceof CharacterChatInvalidCharacterError) {
      logger.warn("character_chat.invalid_character", { requestId, route: getRoute, error })
      return createApiErrorResponse({
        status: 404,
        code: apiErrorCodes.characterChatInvalidCharacter,
        message: "영화와 캐릭터 조합을 찾을 수 없습니다.",
        requestId,
      })
    }

    logger.error("character_chat.get_conversation_failed", { requestId, route: getRoute, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.characterChatFailed,
      message: "캐릭터 채팅 대화를 조회하지 못했습니다.",
    })
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route })
    const body = await request.json().catch(() => null)
    const parseResult = createCharacterChatConversationRequestSchema.safeParse(body)
    if (!parseResult.success) {
      logger.warn("request.validation_failed", { requestId, route, error: parseResult.error.flatten() })
      return createInvalidBodyResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await characterChatService.createConversation(context, parseResult.data)
    logger.info("character_chat.conversation_created", {
      requestId,
      route,
      userId: context.user?.id,
      conversationId: response.conversationId,
    })

    return NextResponse.json(createCharacterChatConversationResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedCharacterChatError) {
      logger.warn("character_chat.unauthorized", { requestId, route, error })
      return createUnauthorizedResponse({ requestId })
    }

    if (error instanceof CharacterChatInvalidCharacterError) {
      logger.warn("character_chat.invalid_character", { requestId, route, error })
      return createApiErrorResponse({
        status: 404,
        code: apiErrorCodes.characterChatInvalidCharacter,
        message: "영화와 캐릭터 조합을 찾을 수 없습니다.",
        requestId,
      })
    }

    logger.error("character_chat.create_conversation_failed", { requestId, route, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.characterChatFailed,
      message: "캐릭터 채팅 대화를 생성하지 못했습니다.",
    })
  }
}
