import { NextResponse } from "next/server"
import { createOptionalRequestContext, createRequestId } from "@/server/auth/request-context"
import {
  OnboardingRequiredRecommendationError,
  itemCfRecommendationService,
  UnauthorizedRecommendationError,
} from "@/server/recommendations"
import {
  itemCfRecommendationsQuerySchema,
  itemCfRecommendationsResponseSchema,
} from "@/server/recommendations/item-cf-schema"
import {
  apiErrorCodes,
  createApiFailureResponse,
  createInvalidQueryResponse,
  createOnboardingRequiredResponse,
  createUnauthorizedResponse,
} from "@/server/error"
import { logger } from "@/server/logger"

const route = "GET /api/me/recommendations/item-cf"

export async function GET(request: Request) {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route })
    const query = Object.fromEntries(new URL(request.url).searchParams)
    const parseResult = itemCfRecommendationsQuerySchema.safeParse(query)
    if (!parseResult.success) {
      logger.warn("request.validation_failed", { requestId, route, error: parseResult.error.flatten() })
      return createInvalidQueryResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await itemCfRecommendationService.getItemCfRecommendations(context, parseResult.data)
    logger.debug("recommendations.item_cf.result", { requestId, route, userId: context.user?.id, sectionCount: response.sections.length })

    return NextResponse.json(itemCfRecommendationsResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedRecommendationError) {
      logger.warn("recommendations.item_cf.unauthorized", { requestId, route, error })
      return createUnauthorizedResponse({ requestId })
    }

    if (error instanceof OnboardingRequiredRecommendationError) {
      logger.warn("recommendations.item_cf.onboarding_required", { requestId, route, error })
      return createOnboardingRequiredResponse({ requestId })
    }

    logger.error("api.recommendations.item_cf.failed", { requestId, route, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.itemCfRecommendationsFailed,
      message: "맞춤 추천을 조회하지 못했습니다.",
    })
  }
}
