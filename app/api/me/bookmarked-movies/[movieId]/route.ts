import { NextResponse } from "next/server"
import type { RequestContext } from "@/server/auth/auth-types"
import { createOptionalRequestContext, createRequestId } from "@/server/auth/request-context"
import { BookmarkMovieNotFoundError, UnauthorizedBookmarkError, bookmarkService } from "@/server/bookmarks"
import { bookmarkMovieParamsSchema, bookmarkMutationResponseSchema } from "@/server/bookmarks/bookmark-schema"
import type { BookmarkMutationResponseDto } from "@/server/bookmarks/bookmark-types"
import {
  apiErrorCodes,
  createApiFailureResponse,
  createInvalidMovieIdResponse,
  createMovieNotFoundResponse,
  createUnauthorizedResponse,
} from "@/server/error"
import { logger } from "@/server/logger"

const route = "/api/me/bookmarked-movies/{movieId}"

export async function PUT(_request: Request, { params }: { params: Promise<{ movieId: string }> }) {
  return handleBookmarkMutation("PUT", params, (context, movieId) => bookmarkService.addBookmark(context, { movieId }))
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ movieId: string }> }) {
  return handleBookmarkMutation("DELETE", params, (context, movieId) =>
    bookmarkService.removeBookmark(context, { movieId }),
  )
}

async function handleBookmarkMutation(
  method: "PUT" | "DELETE",
  params: Promise<{ movieId: string }>,
  action: (context: RequestContext, movieId: number) => Promise<BookmarkMutationResponseDto>,
) {
  const requestId = createRequestId()
  const routeWithMethod = `${method} ${route}`

  try {
    const rawParams = await params
    logger.debug("request.start", { requestId, route: routeWithMethod, params: rawParams })

    const parseResult = bookmarkMovieParamsSchema.safeParse(rawParams)
    if (!parseResult.success) {
      logger.warn("request.validation_failed", { requestId, route: routeWithMethod, error: parseResult.error.flatten() })
      return createInvalidMovieIdResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await action(context, parseResult.data.movieId)
    logger.debug("bookmarks.mutation.result", {
      requestId,
      route: routeWithMethod,
      userId: context.user?.id,
      movieId: response.movieId,
      isBookmarked: response.isBookmarked,
    })

    return NextResponse.json(bookmarkMutationResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedBookmarkError) {
      logger.warn("bookmarks.mutation.unauthorized", { requestId, route: routeWithMethod, error })
      return createUnauthorizedResponse({ requestId })
    }

    if (error instanceof BookmarkMovieNotFoundError) {
      logger.warn("bookmarks.mutation.not_found", { requestId, route: routeWithMethod, error })
      return createMovieNotFoundResponse({ requestId })
    }

    logger.error("api.bookmarks.mutation.failed", { requestId, route: routeWithMethod, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.bookmarkMutationFailed,
      message: "찜 상태를 변경하지 못했습니다.",
    })
  }
}
