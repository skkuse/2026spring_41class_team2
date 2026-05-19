import { describe, expect, it, vi } from "vitest"
import {
  ReviewsApiError,
  createMovieReview,
  getMovieReviews,
  getMyReviews,
  toggleReviewLike,
} from "./reviews-client"

describe("getMovieReviews", () => {
  it("requests movie reviews with page, size, and sort", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ reviews: [], totalCount: 0 }))

    await expect(getMovieReviews({ movieId: 550, page: 1, size: 20, sort: "latest" }, fetchImpl)).resolves.toEqual({
      reviews: [],
      totalCount: 0,
    })
    expect(fetchImpl).toHaveBeenCalledWith("/api/movies/550/reviews?page=1&size=20&sort=latest", { cache: "no-store" })
  })
})

describe("createMovieReview", () => {
  it("posts a JSON review body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ reviewId: "123e4567-e89b-12d3-a456-426614174000", rating: 4.5, content: "좋았어요", date: "2026-05-01" }),
    )

    await expect(createMovieReview(550, { rating: 4.5, content: "좋았어요" }, fetchImpl)).resolves.toMatchObject({
      rating: 4.5,
      content: "좋았어요",
    })
    expect(fetchImpl).toHaveBeenCalledWith("/api/movies/550/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating: 4.5, content: "좋았어요" }),
    })
  })

  it("throws a typed conflict error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        { error: { code: "duplicate_review", message: "이미 작성했습니다.", requestId: "request-1" } },
        { status: 409 },
      ),
    )

    await expect(createMovieReview(550, { rating: 4.5, content: "좋았어요" }, fetchImpl)).rejects.toMatchObject({
      status: 409,
      code: "duplicate_review",
      requestId: "request-1",
      isConflict: true,
    } satisfies Partial<ReviewsApiError>)
  })
})

describe("toggleReviewLike", () => {
  it("uses PUT when the next state is liked", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ reviewId: "123e4567-e89b-12d3-a456-426614174000", likes: 3, isLiked: true }),
    )

    await expect(toggleReviewLike("123e4567-e89b-12d3-a456-426614174000", true, fetchImpl)).resolves.toMatchObject({
      likes: 3,
      isLiked: true,
    })
    expect(fetchImpl).toHaveBeenCalledWith("/api/reviews/123e4567-e89b-12d3-a456-426614174000/like", { method: "PUT" })
  })

  it("uses DELETE when the next state is not liked", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ reviewId: "123e4567-e89b-12d3-a456-426614174000", likes: 2, isLiked: false }),
    )

    await expect(toggleReviewLike("123e4567-e89b-12d3-a456-426614174000", false, fetchImpl)).resolves.toMatchObject({
      likes: 2,
      isLiked: false,
    })
    expect(fetchImpl).toHaveBeenCalledWith("/api/reviews/123e4567-e89b-12d3-a456-426614174000/like", { method: "DELETE" })
  })
})

describe("getMyReviews", () => {
  it("requests my reviews with page and size", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ reviews: [], totalCount: 0 }))

    await expect(getMyReviews({ page: 1, size: 20 }, fetchImpl)).resolves.toEqual({ reviews: [], totalCount: 0 })
    expect(fetchImpl).toHaveBeenCalledWith("/api/me/reviews?page=1&size=20", { cache: "no-store" })
  })

  it("throws a typed auth error on 401", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        { error: { code: "unauthorized", message: "로그인이 필요합니다.", requestId: "request-1" } },
        { status: 401 },
      ),
    )

    await expect(getMyReviews({ page: 1, size: 20 }, fetchImpl)).rejects.toMatchObject({
      status: 401,
      isUnauthorized: true,
    } satisfies Partial<ReviewsApiError>)
  })
})

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json" },
  })
}
