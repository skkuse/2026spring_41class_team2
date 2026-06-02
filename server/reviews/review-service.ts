import "server-only"

import type { RequestContext } from "@/server/auth/auth-types"
import { isPostgresErrorCode } from "@/server/db/postgres-errors"
import { buildTmdbImageUrl } from "@/server/movies/movie-rules"
import {
  DuplicateReviewError,
  ForbiddenReviewError,
  ReviewMovieNotFoundError,
  ReviewNotFoundError,
  UnauthorizedReviewError,
} from "./review-errors"
import { createReviewRepository } from "./review-repository"
import { normalizeReviewContent, normalizeReviewPagination } from "./review-rules"
import type {
  CreateReviewInput,
  CreateReviewResponseDto,
  DeleteReviewInput,
  ListMovieReviewsInput,
  ListMyReviewsInput,
  MovieReviewsResponseDto,
  ReviewRepository,
  ReviewService,
  SetReviewLikeInput,
  UpdateReviewInput,
  UpdateReviewResponseDto,
} from "./review-types"

export type ReviewServiceDeps = {
  repository: ReviewRepository
}

export function createReviewService(deps: ReviewServiceDeps): ReviewService {
  return {
    async listMovieReviews(context: RequestContext, input: ListMovieReviewsInput): Promise<MovieReviewsResponseDto> {
      await ensureMovieExists(deps.repository, input.movieId)
      const pagination = normalizeReviewPagination(input)
      const result = await deps.repository.listMovieReviews({
        movieId: input.movieId,
        currentUserId: context.user?.id ?? null,
        limit: pagination.size,
        offset: pagination.offset,
        sort: input.sort ?? "latest",
      })

      return {
        reviews: result.reviews.map((review) => ({
          id: review.id,
          user: review.user,
          rating: Number(review.rating),
          content: review.content,
          date: review.date.toISOString(),
          likes: review.likes,
          isLiked: context.user ? review.isLiked : false,
        })),
        totalCount: result.totalCount,
      }
    },

    async createReview(context: RequestContext, input: CreateReviewInput): Promise<CreateReviewResponseDto> {
      const userId = requireUserId(context)
      await ensureMovieExists(deps.repository, input.movieId)

      if (await deps.repository.findReviewByUserAndMovie(userId, input.movieId)) {
        throw new DuplicateReviewError(input.movieId)
      }

      const content = normalizeReviewContent(input.content)

      try {
        const created = await deps.repository.createReviewWithStats({
          userId,
          movieId: input.movieId,
          rating: input.rating,
          content,
        })

        return {
          reviewId: created.id,
          rating: Number(created.rating),
          content: created.content,
          date: created.date.toISOString(),
        }
      } catch (error) {
        if (isPostgresErrorCode(error, "23505")) {
          throw new DuplicateReviewError(input.movieId)
        }
        throw error
      }
    },

    async updateReview(context: RequestContext, input: UpdateReviewInput): Promise<UpdateReviewResponseDto> {
      const userId = requireUserId(context)
      const review = await deps.repository.findReviewById(input.reviewId)
      if (!review) {
        throw new ReviewNotFoundError(input.reviewId)
      }
      if (review.userId !== userId) {
        throw new ForbiddenReviewError(input.reviewId)
      }

      const content = normalizeReviewContent(input.content)
      const oldRating = Number(review.rating)
      const ratingDelta = input.rating - oldRating

      await deps.repository.updateReviewWithStats({
        reviewId: input.reviewId,
        rating: input.rating,
        content,
        ratingDelta,
        movieId: review.movieId,
      })

      return { reviewId: input.reviewId, rating: input.rating, content }
    },

    async deleteReview(context: RequestContext, input: DeleteReviewInput): Promise<void> {
      const userId = requireUserId(context)
      const review = await deps.repository.findReviewById(input.reviewId)
      if (!review) {
        throw new ReviewNotFoundError(input.reviewId)
      }
      if (review.userId !== userId) {
        throw new ForbiddenReviewError(input.reviewId)
      }

      await deps.repository.deleteReviewWithStats({
        reviewId: input.reviewId,
        oldRating: Number(review.rating),
        movieId: review.movieId,
      })
    },

    async setReviewLike(context: RequestContext, input: SetReviewLikeInput) {
      const userId = requireUserId(context)
      if (!(await deps.repository.reviewExists(input.reviewId))) {
        throw new ReviewNotFoundError(input.reviewId)
      }

      if (input.liked) {
        await deps.repository.likeReview({ reviewId: input.reviewId, userId })
      } else {
        await deps.repository.unlikeReview({ reviewId: input.reviewId, userId })
      }

      return {
        reviewId: input.reviewId,
        likes: await deps.repository.countReviewLikes(input.reviewId),
        isLiked: input.liked,
      }
    },

    async listMyReviews(context: RequestContext, input: ListMyReviewsInput) {
      const userId = requireUserId(context)
      const pagination = normalizeReviewPagination(input)
      const result = await deps.repository.listReviewsByUser({
        userId,
        limit: pagination.size,
        offset: pagination.offset,
      })

      return {
        reviews: result.reviews.map((review) => ({
          id: review.id,
          movieId: review.movieId,
          movieTitle: review.movieTitle,
          posterUrl: buildTmdbImageUrl(review.posterPath, "w500"),
          rating: Number(review.rating),
          content: review.content,
          date: review.date.toISOString(),
          likes: review.likes,
        })),
        totalCount: result.totalCount,
      }
    },
  }
}

async function ensureMovieExists(repository: ReviewRepository, movieId: number) {
  if (!(await repository.movieExists(movieId))) {
    throw new ReviewMovieNotFoundError(movieId)
  }
}

function requireUserId(context: RequestContext) {
  if (!context.user) {
    throw new UnauthorizedReviewError()
  }

  return context.user.id
}

export const reviewService = createReviewService({
  repository: createReviewRepository(),
})
