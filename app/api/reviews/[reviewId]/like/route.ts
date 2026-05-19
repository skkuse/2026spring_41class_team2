import { NextResponse } from "next/server"
import { createOptionalRequestContext, createRequestId } from "@/server/auth/request-context"
import { ReviewNotFoundError, UnauthorizedReviewError, reviewService } from "@/server/reviews"
import { reviewIdParamsSchema, reviewLikeResponseSchema } from "@/server/reviews/review-schema"
import {
  apiErrorCodes,
  createApiFailureResponse,
  createInvalidReviewIdResponse,
  createReviewNotFoundResponse,
  createUnauthorizedResponse,
} from "@/server/error"
import { logger } from "@/server/logger"

const route = "/api/reviews/{reviewId}/like"

export async function PUT(_request: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  return handleLikeMutation("PUT", params, true)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  return handleLikeMutation("DELETE", params, false)
}

async function handleLikeMutation(method: "PUT" | "DELETE", params: Promise<{ reviewId: string }>, liked: boolean) {
  const requestId = createRequestId()
  const routeWithMethod = `${method} ${route}`

  try {
    const rawParams = await params
    logger.debug("request.start", { requestId, route: routeWithMethod, params: rawParams })

    const parseResult = reviewIdParamsSchema.safeParse(rawParams)
    if (!parseResult.success) {
      logger.warn("request.validation_failed", { requestId, route: routeWithMethod, error: parseResult.error.flatten() })
      return createInvalidReviewIdResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await reviewService.setReviewLike(context, {
      reviewId: parseResult.data.reviewId,
      liked,
    })
    logger.debug("reviews.like.result", {
      requestId,
      route: routeWithMethod,
      userId: context.user?.id,
      reviewId: response.reviewId,
      isLiked: response.isLiked,
      likes: response.likes,
    })

    return NextResponse.json(reviewLikeResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedReviewError) {
      logger.warn("reviews.like.unauthorized", { requestId, route: routeWithMethod, error })
      return createUnauthorizedResponse({ requestId })
    }

    if (error instanceof ReviewNotFoundError) {
      logger.warn("reviews.like.not_found", { requestId, route: routeWithMethod, error })
      return createReviewNotFoundResponse({ requestId })
    }

    logger.error("api.reviews.like.failed", { requestId, route: routeWithMethod, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.reviewLikeFailed,
      message: "리뷰 좋아요 상태를 변경하지 못했습니다.",
    })
  }
}
