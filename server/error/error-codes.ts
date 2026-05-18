import "server-only"

export const apiErrorCodes = {
  invalidQuery: "invalid_query",
  invalidMovieId: "invalid_movie_id",
  unauthorized: "unauthorized",
  movieNotFound: "movie_not_found",
  movieListFailed: "movie_list_failed",
  movieDetailFailed: "movie_detail_failed",
  genreListFailed: "genre_list_failed",
  bookmarkedMoviesFailed: "bookmarked_movies_failed",
  bookmarkMutationFailed: "bookmark_mutation_failed",
  profileSyncFailed: "profile_sync_failed",
} as const

export type ApiErrorCode = typeof apiErrorCodes[keyof typeof apiErrorCodes]
