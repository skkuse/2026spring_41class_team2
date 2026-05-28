import { NextResponse } from "next/server"
import { createOptionalRequestContext, createRequestId } from "@/server/auth/request-context"
import { apiErrorCodes, createApiFailureResponse, createUnauthorizedResponse } from "@/server/error"
import { logger } from "@/server/logger"
import { characterChatService, UnauthorizedCharacterChatError } from "@/server/character-chat"
import { listCharacterChatMoviesResponseSchema } from "@/server/character-chat/character-chat-schema"

const route = "GET /api/character-chat/movies"

export async function GET() {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route })
    const context = await createOptionalRequestContext(requestId)
    const response = await characterChatService.listMovies(context)
    logger.info("character_chat.movies_listed", {
      requestId,
      route,
      userId: context.user?.id,
      movieCount: response.movies.length,
    })

    return NextResponse.json(listCharacterChatMoviesResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedCharacterChatError) {
      logger.warn("character_chat.unauthorized", { requestId, route, error })
      return createUnauthorizedResponse({ requestId })
    }

    logger.error("character_chat.list_movies_failed", { requestId, route, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.characterChatFailed,
      message: "캐릭터 채팅 영화 목록을 조회하지 못했습니다.",
    })
  }
}
