import { NextResponse } from "next/server"
import { createOptionalRequestContext, createRequestId } from "@/server/auth/request-context"
import {
  ForbiddenReviewError,
  ReviewNotFoundError,
  UnauthorizedReviewError,
  reviewService,
} from "@/server/reviews"
import { reviewIdParamsSchema, updateReviewBodySchema, updateReviewResponseSchema } from "@/server/reviews/review-schema"
import {
  apiErrorCodes,
  createApiFailureResponse,
  createForbiddenReviewResponse,
  createInvalidBodyResponse,
  createInvalidReviewIdResponse,
  createReviewNotFoundResponse,
  createUnauthorizedResponse,
} from "@/server/error"
import { logger } from "@/server/logger"

const route = "/api/reviews/{reviewId}"

export async function PATCH(request: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const requestId = createRequestId()
  const routeWithMethod = `PATCH ${route}`

  try {
    const rawParams = await params
    logger.debug("request.start", { requestId, route: routeWithMethod, params: rawParams })

    const paramsResult = reviewIdParamsSchema.safeParse(rawParams)
    if (!paramsResult.success) {
      logger.warn("request.validation_failed", { requestId, route: routeWithMethod, error: paramsResult.error.flatten() })
      return createInvalidReviewIdResponse({ requestId })
    }

    const bodyResult = updateReviewBodySchema.safeParse(await request.json().catch(() => null))
    if (!bodyResult.success) {
      logger.warn("request.validation_failed", { requestId, route: routeWithMethod, error: bodyResult.error.flatten() })
      return createInvalidBodyResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await reviewService.updateReview(context, {
      reviewId: paramsResult.data.reviewId,
      ...bodyResult.data,
    })
    logger.info("reviews.update.succeeded", {
      requestId,
      route: routeWithMethod,
      userId: context.user?.id,
      reviewId: response.reviewId,
    })

    return NextResponse.json(updateReviewResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedReviewError) {
      logger.warn("reviews.update.unauthorized", { requestId, route: routeWithMethod, error })
      return createUnauthorizedResponse({ requestId })
    }
    if (error instanceof ForbiddenReviewError) {
      logger.warn("reviews.update.forbidden", { requestId, route: routeWithMethod, error })
      return createForbiddenReviewResponse({ requestId })
    }
    if (error instanceof ReviewNotFoundError) {
      logger.warn("reviews.update.not_found", { requestId, route: routeWithMethod, error })
      return createReviewNotFoundResponse({ requestId })
    }

    logger.error("api.reviews.update.failed", { requestId, route: routeWithMethod, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.updateReviewFailed,
      message: "리뷰를 수정하지 못했습니다.",
    })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const requestId = createRequestId()
  const routeWithMethod = `DELETE ${route}`

  try {
    const rawParams = await params
    logger.debug("request.start", { requestId, route: routeWithMethod, params: rawParams })

    const paramsResult = reviewIdParamsSchema.safeParse(rawParams)
    if (!paramsResult.success) {
      logger.warn("request.validation_failed", { requestId, route: routeWithMethod, error: paramsResult.error.flatten() })
      return createInvalidReviewIdResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    await reviewService.deleteReview(context, { reviewId: paramsResult.data.reviewId })
    logger.info("reviews.delete.succeeded", {
      requestId,
      route: routeWithMethod,
      userId: context.user?.id,
      reviewId: paramsResult.data.reviewId,
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof UnauthorizedReviewError) {
      logger.warn("reviews.delete.unauthorized", { requestId, route: routeWithMethod, error })
      return createUnauthorizedResponse({ requestId })
    }
    if (error instanceof ForbiddenReviewError) {
      logger.warn("reviews.delete.forbidden", { requestId, route: routeWithMethod, error })
      return createForbiddenReviewResponse({ requestId })
    }
    if (error instanceof ReviewNotFoundError) {
      logger.warn("reviews.delete.not_found", { requestId, route: routeWithMethod, error })
      return createReviewNotFoundResponse({ requestId })
    }

    logger.error("api.reviews.delete.failed", { requestId, route: routeWithMethod, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.deleteReviewFailed,
      message: "리뷰를 삭제하지 못했습니다.",
    })
  }
}