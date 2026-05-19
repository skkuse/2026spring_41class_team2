import "server-only"

export const apiErrorCodes = {
  invalidQuery: "invalid_query",
  invalidBody: "invalid_body",
  invalidMovieId: "invalid_movie_id",
  invalidReviewId: "invalid_review_id",
  unauthorized: "unauthorized",
  movieNotFound: "movie_not_found",
  reviewNotFound: "review_not_found",
  duplicateReview: "duplicate_review",
  movieListFailed: "movie_list_failed",
  movieDetailFailed: "movie_detail_failed",
  genreListFailed: "genre_list_failed",
  bookmarkedMoviesFailed: "bookmarked_movies_failed",
  bookmarkMutationFailed: "bookmark_mutation_failed",
  movieReviewsFailed: "movie_reviews_failed",
  createReviewFailed: "create_review_failed",
  reviewLikeFailed: "review_like_failed",
  myReviewsFailed: "my_reviews_failed",
  profileSyncFailed: "profile_sync_failed",
  onboardingPreferencesFailed: "onboarding_preferences_failed",
} as const

export type ApiErrorCode = typeof apiErrorCodes[keyof typeof apiErrorCodes]
