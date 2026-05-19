import { z } from "zod"
import { movieCardSchema } from "@/server/movies/movie-schema"
import { REQUIRED_PREFERRED_MOVIE_COUNT } from "./onboarding-rules"

export const savePreferredMoviesBodySchema = z.object({
  movieIds: z
    .array(z.number().int().positive())
    .length(REQUIRED_PREFERRED_MOVIE_COUNT)
    .refine((movieIds) => new Set(movieIds).size === movieIds.length, {
      message: "movieIds must be unique",
    }),
})

export const preferredMoviesResponseSchema = z.object({
  movies: z.array(movieCardSchema),
})

export const savePreferredMoviesResponseSchema = z.object({
  movieIds: z.array(z.number().int().positive()).length(REQUIRED_PREFERRED_MOVIE_COUNT),
  onboardingCompleted: z.literal(true),
})
