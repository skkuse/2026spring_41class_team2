import { NextResponse } from "next/server"
import { createOptionalRequestContext, createRequestId } from "@/server/auth/request-context"
import {
  DuplicateReviewError,
  ReviewMovieNotFoundError,
  UnauthorizedReviewError,
  reviewService,
} from "@/server/reviews"
import {
  createReviewBodySchema,
  createReviewResponseSchema,
  movieReviewsParamsSchema,
  movieReviewsQuerySchema,
  movieReviewsResponseSchema,
} from "@/server/reviews/review-schema"
import {
  apiErrorCodes,
  createApiFailureResponse,
  createDuplicateReviewResponse,
  createInvalidMovieIdResponse,
  createInvalidQueryResponse,
  createMovieNotFoundResponse,
  createUnauthorizedResponse,
} from "@/server/error"
import { logger } from "@/server/logger"

const route = "/api/movies/{movieId}/reviews"

export async function GET(request: Request, { params }: { params: Promise<{ movieId: string }> }) {
  const requestId = createRequestId()
  const routeWithMethod = `GET ${route}`

  try {
    const rawParams = await params
    const query = Object.fromEntries(new URL(request.url).searchParams)
    logger.debug("request.start", { requestId, route: routeWithMethod, params: rawParams, query })

    const paramsResult = movieReviewsParamsSchema.safeParse(rawParams)
    if (!paramsResult.success) {
      logger.warn("request.validation_failed", { requestId, route: routeWithMethod, error: paramsResult.error.flatten() })
      return createInvalidMovieIdResponse({ requestId })
    }

    const queryResult = movieReviewsQuerySchema.safeParse(query)
    if (!queryResult.success) {
      logger.warn("request.validation_failed", { requestId, route: routeWithMethod, error: queryResult.error.flatten() })
      return createInvalidQueryResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await reviewService.listMovieReviews(context, {
      movieId: paramsResult.data.movieId,
      ...queryResult.data,
    })
    logger.debug("reviews.movie.list.result", {
      requestId,
      route: routeWithMethod,
      userId: context.user?.id,
      movieId: paramsResult.data.movieId,
      count: response.reviews.length,
    })

    return NextResponse.json(movieReviewsResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof ReviewMovieNotFoundError) {
      logger.warn("reviews.movie.not_found", { requestId, route: routeWithMethod, error })
      return createMovieNotFoundResponse({ requestId })
    }

    logger.error("api.reviews.movie.list.failed", { requestId, route: routeWithMethod, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.movieReviewsFailed,
      message: "영화 리뷰 목록을 조회하지 못했습니다.",
    })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ movieId: string }> }) {
  const requestId = createRequestId()
  const routeWithMethod = `POST ${route}`

  try {
    const rawParams = await params
    logger.debug("request.start", { requestId, route: routeWithMethod, params: rawParams })

    const paramsResult = movieReviewsParamsSchema.safeParse(rawParams)
    if (!paramsResult.success) {
      logger.warn("request.validation_failed", { requestId, route: routeWithMethod, error: paramsResult.error.flatten() })
      return createInvalidMovieIdResponse({ requestId })
    }

    const bodyResult = createReviewBodySchema.safeParse(await request.json().catch(() => null))
    if (!bodyResult.success) {
      logger.warn("request.validation_failed", { requestId, route: routeWithMethod, error: bodyResult.error.flatten() })
      return createInvalidQueryResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await reviewService.createReview(context, {
      movieId: paramsResult.data.movieId,
      ...bodyResult.data,
    })
    logger.info("reviews.create.succeeded", {
      requestId,
      route: routeWithMethod,
      userId: context.user?.id,
      movieId: paramsResult.data.movieId,
      reviewId: response.reviewId,
    })

    return NextResponse.json(createReviewResponseSchema.parse(response), { status: 201 })
  } catch (error) {
    if (error instanceof UnauthorizedReviewError) {
      logger.warn("reviews.create.unauthorized", { requestId, route: routeWithMethod, error })
      return createUnauthorizedResponse({ requestId })
    }

    if (error instanceof ReviewMovieNotFoundError) {
      logger.warn("reviews.create.movie_not_found", { requestId, route: routeWithMethod, error })
      return createMovieNotFoundResponse({ requestId })
    }

    if (error instanceof DuplicateReviewError) {
      logger.warn("reviews.create.duplicate", { requestId, route: routeWithMethod, error })
      return createDuplicateReviewResponse({ requestId })
    }

    logger.error("api.reviews.create.failed", { requestId, route: routeWithMethod, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.createReviewFailed,
      message: "리뷰를 작성하지 못했습니다.",
    })
  }
}
