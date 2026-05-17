import { z } from "zod"

export const currentUserSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  profileImageUrl: z.string().nullable(),
  onboardingCompleted: z.boolean(),
  bookmarkedMovieCount: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
})

export const meResponseSchema = z.discriminatedUnion("authenticated", [
  z.object({
    authenticated: z.literal(false),
    user: z.null(),
  }),
  z.object({
    authenticated: z.literal(true),
    user: currentUserSummarySchema,
  }),
])

