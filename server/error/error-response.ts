import "server-only"

import { NextResponse } from "next/server"

import { apiErrorCodes } from "./error-codes"
import { apiErrorResponseSchema } from "./error-schema"
import type {
  ApiErrorResponseDto,
  CreateApiErrorResponseInput,
  CreateApiFailureResponseInput,
  CreatePresetApiErrorResponseInput,
} from "./error-types"

export function createApiErrorResponse(input: CreateApiErrorResponseInput) {
  const body = apiErrorResponseSchema.parse({
    error: {
      code: input.code,
      message: input.message,
      requestId: input.requestId,
      ...(input.details === undefined ? {} : { details: input.details }),
    },
  }) satisfies ApiErrorResponseDto

  return NextResponse.json(body, { status: input.status })
}

export function createInvalidQueryResponse(input: CreatePresetApiErrorResponseInput) {
  return createApiErrorResponse({
    status: 400,
    code: apiErrorCodes.invalidQuery,
    message: "요청 query가 올바르지 않습니다.",
    requestId: input.requestId,
    details: input.details,
  })
}

export function createInvalidBodyResponse(input: CreatePresetApiErrorResponseInput) {
  return createApiErrorResponse({
    status: 400,
    code: apiErrorCodes.invalidBody,
    message: "요청 body가 올바르지 않습니다.",
    requestId: input.requestId,
    details: input.details,
  })
}

export function createInvalidMovieIdResponse(input: CreatePresetApiErrorResponseInput) {
  return createApiErrorResponse({
    status: 400,
    code: apiErrorCodes.invalidMovieId,
    message: "영화 ID가 올바르지 않습니다.",
    requestId: input.requestId,
    details: input.details,
  })
}

export function createInvalidReviewIdResponse(input: CreatePresetApiErrorResponseInput) {
  return createApiErrorResponse({
    status: 400,
    code: apiErrorCodes.invalidReviewId,
    message: "리뷰 ID가 올바르지 않습니다.",
    requestId: input.requestId,
    details: input.details,
  })
}

export function createUnauthorizedResponse(input: CreatePresetApiErrorResponseInput) {
  return createApiErrorResponse({
    status: 401,
    code: apiErrorCodes.unauthorized,
    message: "로그인이 필요합니다.",
    requestId: input.requestId,
    details: input.details,
  })
}

export function createOnboardingRequiredResponse(input: CreatePresetApiErrorResponseInput) {
  return createApiErrorResponse({
    status: 409,
    code: apiErrorCodes.onboardingRequired,
    message: "온보딩 완료가 필요합니다.",
    requestId: input.requestId,
    details: input.details,
  })
}

export function createMovieNotFoundResponse(input: CreatePresetApiErrorResponseInput) {
  return createApiErrorResponse({
    status: 404,
    code: apiErrorCodes.movieNotFound,
    message: "영화를 찾을 수 없습니다.",
    requestId: input.requestId,
    details: input.details,
  })
}

export function createReviewNotFoundResponse(input: CreatePresetApiErrorResponseInput) {
  return createApiErrorResponse({
    status: 404,
    code: apiErrorCodes.reviewNotFound,
    message: "리뷰를 찾을 수 없습니다.",
    requestId: input.requestId,
    details: input.details,
  })
}

export function createForbiddenReviewResponse(input: CreatePresetApiErrorResponseInput) {
  return createApiErrorResponse({
    status: 403,
    code: apiErrorCodes.forbiddenReview,
    message: "본인이 작성한 리뷰만 수정/삭제할 수 있습니다.",
    requestId: input.requestId,
    details: input.details,
  })
}

export function createDuplicateReviewResponse(input: CreatePresetApiErrorResponseInput) {
  return createApiErrorResponse({
    status: 409,
    code: apiErrorCodes.duplicateReview,
    message: "이미 이 영화에 리뷰를 작성했습니다.",
    requestId: input.requestId,
    details: input.details,
  })
}

export function createApiFailureResponse(input: CreateApiFailureResponseInput) {
  return createApiErrorResponse({
    status: 500,
    code: input.code,
    message: input.message,
    requestId: input.requestId,
    details: input.details,
  })
}
