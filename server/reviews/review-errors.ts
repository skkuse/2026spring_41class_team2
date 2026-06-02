import "server-only"

export class UnauthorizedReviewError extends Error {
  constructor() {
    super("Authentication is required for reviews")
    this.name = "UnauthorizedReviewError"
  }
}

export class ReviewMovieNotFoundError extends Error {
  constructor(movieId: number) {
    super(`Movie not found: ${movieId}`)
    this.name = "ReviewMovieNotFoundError"
  }
}

export class ReviewNotFoundError extends Error {
  constructor(reviewId: string) {
    super(`Review not found: ${reviewId}`)
    this.name = "ReviewNotFoundError"
  }
}

export class DuplicateReviewError extends Error {
  constructor(movieId: number) {
    super(`Review already exists for movie: ${movieId}`)
    this.name = "DuplicateReviewError"
  }
}

export class ForbiddenReviewError extends Error {
  constructor(reviewId: string) {
    super(`Not allowed to modify review: ${reviewId}`)
    this.name = "ForbiddenReviewError"
  }
}
