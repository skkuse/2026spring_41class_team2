import { NextResponse } from "next/server"
import { createOptionalRequestContext } from "@/server/auth/request-context"
import { createRequestId } from "@/server/auth/request-context"
import { apiErrorCodes, createApiFailureResponse, createInvalidQueryResponse } from "@/server/error"
import { logger } from "@/server/logger"
import { movieListQuerySchema, movieListResponseSchema } from "@/server/movies/movie-schema"
import { movieService } from "@/server/movies"

const route = "GET /api/movies"

export async function GET(request: Request) {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route, query: Object.fromEntries(new URL(request.url).searchParams) })
    const parseResult = movieListQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
    if (!parseResult.success) {
      logger.warn("request.validation_failed", { requestId, route, error: parseResult.error.flatten() })
      return createInvalidQueryResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await movieService.listMovies(context, parseResult.data)
    logger.debug("movies.list.result", { requestId, route, userId: context.user?.id, count: response.movies.length })

    return NextResponse.json(movieListResponseSchema.parse(response))
  } catch (error) {
    logger.error("api.movies.list.failed", { requestId, route, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.movieListFailed,
      message: "영화 목록을 조회하지 못했습니다.",
    })
  }
}
