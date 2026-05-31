import "server-only"

import { z } from "zod"

import { apiErrorCodes } from "./error-codes"

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      apiErrorCodes.invalidQuery,
      apiErrorCodes.invalidBody,
      apiErrorCodes.invalidMovieId,
      apiErrorCodes.invalidReviewId,
      apiErrorCodes.unauthorized,
      apiErrorCodes.movieNotFound,
      apiErrorCodes.reviewNotFound,
      apiErrorCodes.duplicateReview,
      apiErrorCodes.movieListFailed,
      apiErrorCodes.movieDetailFailed,
      apiErrorCodes.similarMoviesFailed,
      apiErrorCodes.genreListFailed,
      apiErrorCodes.bookmarkedMoviesFailed,
      apiErrorCodes.bookmarkMutationFailed,
      apiErrorCodes.movieReviewsFailed,
      apiErrorCodes.createReviewFailed,
      apiErrorCodes.reviewLikeFailed,
      apiErrorCodes.myReviewsFailed,
      apiErrorCodes.profileSyncFailed,
      apiErrorCodes.onboardingPreferencesFailed,
      apiErrorCodes.onboardingRequired,
      apiErrorCodes.itemCfRecommendationsFailed,
      apiErrorCodes.recommendationChatFailed,
      apiErrorCodes.recommendationChatLlmApiFailed,
      apiErrorCodes.recommendationChatEmbeddingApiFailed,
      apiErrorCodes.recommendationChatVectorSearchFailed,
      apiErrorCodes.characterChatFailed,
      apiErrorCodes.characterChatInvalidCharacter,
      apiErrorCodes.characterChatConversationNotFound,
      apiErrorCodes.characterChatLlmApiFailed,
    ]),
    message: z.string(),
    requestId: z.string(),
    details: z.unknown().optional(),
  }),
})
