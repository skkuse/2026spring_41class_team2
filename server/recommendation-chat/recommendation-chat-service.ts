import "server-only"

import { buildTmdbImageUrl, calculateMovieRating } from "@/server/movies/movie-rules"
import type { RequestContext } from "@/server/auth/auth-types"
import {
  RecommendationChatEmbeddingApiError,
  RecommendationChatLlmApiError,
  RecommendationChatVectorSearchError,
  UnauthorizedRecommendationChatError,
} from "./recommendation-chat-errors"
import { createOpenAiRecommendationChatEmbeddingClient } from "./recommendation-chat-openai-embedding-client"
import { createOpenAiRecommendationChatLlmClient } from "./recommendation-chat-openai-llm-client"
import { createRecommendationChatRepository } from "./recommendation-chat-repository"
import {
  buildNoRecommendationChatCandidatesAnswer,
  buildRecommendationChatAnswer,
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
      const userId = requireUserId(context)
      const conversation = await deps.repository.findOrCreateConversation({ userId })
      await deps.repository.insertRequestMessage({ conversationId: conversation.id, content: input.message })

      const [availableOptions, recentExchanges, excludedMovieIds] = await Promise.all([
        deps.repository.listAvailableOptions(),
        deps.repository.listRecentRecommendationExchanges({ conversationId: conversation.id, limit: 3 }),
        deps.repository.listRecommendedMovieIds({ conversationId: conversation.id }),
      ])

      const analysis = await analyzeRequest(deps.llmClient, {
        currentMessage: input.message,
        availableOptions,
        recentExchanges,
      })
      const normalizedAnalysis = normalizeAnalysis(analysis, availableOptions)
      if (normalizedAnalysis.intent !== "unsupported" && !hasRecommendationConditions(normalizedAnalysis)) {
        normalizedAnalysis.intent = "unsupported"
      }

      if (normalizedAnalysis.intent === "unsupported") {
        const answer = buildUnsupportedRecommendationChatAnswer()
        await deps.repository.insertResponseMessage({
          conversationId: conversation.id,
          content: answer,
          analysisResult: normalizedAnalysis,
        })
        return { conversationId: conversation.id, answer, movies: [] }
      }

      const mappedTagsByUserTag = await mapUserTags(deps, normalizedAnalysis)
      if (normalizedAnalysis.userTagQueries.length > 0 && mappedTagsByUserTag.size === 0) {
        const answer = buildNoRecommendationChatCandidatesAnswer()
        await deps.repository.insertResponseMessage({
          conversationId: conversation.id,
          content: answer,
          analysisResult: normalizedAnalysis,
        })
        return { conversationId: conversation.id, answer, movies: [] }
      }

      const filters = toFilters(normalizedAnalysis)
      const candidates =
        mappedTagsByUserTag.size > 0
          ? await listTaggedCandidates(deps.repository, {
              filters,
              mappedTagIds: uniqueMappedTagIds(mappedTagsByUserTag),
              excludedMovieIds: [...excludedMovieIds],
            })
          : await deps.repository.listTaglessCandidates({
              filters,
              excludedMovieIds: [...excludedMovieIds],
              limit: FINAL_RECOMMENDATION_LIMIT,
            })

      if (candidates.length === 0) {
        const answer = buildNoRecommendationChatCandidatesAnswer()
        await deps.repository.insertResponseMessage({
          conversationId: conversation.id,
          content: answer,
          analysisResult: normalizedAnalysis,
        })
        return { conversationId: conversation.id, answer, movies: [] }
      }

      const selectedMovies = selectRecommendationMovies({ candidates, mappedTagsByUserTag })
      const reasons = await generateReasons(deps.llmClient, input.message, normalizedAnalysis, selectedMovies)
      const answer = buildRecommendationChatAnswer()
      const responseMessage = await deps.repository.insertResponseMessage({
        conversationId: conversation.id,
        content: answer,
        analysisResult: normalizedAnalysis,
      })
      await deps.repository.insertRecommendedMovies({
        messageId: responseMessage.id,
        movies: selectedMovies.map((movie, index) => ({
          movieId: movie.id,
          rank: index + 1,
          reason: reasons.get(movie.id)!,
        })),
      })

      return {
        conversationId: conversation.id,
        answer,
        movies: selectedMovies.map((movie) => mapSelectedMovieDto(movie, reasons.get(movie.id)!)),
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

async function analyzeRequest(
  llmClient: RecommendationChatLlmClient,
  input: Parameters<RecommendationChatLlmClient["analyzeRequest"]>[0],
) {
  try {
    return await llmClient.analyzeRequest(input)
  } catch (error) {
    throw error instanceof RecommendationChatLlmApiError ? error : new RecommendationChatLlmApiError(error)
  }
}

async function mapUserTags(deps: RecommendationChatServiceDeps, analysis: RecommendationChatAnalysis) {
  const userTagQueries = analysis.userTagQueries.slice(0, MAX_USER_TAGS)
  const userTags = userTagQueries.map((query) => query.userTag)
  const embeddingInputs = userTagQueries.map((query) => query.embeddingTerms.join(" "))
  const mappedTagsByUserTag = new Map<string, RecommendationChatMappedTag[]>()
  if (userTagQueries.length === 0) {
    return mappedTagsByUserTag
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
    return mappedTagsByUserTag
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
        throw new RecommendationChatLlmApiError()
      }
      reasons.set(reason.movieId, reason.reason)
    }

    if (reasons.size !== selectedMovieIds.size) {
      throw new RecommendationChatLlmApiError()
    }

    return reasons
  } catch (error) {
    throw error instanceof RecommendationChatLlmApiError ? error : new RecommendationChatLlmApiError(error)
  }
}

function normalizeAnalysis(analysis: RecommendationChatAnalysis, availableOptions: AvailableRecommendationChatOptions) {
  const genreIds = new Set(availableOptions.genres.map((genre) => genre.id))
  const countryCodes = new Set(availableOptions.countries.map((country) => country.code))
  const languageCodes = new Set(availableOptions.languages.map((language) => language.code))

  return {
    ...analysis,
    genreIds: analysis.genreIds.filter((id) => genreIds.has(id)),
    countryCodes: analysis.countryCodes.filter((code) => countryCodes.has(code)),
    languageCodes: analysis.languageCodes.filter((code) => languageCodes.has(code)),
    userTagQueries: analysis.userTagQueries
      .map((query) => ({
        userTag: query.userTag.trim(),
        embeddingTerms: query.embeddingTerms.map((term) => term.trim()).filter(Boolean),
      }))
      .filter(
        (query) =>
          query.userTag &&
          query.embeddingTerms.length === 7 &&
          query.embeddingTerms[0] === query.userTag &&
          !containsForbiddenUserTagQueryTerm(query.userTag) &&
          query.embeddingTerms.every((term) => !containsForbiddenUserTagQueryTerm(term)),
      )
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
