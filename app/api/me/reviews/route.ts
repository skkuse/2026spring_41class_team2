import { NextResponse } from "next/server"
import { createOptionalRequestContext, createRequestId } from "@/server/auth/request-context"
import { UnauthorizedReviewError, reviewService } from "@/server/reviews"
import { myReviewsQuerySchema, myReviewsResponseSchema } from "@/server/reviews/review-schema"
import {
  apiErrorCodes,
  createApiFailureResponse,
  createInvalidQueryResponse,
  createUnauthorizedResponse,
} from "@/server/error"
import { logger } from "@/server/logger"

const route = "GET /api/me/reviews"

export async function GET(request: Request) {
  const requestId = createRequestId()

  try {
    const query = Object.fromEntries(new URL(request.url).searchParams)
    logger.debug("request.start", { requestId, route, query })

    const parseResult = myReviewsQuerySchema.safeParse(query)
    if (!parseResult.success) {
      logger.warn("request.validation_failed", { requestId, route, error: parseResult.error.flatten() })
      return createInvalidQueryResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await reviewService.listMyReviews(context, parseResult.data)
    logger.debug("reviews.me.list.result", { requestId, route, userId: context.user?.id, count: response.reviews.length })

    return NextResponse.json(myReviewsResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedReviewError) {
      logger.warn("reviews.me.unauthorized", { requestId, route, error })
      return createUnauthorizedResponse({ requestId })
    }

    logger.error("api.reviews.me.list.failed", { requestId, route, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.myReviewsFailed,
      message: "내 리뷰 목록을 조회하지 못했습니다.",
    })
  }
}
