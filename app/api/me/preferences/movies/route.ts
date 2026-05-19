import { NextResponse } from "next/server"
import { createOptionalRequestContext, createRequestId } from "@/server/auth/request-context"
import {
  InvalidPreferredMoviesError,
  onboardingService,
  UnauthorizedOnboardingError,
} from "@/server/onboarding"
import {
  preferredMoviesResponseSchema,
  savePreferredMoviesBodySchema,
  savePreferredMoviesResponseSchema,
} from "@/server/onboarding/onboarding-schema"
import {
  apiErrorCodes,
  createApiErrorResponse,
  createApiFailureResponse,
  createInvalidBodyResponse,
  createUnauthorizedResponse,
} from "@/server/error"
import { logger } from "@/server/logger"

const getRoute = "GET /api/me/preferences/movies"
const putRoute = "PUT /api/me/preferences/movies"

export async function GET() {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route: getRoute })
    const context = await createOptionalRequestContext(requestId)
    const response = await onboardingService.listPreferredMovies(context)
    logger.debug("onboarding.preferences.list.result", { requestId, route: getRoute, userId: context.user?.id, count: response.movies.length })

    return NextResponse.json(preferredMoviesResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof UnauthorizedOnboardingError) {
      logger.warn("onboarding.preferences.list.unauthorized", { requestId, route: getRoute, error })
      return createUnauthorizedResponse({ requestId })
    }

    logger.error("api.onboarding.preferences.list.failed", { requestId, route: getRoute, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.onboardingPreferencesFailed,
      message: "온보딩 선호 영화 목록을 조회하지 못했습니다.",
    })
  }
}

export async function PUT(request: Request) {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route: putRoute })
    const body = await readJson(request)
    const parseResult = savePreferredMoviesBodySchema.safeParse(body)
    if (!parseResult.success) {
      logger.warn("request.validation_failed", { requestId, route: putRoute, error: parseResult.error.flatten() })
      return createInvalidBodyResponse({ requestId })
    }

    const context = await createOptionalRequestContext(requestId)
    const response = await onboardingService.savePreferredMovies(context, parseResult.data)
    logger.info("onboarding.preferences.saved", { requestId, route: putRoute, userId: context.user?.id, movieCount: response.movieIds.length })

    return NextResponse.json(savePreferredMoviesResponseSchema.parse(response))
  } catch (error) {
    if (error instanceof SyntaxError) {
      logger.warn("request.invalid_json", { requestId, route: putRoute, error })
      return createInvalidBodyResponse({ requestId })
    }

    if (error instanceof UnauthorizedOnboardingError) {
      logger.warn("onboarding.preferences.save.unauthorized", { requestId, route: putRoute, error })
      return createUnauthorizedResponse({ requestId })
    }

    if (error instanceof InvalidPreferredMoviesError) {
      logger.warn("onboarding.preferences.save.invalid", { requestId, route: putRoute, error })
      return createApiErrorResponse({
        status: 400,
        code: apiErrorCodes.invalidBody,
        message: "온보딩 선호 영화가 올바르지 않습니다.",
        requestId,
      })
    }

    logger.error("api.onboarding.preferences.save.failed", { requestId, route: putRoute, error })
    return createApiFailureResponse({
      requestId,
      code: apiErrorCodes.onboardingPreferencesFailed,
      message: "온보딩 선호 영화를 저장하지 못했습니다.",
    })
  }
}

async function readJson(request: Request) {
  return request.json()
}
