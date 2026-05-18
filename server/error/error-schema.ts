import "server-only"

import { z } from "zod"

import { apiErrorCodes } from "./error-codes"

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      apiErrorCodes.invalidQuery,
      apiErrorCodes.invalidMovieId,
      apiErrorCodes.unauthorized,
      apiErrorCodes.movieNotFound,
      apiErrorCodes.movieListFailed,
      apiErrorCodes.movieDetailFailed,
      apiErrorCodes.genreListFailed,
      apiErrorCodes.bookmarkedMoviesFailed,
      apiErrorCodes.bookmarkMutationFailed,
      apiErrorCodes.profileSyncFailed,
    ]),
    message: z.string(),
    requestId: z.string(),
    details: z.unknown().optional(),
  }),
})
