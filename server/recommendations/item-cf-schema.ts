import { z } from "zod"
import {
  DEFAULT_ITEM_CF_LIMIT_PER_SEED,
  DEFAULT_ITEM_CF_SEED_LIMIT,
  MAX_ITEM_CF_LIMIT_PER_SEED,
  MAX_ITEM_CF_SEED_LIMIT,
  MIN_ITEM_CF_LIMIT_PER_SEED,
  MIN_ITEM_CF_SEED_LIMIT,
} from "./item-cf-rules"

export const itemCfRecommendationsQuerySchema = z
  .object({
    seedLimit: z.coerce
      .number()
      .int()
      .min(MIN_ITEM_CF_SEED_LIMIT)
      .max(MAX_ITEM_CF_SEED_LIMIT)
      .optional()
      .default(DEFAULT_ITEM_CF_SEED_LIMIT),
    limitPerSeed: z.coerce
      .number()
      .int()
      .min(MIN_ITEM_CF_LIMIT_PER_SEED)
      .max(MAX_ITEM_CF_LIMIT_PER_SEED)
      .optional()
      .default(DEFAULT_ITEM_CF_LIMIT_PER_SEED),
  })
  .strict()

export const itemCfGenreSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
})

export const recommendedMovieSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  year: z.number().int().nullable(),
  rating: z.number(),
  genres: z.array(itemCfGenreSchema),
  posterUrl: z.string().url().nullable(),
  reason: z.string(),
  source: z.enum(["item_cf", "fallback"]),
  score: z.number().nullable(),
  coRatingCount: z.number().int().nonnegative().nullable(),
  isBookmarked: z.boolean(),
})

export const recommendationSeedMovieSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  year: z.number().int().nullable(),
  posterUrl: z.string().url().nullable(),
})

export const recommendationSectionSchema = z.object({
  seedMovie: recommendationSeedMovieSchema,
  title: z.string(),
  movies: z.array(recommendedMovieSchema),
})

export const itemCfRecommendationsResponseSchema = z.object({
  sections: z.array(recommendationSectionSchema),
})
