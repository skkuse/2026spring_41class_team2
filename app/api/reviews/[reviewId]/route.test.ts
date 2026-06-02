import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createOptionalRequestContext: vi.fn(),
  createRequestId: vi.fn(),
  reviewService: {
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
  },
}))

vi.mock("server-only", () => ({}))

vi.mock("@/server/auth/request-context", () => ({
  createOptionalRequestContext: mocks.createOptionalRequestContext,
  createRequestId: mocks.createRequestId,
}))

vi.mock("@/server/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock("@/server/reviews", () => ({
  reviewService: mocks.reviewService,
  UnauthorizedReviewError: class UnauthorizedReviewError extends Error { name = "UnauthorizedReviewError" },
  ForbiddenReviewError: class ForbiddenReviewError extends Error { name = "ForbiddenReviewError" },
  ReviewNotFoundError: class ReviewNotFoundError extends Error { name = "ReviewNotFoundError" },
}))

import { apiErrorCodes } from "@/server/error"
import { PATCH, DELETE } from "./route"

const validUuid = "123e4567-e89b-12d3-a456-426614174000"
const context = { requestId: "request-1", user: { id: "user-1", email: "a@b.com" } }

describe("PATCH /api/reviews/{reviewId}", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.createOptionalRequestContext.mockResolvedValue(context)
    mocks.reviewService.updateReview.mockResolvedValue({ reviewId: validUuid, rating: 3.5, content: "수정된 내용" })
  })

  it("returns 400 for invalid reviewId", async () => {
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ rating: 3.5, content: "수정" }) }), { params: Promise.resolve({ reviewId: "not-a-uuid" }) })
    expect(response.status).toBe(400)
  })

  it("returns 400 for invalid body", async () => {
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ rating: 6, content: "" }) }), { params: Promise.resolve({ reviewId: validUuid }) })
    expect(response.status).toBe(400)
  })

  it("passes reviewId and body to reviewService.updateReview", async () => {
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ rating: 3.5, content: "수정된 내용" }) }), { params: Promise.resolve({ reviewId: validUuid }) })
    expect(response.status).toBe(200)
    expect(mocks.reviewService.updateReview).toHaveBeenCalledWith(context, { reviewId: validUuid, rating: 3.5, content: "수정된 내용" })
  })

  it("returns 401 when UnauthorizedReviewError is thrown", async () => {
    const { UnauthorizedReviewError } = await import("@/server/reviews")
    mocks.reviewService.updateReview.mockRejectedValue(new UnauthorizedReviewError())
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ rating: 3.5, content: "수정" }) }), { params: Promise.resolve({ reviewId: validUuid }) })
    expect(response.status).toBe(401)
  })

  it("returns 403 when ForbiddenReviewError is thrown", async () => {
    const { ForbiddenReviewError } = await import("@/server/reviews")
    mocks.reviewService.updateReview.mockRejectedValue(new ForbiddenReviewError(validUuid))
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ rating: 3.5, content: "수정" }) }), { params: Promise.resolve({ reviewId: validUuid }) })
    expect(response.status).toBe(403)
  })

  it("returns 404 when ReviewNotFoundError is thrown", async () => {
    const { ReviewNotFoundError } = await import("@/server/reviews")
    mocks.reviewService.updateReview.mockRejectedValue(new ReviewNotFoundError(validUuid))
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ rating: 3.5, content: "수정" }) }), { params: Promise.resolve({ reviewId: validUuid }) })
    expect(response.status).toBe(404)
  })

  it("returns 500 on unexpected error", async () => {
    mocks.reviewService.updateReview.mockRejectedValue(new Error("DB error"))
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ rating: 3.5, content: "수정" }) }), { params: Promise.resolve({ reviewId: validUuid }) })
    const body = await response.json()
    expect(response.status).toBe(500)
    expect(body.error.code).toBe(apiErrorCodes.updateReviewFailed)
  })
})

describe("DELETE /api/reviews/{reviewId}", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.createOptionalRequestContext.mockResolvedValue(context)
    mocks.reviewService.deleteReview.mockResolvedValue(undefined)
  })

  it("returns 400 for invalid reviewId", async () => {
    const response = await DELETE(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ reviewId: "not-a-uuid" }) })
    expect(response.status).toBe(400)
  })

  it("returns 204 on success", async () => {
    const response = await DELETE(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ reviewId: validUuid }) })
    expect(response.status).toBe(204)
    expect(mocks.reviewService.deleteReview).toHaveBeenCalledWith(context, { reviewId: validUuid })
  })

  it("returns 401 when UnauthorizedReviewError is thrown", async () => {
    const { UnauthorizedReviewError } = await import("@/server/reviews")
    mocks.reviewService.deleteReview.mockRejectedValue(new UnauthorizedReviewError())
    const response = await DELETE(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ reviewId: validUuid }) })
    expect(response.status).toBe(401)
  })

  it("returns 403 when ForbiddenReviewError is thrown", async () => {
    const { ForbiddenReviewError } = await import("@/server/reviews")
    mocks.reviewService.deleteReview.mockRejectedValue(new ForbiddenReviewError(validUuid))
    const response = await DELETE(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ reviewId: validUuid }) })
    expect(response.status).toBe(403)
  })

  it("returns 404 when ReviewNotFoundError is thrown", async () => {
    const { ReviewNotFoundError } = await import("@/server/reviews")
    mocks.reviewService.deleteReview.mockRejectedValue(new ReviewNotFoundError(validUuid))
    const response = await DELETE(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ reviewId: validUuid }) })
    expect(response.status).toBe(404)
  })

  it("returns 500 on unexpected error", async () => {
    mocks.reviewService.deleteReview.mockRejectedValue(new Error("DB error"))
    const response = await DELETE(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ reviewId: validUuid }) })
    const body = await response.json()
    expect(response.status).toBe(500)
    expect(body.error.code).toBe(apiErrorCodes.deleteReviewFailed)
  })
})