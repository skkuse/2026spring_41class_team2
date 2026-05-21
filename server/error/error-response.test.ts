import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import {
  apiErrorCodes,
  createApiFailureResponse,
  createDuplicateReviewResponse,
  createInvalidMovieIdResponse,
  createInvalidQueryResponse,
  createInvalidReviewIdResponse,
  createMovieNotFoundResponse,
  createReviewNotFoundResponse,
  createUnauthorizedResponse,
} from "./index"

describe("API error responses", () => {
  it("creates a typed invalid query response", async () => {
    const response = createInvalidQueryResponse({ requestId: "request-1" })

    await expect(readResponse(response)).resolves.toEqual({
      status: 400,
      body: {
        error: {
          code: apiErrorCodes.invalidQuery,
          message: "요청 query가 올바르지 않습니다.",
          requestId: "request-1",
        },
      },
    })
  })

  it("creates a typed invalid movie id response", async () => {
    const response = createInvalidMovieIdResponse({ requestId: "request-1" })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidMovieId, requestId: "request-1" } },
    })
  })

  it("creates a typed unauthorized response", async () => {
    const response = createUnauthorizedResponse({ requestId: "request-1" })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 401,
      body: { error: { code: apiErrorCodes.unauthorized, requestId: "request-1" } },
    })
  })

  it("creates a typed movie not found response", async () => {
    const response = createMovieNotFoundResponse({ requestId: "request-1" })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 404,
      body: { error: { code: apiErrorCodes.movieNotFound, requestId: "request-1" } },
    })
  })

  it("creates a typed invalid review id response", async () => {
    const response = createInvalidReviewIdResponse({ requestId: "request-1" })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidReviewId, requestId: "request-1" } },
    })
  })

  it("creates a typed review not found response", async () => {
    const response = createReviewNotFoundResponse({ requestId: "request-1" })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 404,
      body: { error: { code: apiErrorCodes.reviewNotFound, requestId: "request-1" } },
    })
  })

  it("creates a typed duplicate review response", async () => {
    const response = createDuplicateReviewResponse({ requestId: "request-1" })

    await expect(readResponse(response)).resolves.toEqual({
      status: 409,
      body: {
        error: {
          code: apiErrorCodes.duplicateReview,
          message: "이미 이 영화에 리뷰를 작성했습니다.",
          requestId: "request-1",
        },
      },
    })
  })

  it("creates a typed 500 failure response without accepting a status from callers", async () => {
    const response = createApiFailureResponse({
      requestId: "request-1",
      code: apiErrorCodes.movieListFailed,
      message: "영화 목록을 조회하지 못했습니다.",
    })

    await expect(readResponse(response)).resolves.toEqual({
      status: 500,
      body: {
        error: {
          code: apiErrorCodes.movieListFailed,
          message: "영화 목록을 조회하지 못했습니다.",
          requestId: "request-1",
        },
      },
    })
  })

  it("creates a typed recommendation chat vector search failure response", async () => {
    const response = createApiFailureResponse({
      requestId: "request-1",
      code: apiErrorCodes.recommendationChatVectorSearchFailed,
      message: "추천 후보를 조회하지 못했습니다.",
    })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 500,
      body: {
        error: {
          code: apiErrorCodes.recommendationChatVectorSearchFailed,
          requestId: "request-1",
        },
      },
    })
  })
})

async function readResponse(response: Response) {
  return {
    status: response.status,
    body: await response.json(),
  }
}
