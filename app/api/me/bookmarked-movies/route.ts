import { NextResponse } from "next/server"
import { createOptionalRequestContext, createRequestId } from "@/server/auth/request-context"
import { BookmarkMovieNotFoundError, UnauthorizedBookmarkError, bookmarkService } from "@/server/bookmarks"
import { bookmarkedMoviesQuerySchema, bookmarkedMoviesResponseSchema } from "@/server/bookmarks/bookmark-schema"
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
      return NextResponse.json({ error: { code: "invalid_query", message: "요청 query가 올바르지 않습니다." } }, { status: 400 })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await bookmarkService.getBookmarkedMovies(context, parseResult.data)
    logger.debug("bookmarks.list.result", { requestId, route, userId: context.user?.id, count: response.movies.length })

    return NextResponse.json(bookmarkedMoviesResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedBookmarkError) {
      logger.warn("bookmarks.list.unauthorized", { requestId, route, error })
      return NextResponse.json({ error: { code: "unauthorized", message: "로그인이 필요합니다." } }, { status: 401 })
    }

    if (error instanceof BookmarkMovieNotFoundError) {
      logger.warn("bookmarks.list.not_found", { requestId, route, error })
      return NextResponse.json({ error: { code: "movie_not_found", message: "영화를 찾을 수 없습니다." } }, { status: 404 })
    }

    logger.error("api.bookmarks.list.failed", { requestId, route, error })
    return NextResponse.json(
      { error: { code: "bookmarked_movies_failed", message: "찜한 영화 목록을 조회하지 못했습니다." } },
      { status: 500 },
    )
  }
}
