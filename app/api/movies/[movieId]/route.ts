import { NextResponse } from "next/server"
import { createOptionalRequestContext } from "@/server/auth/request-context"
import { createRequestId } from "@/server/auth/request-context"
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
      return NextResponse.json({ error: { code: "invalid_movie_id", message: "영화 ID가 올바르지 않습니다." } }, { status: 400 })
    }

    const context = await createOptionalRequestContext(requestId)
    const movie = await movieService.getMovieDetail(context, parseResult.data.movieId)
    logger.debug("movies.detail.result", { requestId, route, userId: context.user?.id, movieId: movie.id })

    return NextResponse.json(movieDetailResponseSchema.parse({ movie }))
  } catch (error) {
    if (error instanceof MovieNotFoundError) {
      logger.warn("movies.detail.not_found", { requestId, route, error })
      return NextResponse.json({ error: { code: "movie_not_found", message: "영화를 찾을 수 없습니다." } }, { status: 404 })
    }

    logger.error("api.movies.detail.failed", { requestId, route, error })
    return NextResponse.json(
      { error: { code: "movie_detail_failed", message: "영화 상세 정보를 조회하지 못했습니다." } },
      { status: 500 },
    )
  }
}
