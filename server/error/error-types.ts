import "server-only"

import type { ApiErrorCode } from "./error-codes"

// HTTP DTO
export type ApiErrorResponseDto = {
  error: {
    code: ApiErrorCode
    message: string
    requestId: string
    details?: unknown
  }
}

export type CreateApiErrorResponseInput = {
  status: number
  code: ApiErrorCode
  message: string
  requestId: string
  details?: unknown
}

export type CreatePresetApiErrorResponseInput = {
  requestId: string
  details?: unknown
}

export type CreateApiFailureResponseInput = {
  code: ApiErrorCode
  message: string
  requestId: string
  details?: unknown
}
