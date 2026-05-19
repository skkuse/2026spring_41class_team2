import "server-only"

import { z } from "zod"

import { apiErrorCodes } from "./error-codes"

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      apiErrorCodes.invalidQuery,
      apiErrorCodes.invalidMovieId,
      apiErrorCodes.invalidReviewId,
      apiErrorCodes.unauthorized,
      apiErrorCodes.movieNotFound,
      apiErrorCodes.reviewNotFound,
      apiErrorCodes.duplicateReview,
      apiErrorCodes.movieListFailed,
      apiErrorCodes.movieDetailFailed,
      apiErrorCodes.genreListFailed,
      apiErrorCodes.bookmarkedMoviesFailed,
      apiErrorCodes.bookmarkMutationFailed,
      apiErrorCodes.movieReviewsFailed,
      apiErrorCodes.createReviewFailed,
      apiErrorCodes.reviewLikeFailed,
      apiErrorCodes.myReviewsFailed,
      apiErrorCodes.profileSyncFailed,
    ]),
    message: z.string(),
    requestId: z.string(),
    details: z.unknown().optional(),
  }),
})
