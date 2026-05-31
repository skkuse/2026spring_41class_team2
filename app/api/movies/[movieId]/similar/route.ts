import { NextResponse } from "next/server"
import { createOptionalRequestContext, createRequestId } from "@/server/auth/request-context"
import {
  apiErrorCodes,
  createApiFailureResponse,
  createInvalidMovieIdResponse,
  createInvalidQueryResponse,
  createMovieNotFoundResponse,
} from "@/server/error"
import { logger } from "@/server/logger"
import { MovieNotFoundError, movieService } from "@/server/movies"
import {
  movieIdParamsSchema,
  similarMoviesQuerySchema,
  similarMoviesResponseSchema,
} from "@/server/movies/movie-schema"

const route = "GET /api/movies/{movieId}/similar"

export async function GET(request: Request, { params }: { params: Promise<{ movieId: string }> }) {
  const requestId = createRequestId()

  try {
    const rawParams = await params
    const query = Object.fromEntries(new URL(request.url).searchParams)
    logger.debug("request.start", { requestId, route, params: rawParams, query })

    const paramsParseResult = movieIdParamsSchema.safeParse(rawParams)
    if (!paramsParseResult.success) {
      logger.warn("request.validation_failed", { requestId, route, error: paramsParseResult.error.flatten() })
      return createInvalidMovieIdResponse({ requestId })
    }

    const queryParseResult = similarMoviesQuerySchema.safeParse(query)
    if (!queryParseResult.success) {
      logger.warn("request.validation_failed", { requestId, route, error: queryParseResult.error.flatten() })
      return createInvalidQueryResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await movieService.listSimilarMovies(context, paramsParseResult.data.movieId, queryParseResult.data)
    logger.debug("movies.similar.result", { requestId, route, userId: context.user?.id, movieId: paramsParseResult.data.movieId, count: response.movies.length })

    return NextResponse.json(similarMoviesResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof MovieNotFoundError) {
      logger.warn("movies.similar.not_found", { requestId, route, error })
      return createMovieNotFoundResponse({ requestId })
    }

    logger.error("api.movies.similar.failed", { requestId, route, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.similarMoviesFailed,
      message: "비슷한 영화를 조회하지 못했습니다.",
    })
  }
}
