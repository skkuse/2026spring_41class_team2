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

export function createInvalidMovieIdResponse(input: CreatePresetApiErrorResponseInput) {
  return createApiErrorResponse({
    status: 400,
    code: apiErrorCodes.invalidMovieId,
    message: "영화 ID가 올바르지 않습니다.",
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

export function createMovieNotFoundResponse(input: CreatePresetApiErrorResponseInput) {
  return createApiErrorResponse({
    status: 404,
    code: apiErrorCodes.movieNotFound,
    message: "영화를 찾을 수 없습니다.",
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
