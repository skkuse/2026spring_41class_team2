import { z } from "zod"

export const recommendationChatInitialQuestionsResponseSchema = z.object({
  questions: z.array(z.string().min(1)).length(6),
})

export const recommendationChatDebugQuestionSchema = z.object({
  id: z.string().uuid(),
  text: z.string().trim().min(1).max(1000),
  isBuggy: z.boolean(),
  createdAt: z.string(),
})

export const listRecommendationChatDebugQuestionsResponseSchema = z.object({
  questions: z.array(recommendationChatDebugQuestionSchema),
})

export const createRecommendationChatDebugQuestionRequestSchema = z.object({
  text: z.string().trim().min(1).max(1000),
})

export const createRecommendationChatDebugQuestionResponseSchema = z.object({
  question: recommendationChatDebugQuestionSchema,
})

export const updateRecommendationChatDebugQuestionRequestSchema = z.object({
  isBuggy: z.boolean(),
})

export const updateRecommendationChatDebugQuestionResponseSchema = z.object({
  question: recommendationChatDebugQuestionSchema,
})

export const submitRecommendationChatMessageRequestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
})

export const runRecommendationChatDebugRequestSchema = submitRecommendationChatMessageRequestSchema

export const recommendationChatRangeSchema = z
  .object({
    from: z.number().int().nullable(),
    to: z.number().int().nullable(),
  })
  .refine((value) => value.from === null || value.to === null || value.from <= value.to)

const recommendationChatUserTagQuerySchema = z
  .object({
    userTag: z.string().trim().min(1),
    embeddingTerms: z.array(z.string().trim().min(1)).length(7),
  })
  .refine((value) => value.embeddingTerms[0] === value.userTag)

export const recommendationChatAnalysisSchema = z.object({
  intent: z.enum(["new_recommendation", "refine_recommendation", "unsupported"]),
  genreIds: z.array(z.number().int()),
  countryCodes: z.array(z.string().min(1)),
  languageCodes: z.array(z.string().min(1)),
  yearRange: recommendationChatRangeSchema.nullable(),
  runtimeRange: recommendationChatRangeSchema
    .refine((value) => value.from === null || value.from >= 0)
    .refine((value) => value.to === null || value.to >= 0)
    .nullable(),
  userTagQueries: z.array(recommendationChatUserTagQuerySchema).max(10),
  excludedTerms: z.array(z.string().trim().min(1)).max(20),
  confidence: z.number().min(0).max(1),
}).strict()

export const recommendationChatReasonResponseSchema = z.object({
  reasons: z.array(
    z.object({
      movieId: z.number().int(),
      reason: z.string().trim().min(1).max(500),
    }),
  ),
})

export const recommendationChatMovieSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  year: z.number().int().nullable(),
  rating: z.number(),
  genres: z.array(z.object({ id: z.number().int(), name: z.string() })),
  posterUrl: z.string().nullable(),
  reason: z.string(),
})

export const recommendationChatMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["request", "response"]),
  content: z.string(),
  createdAt: z.string(),
  movies: z.array(recommendationChatMovieSchema),
})

export const submitRecommendationChatMessageResponseSchema = z.object({
  conversationId: z.string().uuid(),
  answer: z.string(),
  movies: z.array(recommendationChatMovieSchema),
})

export const getRecommendationChatConversationResponseSchema = z.object({
  conversationId: z.string().uuid().nullable(),
  messages: z.array(recommendationChatMessageSchema),
})

export const recommendationChatMappedTagSchema = z.object({
  userTag: z.string(),
  tagId: z.number().int(),
  tag: z.string(),
  relevance: z.number(),
})

export const recommendationChatDebugTraceSchema = z.object({
  availableOptions: z
    .object({
      genres: z.array(z.object({ id: z.number().int(), name: z.string(), nameKo: z.string().nullable() })),
      countries: z.array(z.object({ code: z.string() })),
      languages: z.array(z.object({ code: z.string() })),
    })
    .nullable(),
  recentExchanges: z.array(
    z.object({
      request: z.string(),
      response: z.string(),
      movies: z.array(z.object({ id: z.number().int(), title: z.string() })),
    }),
  ),
  excludedMovieIds: z.array(z.number().int()),
  rawAnalysis: recommendationChatAnalysisSchema.nullable(),
  normalizedAnalysis: recommendationChatAnalysisSchema.nullable(),
  filters: z
    .object({
      genreIds: z.array(z.number().int()),
      countryCodes: z.array(z.string()),
      languageCodes: z.array(z.string()),
      yearRange: recommendationChatRangeSchema.nullable(),
      runtimeRange: recommendationChatRangeSchema.nullable(),
    })
    .nullable(),
  embeddingInputs: z.array(z.string()),
  mappedTagsByUserTag: z.record(z.array(recommendationChatMappedTagSchema)),
  candidateQueryType: z.enum(["tagged", "tagless"]).nullable(),
  candidateCount: z.number().int().nullable(),
  selectedMovies: z.array(
    z.object({
      id: z.number().int(),
      title: z.string(),
      year: z.number().int().nullable(),
      matchedUserTags: z.array(z.string()),
    }),
  ),
  generatedReasons: z.record(z.string()),
  answer: z.string().nullable(),
  movies: z.array(recommendationChatMovieSchema),
  failureStage: z
    .enum([
      "auth",
      "unsupported",
      "conversation",
      "context",
      "analysis",
      "embedding",
      "tag_mapping",
      "candidate_query",
      "reason_generation",
      "persistence",
      "response_validation",
      "unknown",
    ])
    .nullable(),
  error: z
    .object({
      name: z.string(),
      message: z.string(),
      cause: z.array(z.object({ name: z.string(), message: z.string() })).optional(),
    })
    .nullable(),
})

export const runRecommendationChatDebugResponseSchema = z.object({
  conversationId: z.string().uuid().nullable(),
  status: z.enum(["success", "unsupported", "no_candidate", "error"]),
  trace: recommendationChatDebugTraceSchema,
})

export type RecommendationChatAnalysisSchema = z.infer<typeof recommendationChatAnalysisSchema>
