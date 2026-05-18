import { NextResponse } from "next/server"
import { createRequestId } from "@/server/auth/request-context"
import { logger } from "@/server/logger"
import { movieService } from "@/server/movies"
import { genreListResponseSchema } from "@/server/movies/movie-schema"

const route = "GET /api/genres"

export async function GET() {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route })
    const response = await movieService.listGenres()
    logger.debug("genres.list.result", { requestId, route, count: response.genres.length })

    return NextResponse.json(genreListResponseSchema.parse(response))
  } catch (error) {
    logger.error("api.genres.list.failed", { requestId, route, error })
    return NextResponse.json(
      { error: { code: "genre_list_failed", message: "장르 목록을 조회하지 못했습니다." } },
      { status: 500 },
    )
  }
}
