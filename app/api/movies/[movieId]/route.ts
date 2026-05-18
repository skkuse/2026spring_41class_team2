import { NextResponse } from "next/server"
import { createOptionalRequestContext } from "@/server/auth/request-context"
import { createRequestId } from "@/server/auth/request-context"
import {
  apiErrorCodes,
  createApiFailureResponse,
  createInvalidMovieIdResponse,
  createMovieNotFoundResponse,
} from "@/server/error"
import { logger } from "@/server/logger"
import { MovieNotFoundError, movieService } from "@/server/movies"
import { movieDetailResponseSchema, movieIdParamsSchema } from "@/server/movies/movie-schema"

const route = "GET /api/movies/{movieId}"

export async function GET(_request: Request, { params }: { params: Promise<{ movieId: string }> }) {
  const requestId = createRequestId()

  try {
    const rawParams = await params
    logger.debug("request.start", { requestId, route, params: rawParams })
    const parseResult = movieIdParamsSchema.safeParse(rawParams)
    if (!parseResult.success) {
      logger.warn("request.validation_failed", { requestId, route, error: parseResult.error.flatten() })
      return createInvalidMovieIdResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const movie = await movieService.getMovieDetail(context, parseResult.data.movieId)
    logger.debug("movies.detail.result", { requestId, route, userId: context.user?.id, movieId: movie.id })

    return NextResponse.json(movieDetailResponseSchema.parse({ movie }))
  } catch (error) {
    if (error instanceof MovieNotFoundError) {
      logger.warn("movies.detail.not_found", { requestId, route, error })
      return createMovieNotFoundResponse({ requestId })
    }

    logger.error("api.movies.detail.failed", { requestId, route, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.movieDetailFailed,
      message: "영화 상세 정보를 조회하지 못했습니다.",
    })
  }
}
