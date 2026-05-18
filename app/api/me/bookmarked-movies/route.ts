import { NextResponse } from "next/server"
import { createOptionalRequestContext, createRequestId } from "@/server/auth/request-context"
import { BookmarkMovieNotFoundError, UnauthorizedBookmarkError, bookmarkService } from "@/server/bookmarks"
import { bookmarkedMoviesQuerySchema, bookmarkedMoviesResponseSchema } from "@/server/bookmarks/bookmark-schema"
import {
  apiErrorCodes,
  createApiFailureResponse,
  createInvalidQueryResponse,
  createMovieNotFoundResponse,
  createUnauthorizedResponse,
} from "@/server/error"
import { logger } from "@/server/logger"

const route = "GET /api/me/bookmarked-movies"

export async function GET(request: Request) {
  const requestId = createRequestId()

  try {
    const query = Object.fromEntries(new URL(request.url).searchParams)
    logger.debug("request.start", { requestId, route, query })

    const parseResult = bookmarkedMoviesQuerySchema.safeParse(query)
    if (!parseResult.success) {
      logger.warn("request.validation_failed", { requestId, route, error: parseResult.error.flatten() })
      return createInvalidQueryResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await bookmarkService.getBookmarkedMovies(context, parseResult.data)
    logger.debug("bookmarks.list.result", { requestId, route, userId: context.user?.id, count: response.movies.length })

    return NextResponse.json(bookmarkedMoviesResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedBookmarkError) {
      logger.warn("bookmarks.list.unauthorized", { requestId, route, error })
      return createUnauthorizedResponse({ requestId })
    }

    if (error instanceof BookmarkMovieNotFoundError) {
      logger.warn("bookmarks.list.not_found", { requestId, route, error })
      return createMovieNotFoundResponse({ requestId })
    }

    logger.error("api.bookmarks.list.failed", { requestId, route, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.bookmarkedMoviesFailed,
      message: "찜한 영화 목록을 조회하지 못했습니다.",
    })
  }
}
