import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import {
  DuplicateReviewError,
  ForbiddenReviewError,
  ReviewMovieNotFoundError,
  ReviewNotFoundError,
  UnauthorizedReviewError,
} from "./review-errors"
import { createReviewService } from "./review-service"
import type { ReviewRepository } from "./review-types"

const guestContext = { requestId: "request-1", user: null }
const userContext = { requestId: "request-1", user: { id: "user-1", email: "user@example.com" } }

describe("reviewService.listMovieReviews", () => {
  it("maps guest reviews with isLiked false", async () => {
    const repository = createRepository({
      listMovieReviews: vi.fn().mockResolvedValue({
        reviews: [
          {
            id: "review-1",
            user: { id: "author-1", name: "작성자", profileImageUrl: null },
            rating: "4.5",
            content: "좋았어요",
            date: new Date("2026-05-01T00:00:00.000Z"),
            likes: 3,
            isLiked: true,
          },
        ],
        totalCount: 1,
      }),
    })
    const service = createReviewService({ repository })

    await expect(service.listMovieReviews(guestContext, { movieId: 550, page: 1, size: 20, sort: "latest" })).resolves.toEqual({
      reviews: [
        {
          id: "review-1",
          user: { id: "author-1", name: "작성자", profileImageUrl: null },
          rating: 4.5,
          content: "좋았어요",
          date: "2026-05-01T00:00:00.000Z",
          likes: 3,
          isLiked: false,
        },
      ],
      totalCount: 1,
    })
  })
})

describe("reviewService.createReview", () => {
  it("requires authentication", async () => {
    const service = createReviewService({ repository: createRepository() })

    await expect(service.createReview(guestContext, { movieId: 550, rating: 4.5, content: "좋았어요" })).rejects.toBeInstanceOf(
      UnauthorizedReviewError,
    )
  })

  it("throws when movie does not exist", async () => {
    const service = createReviewService({ repository: createRepository({ movieExists: vi.fn().mockResolvedValue(false) }) })

    await expect(service.createReview(userContext, { movieId: 404, rating: 4.5, content: "좋았어요" })).rejects.toBeInstanceOf(
      ReviewMovieNotFoundError,
    )
  })

  it("throws when the user already reviewed the movie", async () => {
    const service = createReviewService({
      repository: createRepository({ findReviewByUserAndMovie: vi.fn().mockResolvedValue({ id: "review-1" }) }),
    })

    await expect(service.createReview(userContext, { movieId: 550, rating: 4.5, content: "좋았어요" })).rejects.toBeInstanceOf(
      DuplicateReviewError,
    )
  })

  it("creates a trimmed review and updates stats through the repository", async () => {
    const repository = createRepository()
    const service = createReviewService({ repository })

    await expect(service.createReview(userContext, { movieId: 550, rating: 4.5, content: "  좋았어요  " })).resolves.toEqual({
      reviewId: "review-1",
      rating: 4.5,
      content: "좋았어요",
      date: "2026-05-01T00:00:00.000Z",
    })
    expect(repository.createReviewWithStats).toHaveBeenCalledWith({
      userId: "user-1",
      movieId: 550,
      rating: 4.5,
      content: "좋았어요",
    })
  })
})

describe("reviewService.updateReview", () => {
  it("requires authentication", async () => {
    const service = createReviewService({ repository: createRepository() })
    await expect(service.updateReview(guestContext, { reviewId: "review-1", rating: 3.0, content: "수정" }))
      .rejects.toBeInstanceOf(UnauthorizedReviewError)
  })

  it("throws ReviewNotFoundError when review does not exist", async () => {
    const service = createReviewService({
      repository: createRepository({ findReviewById: vi.fn().mockResolvedValue(null) }),
    })
    await expect(service.updateReview(userContext, { reviewId: "review-1", rating: 3.0, content: "수정" }))
      .rejects.toBeInstanceOf(ReviewNotFoundError)
  })

  it("throws ForbiddenReviewError when user is not the author", async () => {
    const service = createReviewService({
      repository: createRepository({
        findReviewById: vi.fn().mockResolvedValue({ id: "review-1", userId: "other-user", movieId: 550, rating: "4.5" }),
      }),
    })
    await expect(service.updateReview(userContext, { reviewId: "review-1", content: "수정", rating: 3.0 }))
      .rejects.toBeInstanceOf(ForbiddenReviewError)
  })

  it("trims content and calls updateReviewWithStats with the rating delta", async () => {
    const repository = createRepository()
    const service = createReviewService({ repository })

    const result = await service.updateReview(userContext, { reviewId: "review-1", rating: 3.0, content: "  수정된 내용  " })

    expect(result).toEqual({ reviewId: "review-1", rating: 3.0, content: "수정된 내용" })
    expect(repository.updateReviewWithStats).toHaveBeenCalledWith({
      reviewId: "review-1",
      rating: 3.0,
      content: "수정된 내용",
      ratingDelta: 3.0 - 4.5,
      movieId: 550,
    })
  })
})

describe("reviewService.deleteReview", () => {
  it("requires authentication", async () => {
    const service = createReviewService({ repository: createRepository() })
    await expect(service.deleteReview(guestContext, { reviewId: "review-1" }))
      .rejects.toBeInstanceOf(UnauthorizedReviewError)
  })

  it("throws ReviewNotFoundError when review does not exist", async () => {
    const service = createReviewService({
      repository: createRepository({ findReviewById: vi.fn().mockResolvedValue(null) }),
    })
    await expect(service.deleteReview(userContext, { reviewId: "review-1" }))
      .rejects.toBeInstanceOf(ReviewNotFoundError)
  })

  it("throws ForbiddenReviewError when user is not the author", async () => {
    const service = createReviewService({
      repository: createRepository({
        findReviewById: vi.fn().mockResolvedValue({ id: "review-1", userId: "other-user", movieId: 550, rating: "4.5" }),
      }),
    })
    await expect(service.deleteReview(userContext, { reviewId: "review-1" }))
      .rejects.toBeInstanceOf(ForbiddenReviewError)
  })

  it("calls deleteReviewWithStats with old rating and movieId", async () => {
    const repository = createRepository()
    const service = createReviewService({ repository })

    await service.deleteReview(userContext, { reviewId: "review-1" })

    expect(repository.deleteReviewWithStats).toHaveBeenCalledWith({
      reviewId: "review-1",
      oldRating: 4.5,
      movieId: 550,
    })
  })
})

describe("reviewService.setReviewLike", () => {
  it("adds likes idempotently", async () => {
    const repository = createRepository()
    const service = createReviewService({ repository })

    await expect(service.setReviewLike(userContext, { reviewId: "review-1", liked: true })).resolves.toEqual({
      reviewId: "review-1",
      likes: 4,
      isLiked: true,
    })
    expect(repository.likeReview).toHaveBeenCalledWith({ reviewId: "review-1", userId: "user-1" })
  })

  it("throws when review does not exist", async () => {
    const service = createReviewService({ repository: createRepository({ reviewExists: vi.fn().mockResolvedValue(false) }) })

    await expect(service.setReviewLike(userContext, { reviewId: "missing", liked: true })).rejects.toBeInstanceOf(
      ReviewNotFoundError,
    )
  })
})

describe("reviewService.listMyReviews", () => {
  it("requires authentication and maps nullable posters", async () => {
    const repository = createRepository({
      listReviewsByUser: vi.fn().mockResolvedValue({
        reviews: [
          {
            id: "review-1",
            movieId: 550,
            movieTitle: "Fight Club",
            posterPath: null,
            rating: "4.5",
            content: "좋았어요",
            date: new Date("2026-05-01T00:00:00.000Z"),
            likes: 2,
          },
        ],
        totalCount: 1,
      }),
    })
    const service = createReviewService({ repository })

    await expect(service.listMyReviews(userContext, { page: 1, size: 20 })).resolves.toEqual({
      reviews: [
        {
          id: "review-1",
          movieId: 550,
          movieTitle: "Fight Club",
          posterUrl: null,
          rating: 4.5,
          content: "좋았어요",
          date: "2026-05-01T00:00:00.000Z",
          likes: 2,
        },
      ],
      totalCount: 1,
    })
  })
})

function createRepository(overrides: Partial<ReviewRepository> = {}): ReviewRepository {
  return {
    movieExists: vi.fn().mockResolvedValue(true),
    reviewExists: vi.fn().mockResolvedValue(true),
    findReviewByUserAndMovie: vi.fn().mockResolvedValue(null),
    findReviewById: vi.fn().mockResolvedValue({
      id: "review-1",
      userId: "user-1",
      movieId: 550,
      rating: "4.5",
    }),
    listMovieReviews: vi.fn().mockResolvedValue({ reviews: [], totalCount: 0 }),
    createReviewWithStats: vi.fn().mockResolvedValue({
      id: "review-1",
      rating: "4.5",
      content: "좋았어요",
      date: new Date("2026-05-01T00:00:00.000Z"),
    }),
    updateReviewWithStats: vi.fn().mockResolvedValue(undefined),
    deleteReviewWithStats: vi.fn().mockResolvedValue(undefined),
    likeReview: vi.fn().mockResolvedValue(undefined),
    unlikeReview: vi.fn().mockResolvedValue(undefined),
    countReviewLikes: vi.fn().mockResolvedValue(4),
    listReviewsByUser: vi.fn().mockResolvedValue({ reviews: [], totalCount: 0 }),
    ...overrides,
  }
}
