import "server-only"

import { buildTmdbImageUrl, calculateMovieRating } from "@/server/movies/movie-rules"
import type { RequestContext } from "@/server/auth/auth-types"
import {
  RecommendationChatEmbeddingApiError,
  RecommendationChatLlmApiError,
  RecommendationChatPersistenceError,
  RecommendationChatVectorSearchError,
  UnauthorizedRecommendationChatError,
} from "./recommendation-chat-errors"
import { createOpenAiRecommendationChatEmbeddingClient } from "./recommendation-chat-openai-embedding-client"
import { createOpenAiRecommendationChatLlmClient } from "./recommendation-chat-openai-llm-client"
import { createRecommendationChatRepository } from "./recommendation-chat-repository"
import {
  buildCandidateQueryFailedRecommendationChatAnswer,
  buildRecommendationChatAnswer,
  buildTagMappingFailedRecommendationChatAnswer,
  buildUnsupportedRecommendationChatAnswer,
  FINAL_RECOMMENDATION_LIMIT,
  MAX_USER_TAGS,
  selectMappedTags,
  selectRecommendationMovies,
  USER_TAG_MAPPING_LIMIT,
} from "./recommendation-chat-rules"
import type {
  AvailableRecommendationChatOptions,
  RecommendationChatAnalysis,
  RecommendationChatCandidate,
  RecommendationChatEmbeddingClient,
  RecommendationChatDebugFailureStage,
  RecommendationChatDebugTraceDto,
  RecommendationChatLlmClient,
  RecommendationChatMappedTag,
  RecommendationChatMovieDto,
  RecommendationChatRepository,
  RecommendationChatService,
  RecommendationChatStoredMovieRepoResult,
  SubmitRecommendationChatMessageInput,
} from "./recommendation-chat-types"

export const RECOMMENDATION_CHAT_INITIAL_QUESTIONS = [
  "잔잔하고 여운 남는 일본 로맨스 영화 추천해줘",
  "좀비가 등장하는 숨 막히는 공포 영화 추천해줘",
  "어두운 범죄 스릴러 중에 분위기 묵직한 거 추천해줘",
  "우주 배경의 SF 모험 영화 찾아줘",
  "가볍고 웃긴 코미디 영화 추천해줘",
  "러닝타임 2시간 이하 코미디 추천해줘",
]

export const RECOMMENDATION_CHAT_EMBEDDING_MODEL =
  process.env.OPENAI_RECOMMENDATION_CHAT_EMBEDDING_MODEL ?? "text-embedding-3-small"

const FORBIDDEN_USER_TAG_QUERY_TERMS = [
  "친구랑",
  "친구와",
  "심심할 때",
  "저녁에",
  "OTT",
  "아무거나",
  "볼만한",
  "볼 만한",
  "내 스타일",
  "영화",
  "작품",
  "태그",
  "추천",
  "취향",
  "보고 싶은",
  "찾는",
  "제외",
  "싫은",
  "피하고 싶은",
]

const FALLBACK_RECOMMENDATION_REASON = "요청하신 조건과 잘 어울리는 영화라 추천드려요."

export type RecommendationChatServiceDeps = {
  repository: RecommendationChatRepository
  llmClient: RecommendationChatLlmClient
  embeddingClient: RecommendationChatEmbeddingClient
}

export function createRecommendationChatService(deps: RecommendationChatServiceDeps): RecommendationChatService {
  return {
    listInitialQuestions() {
      return { questions: RECOMMENDATION_CHAT_INITIAL_QUESTIONS }
    },

    async listDebugQuestions() {
      const questions = await deps.repository.listDebugQuestions()
      return {
        questions: questions.map((question) => ({
          id: question.id,
          text: question.text,
          isBuggy: question.isBuggy,
          createdAt: question.createdAt.toISOString(),
        })),
      }
    },

    async createDebugQuestion(input) {
      const question = await deps.repository.insertDebugQuestion({ text: input.text })
      return {
        question: {
          id: question.id,
          text: question.text,
          isBuggy: question.isBuggy,
          createdAt: question.createdAt.toISOString(),
        },
      }
    },

    async updateDebugQuestion(input) {
      const question = await deps.repository.updateDebugQuestion(input)
      if (!question) {
        throw new RecommendationChatPersistenceError("Recommendation chat debug question not found.")
      }
      return {
        question: {
          id: question.id,
          text: question.text,
          isBuggy: question.isBuggy,
          createdAt: question.createdAt.toISOString(),
        },
      }
    },

    async deleteDebugQuestion(input) {
      await deps.repository.deleteDebugQuestion(input)
    },

    async getMyRecommendationChatConversation(context: RequestContext) {
      const userId = requireUserId(context)
      const conversation = await deps.repository.findConversationByUserId({ userId })
      if (!conversation) {
        return { conversationId: null, messages: [] }
      }

      const messages = await deps.repository.getConversationMessages({ conversationId: conversation.id })
      return {
        conversationId: conversation.id,
        messages: messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          movies: message.movies.map(mapStoredMovieDto),
        })),
      }
    },

    async resetMyRecommendationChatConversation(context: RequestContext) {
      const userId = requireUserId(context)
      await deps.repository.deleteConversationByUserId({ userId })
      return { conversationId: null, messages: [] }
    },

    async submitRecommendationChatMessage(context: RequestContext, input: SubmitRecommendationChatMessageInput) {
      const result = await executeRecommendationChatMessage(deps, context, input)
      return {
        conversationId: result.conversationId,
        answer: result.trace.answer ?? "",
        movies: result.trace.movies,
      }
    },

    async runDebugRecommendationChatMessage(context: RequestContext, input: SubmitRecommendationChatMessageInput) {
      try {
        return await executeRecommendationChatMessage(deps, context, input)
      } catch (error) {
        if (error instanceof UnauthorizedRecommendationChatError) {
          throw error
        }

        const debugError = error as Error & {
          debugConversationId?: string | null
          debugTrace?: RecommendationChatDebugTraceDto
        }

        return {
          conversationId: debugError.debugConversationId ?? null,
          status: "error",
          trace: debugError.debugTrace ?? {
            ...createEmptyDebugTrace(),
            failureStage: toFailureStage(error),
            error: toDebugError(error),
          },
        }
      }
    },
  }
}

function requireUserId(context: RequestContext) {
  if (!context.user) {
    throw new UnauthorizedRecommendationChatError()
  }

  return context.user.id
}

async function executeRecommendationChatMessage(
  deps: RecommendationChatServiceDeps,
  context: RequestContext,
  input: SubmitRecommendationChatMessageInput,
) {
  const trace = createEmptyDebugTrace()
  let conversationId: string | null = null

  try {
    const userId = requireUserId(context)

    const conversation = await deps.repository.findOrCreateConversation({ userId })
    conversationId = conversation.id

    await persist(() => deps.repository.insertRequestMessage({ conversationId: conversation.id, content: input.message }))

    const [availableOptions, recentExchanges, excludedMovieIds] = await Promise.all([
      deps.repository.listAvailableOptions(),
      deps.repository.listRecentRecommendationExchanges({ conversationId: conversation.id, limit: 3 }),
      deps.repository.listRecommendedMovieIds({ conversationId: conversation.id }),
    ])
    trace.availableOptions = availableOptions
    trace.recentExchanges = recentExchanges
    trace.excludedMovieIds = [...excludedMovieIds]

    const analysis = await analyzeRequest(deps.llmClient, {
      currentMessage: input.message,
      availableOptions,
      recentExchanges,
    })
    trace.rawAnalysis = analysis

    const normalizedAnalysis = normalizeAnalysis(analysis, availableOptions)
    if (normalizedAnalysis.intent !== "unsupported" && !hasRecommendationConditions(normalizedAnalysis)) {
      normalizedAnalysis.intent = "unsupported"
    }
    trace.normalizedAnalysis = normalizedAnalysis

    if (normalizedAnalysis.intent === "unsupported") {
      const answer = buildUnsupportedRecommendationChatAnswer()
      trace.answer = answer
      trace.failureStage = "unsupported"
      await persist(() =>
        deps.repository.insertResponseMessage({
          conversationId: conversation.id,
          content: answer,
          analysisResult: normalizedAnalysis,
        }),
      )
      return { conversationId: conversation.id, status: "unsupported" as const, trace }
    }

    const tagMapping = await mapUserTags(deps, normalizedAnalysis)
    trace.embeddingInputs = tagMapping.embeddingInputs
    trace.mappedTagsByUserTag = mapToRecord(tagMapping.mappedTagsByUserTag)
    if (normalizedAnalysis.userTagQueries.length > 0 && tagMapping.mappedTagsByUserTag.size === 0) {
      const answer = buildTagMappingFailedRecommendationChatAnswer()
      trace.answer = answer
      trace.failureStage = "tag_mapping"
      await persist(() =>
        deps.repository.insertResponseMessage({
          conversationId: conversation.id,
          content: answer,
          analysisResult: normalizedAnalysis,
        }),
      )
      return { conversationId: conversation.id, status: "no_candidate" as const, trace }
    }

    const filters = toFilters(normalizedAnalysis)
    trace.filters = filters
    trace.candidateQueryType = tagMapping.mappedTagsByUserTag.size > 0 ? "tagged" : "tagless"
    const candidates =
      tagMapping.mappedTagsByUserTag.size > 0
        ? await listTaggedCandidates(deps.repository, {
            filters,
            mappedTagIds: uniqueMappedTagIds(tagMapping.mappedTagsByUserTag),
            excludedMovieIds: [...excludedMovieIds],
          })
        : await deps.repository.listTaglessCandidates({
            filters,
            excludedMovieIds: [...excludedMovieIds],
            limit: FINAL_RECOMMENDATION_LIMIT,
          })
    trace.candidateCount = candidates.length

    if (candidates.length === 0) {
      const answer = buildCandidateQueryFailedRecommendationChatAnswer()
      trace.answer = answer
      trace.failureStage = "candidate_query"
      await persist(() =>
        deps.repository.insertResponseMessage({
          conversationId: conversation.id,
          content: answer,
          analysisResult: normalizedAnalysis,
        }),
      )
      return { conversationId: conversation.id, status: "no_candidate" as const, trace }
    }

    const selectedMovies = selectRecommendationMovies({
      candidates,
      mappedTagsByUserTag: tagMapping.mappedTagsByUserTag,
    })
    trace.selectedMovies = selectedMovies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      year: movie.releaseYear,
      matchedUserTags: movie.matchedUserTags,
    }))

    const reasons = await generateReasons(deps.llmClient, input.message, normalizedAnalysis, selectedMovies)
    trace.generatedReasons = Object.fromEntries([...reasons.entries()].map(([movieId, reason]) => [String(movieId), reason]))
    const answer = buildRecommendationChatAnswer()
    trace.answer = answer

    const responseMessage = await persist(() =>
      deps.repository.insertResponseMessage({
        conversationId: conversation.id,
        content: answer,
        analysisResult: normalizedAnalysis,
      }),
    )
    await persist(() =>
      deps.repository.insertRecommendedMovies({
        messageId: responseMessage.id,
        movies: selectedMovies.map((movie, index) => ({
          movieId: movie.id,
          rank: index + 1,
          reason: reasons.get(movie.id)!,
        })),
      }),
    )

    trace.movies = selectedMovies.map((movie) => mapSelectedMovieDto(movie, reasons.get(movie.id)!))
    return { conversationId: conversation.id, status: "success" as const, trace }
  } catch (error) {
    trace.failureStage = toFailureStage(error)
    trace.error = toDebugError(error)
    if (error instanceof UnauthorizedRecommendationChatError) {
      trace.failureStage = "auth"
    }
    ;(error as Error & { debugConversationId?: string | null; debugTrace?: RecommendationChatDebugTraceDto }).debugConversationId =
      conversationId
    ;(error as Error & { debugTrace?: RecommendationChatDebugTraceDto }).debugTrace = trace
    throw error
  }
}

function createEmptyDebugTrace(): RecommendationChatDebugTraceDto {
  return {
    availableOptions: null,
    recentExchanges: [],
    excludedMovieIds: [],
    rawAnalysis: null,
    normalizedAnalysis: null,
    filters: null,
    embeddingInputs: [],
    mappedTagsByUserTag: {},
    candidateQueryType: null,
    candidateCount: null,
    selectedMovies: [],
    generatedReasons: {},
    answer: null,
    movies: [],
    failureStage: null,
    error: null,
  }
}

async function analyzeRequest(
  llmClient: RecommendationChatLlmClient,
  input: Parameters<RecommendationChatLlmClient["analyzeRequest"]>[0],
) {
  try {
    return await llmClient.analyzeRequest(input)
  } catch (error) {
    throw error instanceof RecommendationChatLlmApiError ? error : new RecommendationChatLlmApiError("analysis", error)
  }
}

async function persist<T>(operation: () => Promise<T>) {
  try {
    return await operation()
  } catch (error) {
    throw error instanceof RecommendationChatPersistenceError ? error : new RecommendationChatPersistenceError(error)
  }
}

async function mapUserTags(deps: RecommendationChatServiceDeps, analysis: RecommendationChatAnalysis) {
  const userTagQueries = analysis.userTagQueries.slice(0, MAX_USER_TAGS)
  const userTags = userTagQueries.map((query) => query.userTag)
  const embeddingInputs = userTagQueries.map((query) => query.embeddingTerms.join(" "))
  const mappedTagsByUserTag = new Map<string, RecommendationChatMappedTag[]>()
  if (userTagQueries.length === 0) {
    return { embeddingInputs, mappedTagsByUserTag }
  }

  let embeddings: number[][]
  try {
    embeddings = await deps.embeddingClient.embedUserTagQueries({
      embeddingInputs,
      embeddingModel: RECOMMENDATION_CHAT_EMBEDDING_MODEL,
    })
  } catch (error) {
    throw error instanceof RecommendationChatEmbeddingApiError
      ? error
      : new RecommendationChatEmbeddingApiError(error)
  }

  try {
    const mappingResults = await Promise.all(
      embeddings.map((embedding) =>
        deps.repository.listTagMappingTopN({
          embedding,
          embeddingModel: RECOMMENDATION_CHAT_EMBEDDING_MODEL,
          limit: USER_TAG_MAPPING_LIMIT,
        }),
      ),
    )
    const mappedTags = selectMappedTags({ userTags, mappingResults })
    for (const mappedTag of mappedTags) {
      const tags = mappedTagsByUserTag.get(mappedTag.userTag) ?? []
      tags.push(mappedTag)
      mappedTagsByUserTag.set(mappedTag.userTag, tags)
    }
    return { embeddingInputs, mappedTagsByUserTag }
  } catch (error) {
    throw error instanceof RecommendationChatVectorSearchError
      ? error
      : new RecommendationChatVectorSearchError(error)
  }
}

async function listTaggedCandidates(
  repository: RecommendationChatRepository,
  input: Parameters<RecommendationChatRepository["listTaggedCandidates"]>[0],
) {
  try {
    return await repository.listTaggedCandidates(input)
  } catch (error) {
    throw error instanceof RecommendationChatVectorSearchError
      ? error
      : new RecommendationChatVectorSearchError(error)
  }
}

async function generateReasons(
  llmClient: RecommendationChatLlmClient,
  currentMessage: string,
  conditions: RecommendationChatAnalysis,
  selectedMovies: ReturnType<typeof selectRecommendationMovies>,
) {
  try {
    return await generateReasonsOnce(llmClient, currentMessage, conditions, selectedMovies)
  } catch {
    return buildFallbackReasons(selectedMovies)
  }
}

async function generateReasonsOnce(
  llmClient: RecommendationChatLlmClient,
  currentMessage: string,
  conditions: RecommendationChatAnalysis,
  selectedMovies: ReturnType<typeof selectRecommendationMovies>,
) {
  try {
    const result = await llmClient.generateMovieReasons({
      currentMessage,
      conditions,
      selectedMovies: selectedMovies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        year: movie.releaseYear,
        genres: movie.genres.map((genre) => genre.name),
        overview: movie.overview,
        matchedUserTags: movie.matchedUserTags,
      })),
    })
    const selectedMovieIds = new Set(selectedMovies.map((movie) => movie.id))
    const reasons = new Map<number, string>()

    for (const reason of result.reasons) {
      if (!selectedMovieIds.has(reason.movieId)) {
        throw new RecommendationChatLlmApiError(
          "reason_generation",
          new Error(`Reason response included unexpected movieId: ${reason.movieId}.`),
        )
      }
      reasons.set(reason.movieId, reason.reason)
    }

    if (reasons.size !== selectedMovieIds.size) {
      const missingMovieIds = [...selectedMovieIds].filter((movieId) => !reasons.has(movieId))
      throw new RecommendationChatLlmApiError(
        "reason_generation",
        new Error(`Reason response omitted selected movieIds: ${missingMovieIds.join(", ")}.`),
      )
    }

    return reasons
  } catch (error) {
    throw error instanceof RecommendationChatLlmApiError
      ? error
      : new RecommendationChatLlmApiError("reason_generation", error)
  }
}

function buildFallbackReasons(selectedMovies: ReturnType<typeof selectRecommendationMovies>) {
  return new Map(selectedMovies.map((movie) => [movie.id, FALLBACK_RECOMMENDATION_REASON]))
}

function normalizeAnalysis(analysis: RecommendationChatAnalysis, availableOptions: AvailableRecommendationChatOptions) {
  // LLM이 임의 값을 만들 수 있으므로 DB에서 조회한 선택 가능 목록만 허용한다.
  const genreIds = new Set(availableOptions.genres.map((genre) => genre.id))
  const countryCodes = new Set(availableOptions.countries.map((country) => country.code))
  const languageCodes = new Set(availableOptions.languages.map((language) => language.code))

  return {
    ...analysis,
    genreIds: analysis.genreIds.filter((id) => genreIds.has(id)),
    countryCodes: analysis.countryCodes.filter((code) => countryCodes.has(code)),
    languageCodes: analysis.languageCodes.filter((code) => languageCodes.has(code)),
    userTagQueries: analysis.userTagQueries
      // 사용자 태그와 embedding term의 앞뒤 공백을 제거하고 빈 term은 버린다.
      .map((query) => ({
        userTag: query.userTag.trim(),
        embeddingTerms: query.embeddingTerms.map((term) => term.trim()).filter(Boolean),
      }))
      // Cinemate 태그 매핑에 쓸 수 있는 형식과 콘텐츠 속성 표현만 남긴다.
      .filter(
        (query) =>
          query.userTag &&
          query.embeddingTerms.length === 7 &&
          query.embeddingTerms[0] === query.userTag &&
          !containsForbiddenUserTagQueryTerm(query.userTag) &&
          query.embeddingTerms.every((term) => !containsForbiddenUserTagQueryTerm(term)),
      )
      // 한 요청에서 태그 매핑 비용과 후보 점수화 범위를 제한한다.
      .slice(0, MAX_USER_TAGS),
  }
}

function containsForbiddenUserTagQueryTerm(value: string) {
  const normalizedValue = value.toLocaleLowerCase()
  return FORBIDDEN_USER_TAG_QUERY_TERMS.some((term) => normalizedValue.includes(term.toLocaleLowerCase()))
}

function toFilters(analysis: RecommendationChatAnalysis) {
  return {
    genreIds: analysis.genreIds,
    countryCodes: analysis.countryCodes,
    languageCodes: analysis.languageCodes,
    yearRange: analysis.yearRange,
    runtimeRange: analysis.runtimeRange,
  }
}

function hasRecommendationConditions(analysis: RecommendationChatAnalysis) {
  return (
    analysis.genreIds.length > 0 ||
    analysis.countryCodes.length > 0 ||
    analysis.languageCodes.length > 0 ||
    analysis.yearRange !== null ||
    analysis.runtimeRange !== null ||
    analysis.userTagQueries.length > 0
  )
}

function uniqueMappedTagIds(mappedTagsByUserTag: Map<string, RecommendationChatMappedTag[]>) {
  return [...new Set([...mappedTagsByUserTag.values()].flat().map((tag) => tag.tagId))]
}

function mapToRecord(mappedTagsByUserTag: Map<string, RecommendationChatMappedTag[]>) {
  return Object.fromEntries(mappedTagsByUserTag.entries())
}

function toFailureStage(error: unknown): RecommendationChatDebugFailureStage {
  if (error instanceof UnauthorizedRecommendationChatError) {
    return "auth"
  }
  if (error instanceof RecommendationChatLlmApiError) {
    return error.failureStage
  }
  if (error instanceof RecommendationChatEmbeddingApiError) {
    return "embedding"
  }
  if (error instanceof RecommendationChatVectorSearchError) {
    return "candidate_query"
  }
  if (error instanceof RecommendationChatPersistenceError) {
    return "persistence"
  }

  return "unknown"
}

function toDebugError(error: unknown) {
  if (error instanceof Error) {
    const cause = toDebugErrorCause(error)
    return {
      name: error.name,
      message: error.message,
      ...(cause.length === 0 ? {} : { cause }),
    }
  }

  return { name: "Error", message: "Unknown error" }
}

function toDebugErrorCause(error: Error) {
  const cause: { name: string; message: string }[] = []
  let currentCause = error.cause

  while (cause.length < 3 && currentCause !== undefined) {
    if (currentCause instanceof Error) {
      cause.push({ name: currentCause.name, message: currentCause.message })
      currentCause = currentCause.cause
      continue
    }

    cause.push({ name: typeof currentCause, message: stringifyDebugCause(currentCause) })
    break
  }

  return cause
}

function stringifyDebugCause(cause: unknown) {
  if (typeof cause === "string") {
    return cause
  }

  try {
    return JSON.stringify(cause)
  } catch {
    return String(cause)
  }
}

function mapSelectedMovieDto(movie: RecommendationChatCandidate, reason: string): RecommendationChatMovieDto {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.releaseYear,
    rating: calculateMovieRating(movie),
    genres: movie.genres,
    posterUrl: buildTmdbImageUrl(movie.posterPath, "w500"),
    reason,
  }
}

function mapStoredMovieDto(movie: RecommendationChatStoredMovieRepoResult): RecommendationChatMovieDto {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.releaseYear,
    rating: calculateMovieRating(movie),
    genres: movie.genres,
    posterUrl: buildTmdbImageUrl(movie.posterPath, "w500"),
    reason: movie.reason,
  }
}

export const recommendationChatService = createRecommendationChatService({
  repository: createRecommendationChatRepository(),
  llmClient: createOpenAiRecommendationChatLlmClient(),
  embeddingClient: createOpenAiRecommendationChatEmbeddingClient(),
})
