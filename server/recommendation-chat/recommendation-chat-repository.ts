import "server-only"

import { and, asc, desc, eq, inArray, notInArray, sql } from "drizzle-orm"
import { isUniqueViolationError } from "@/server/db/postgres-errors"
import { getDb } from "@/server/db/client"
import {
  genres,
  movieGenres,
  movies,
  movieStats,
  movieTagMappingEmbeddings,
  movieTagRelevances,
  movieTags,
  recommendationChatConversationMessageMovies,
  recommendationChatConversationMessages,
  recommendationChatConversations,
  recommendationChatDebugQuestions,
} from "@/server/db/schema"
import type {
  RecommendationChatCandidate,
  RecommendationChatFilters,
  RecommendationChatRepository,
  RecommendationChatStoredMessageRepoResult,
  RecommendationChatStoredMovieRepoResult,
} from "./recommendation-chat-types"

type CandidateBaseRow = Omit<RecommendationChatCandidate, "genres" | "tagRelevances">

export function createRecommendationChatRepository(): RecommendationChatRepository {
  return {
    async findConversationByUserId(params) {
      const [row] = await getDb()
        .select({ id: recommendationChatConversations.id, userId: recommendationChatConversations.userId })
        .from(recommendationChatConversations)
        .where(eq(recommendationChatConversations.userId, params.userId))
        .limit(1)

      return row ?? null
    },

    async findOrCreateConversation(params) {
      const existing = await this.findConversationByUserId(params)
      if (existing) {
        return existing
      }

      try {
        const [row] = await getDb()
          .insert(recommendationChatConversations)
          .values({ userId: params.userId })
          .returning({ id: recommendationChatConversations.id, userId: recommendationChatConversations.userId })

        return row
      } catch (error) {
        if (!isUniqueViolationError(error)) {
          throw error
        }

        const row = await this.findConversationByUserId(params)
        if (!row) {
          throw error
        }
        return row
      }
    },

    async deleteConversationByUserId(params) {
      await getDb()
        .delete(recommendationChatConversations)
        .where(eq(recommendationChatConversations.userId, params.userId))
    },

    async insertRequestMessage(params) {
      return insertMessage({ conversationId: params.conversationId, content: params.content, role: "request" })
    },

    async insertResponseMessage(params) {
      return insertMessage({
        conversationId: params.conversationId,
        content: params.content,
        role: "response",
        analysisResult: params.analysisResult,
      })
    },

    async insertRecommendedMovies(params) {
      if (params.movies.length === 0) {
        return
      }

      await getDb().insert(recommendationChatConversationMessageMovies).values(
        params.movies.map((movie) => ({
          messageId: params.messageId,
          movieId: movie.movieId,
          rank: movie.rank,
          reason: movie.reason,
        })),
      )
    },

    async listRecentRecommendationExchanges(params) {
      const messages = await getDb()
        .select({
          id: recommendationChatConversationMessages.id,
          role: recommendationChatConversationMessages.role,
          content: recommendationChatConversationMessages.content,
          createdAt: recommendationChatConversationMessages.createdAt,
        })
        .from(recommendationChatConversationMessages)
        .where(eq(recommendationChatConversationMessages.conversationId, params.conversationId))
        .orderBy(desc(recommendationChatConversationMessages.createdAt))
        .limit(params.limit * 2 + 4)

      const responseIds = messages.filter((message) => message.role === "response").map((message) => message.id)
      const moviesByMessageId = await findRecommendedMovieTitlesByMessageIds(responseIds)
      const exchanges = []

      for (let index = 0; index < messages.length - 1; index += 1) {
        const response = messages[index]
        const request = messages[index + 1]
        if (response?.role === "response" && request?.role === "request") {
          exchanges.push({
            request: request.content,
            response: response.content,
            movies: moviesByMessageId.get(response.id) ?? [],
          })
        }
      }

      return exchanges.slice(0, params.limit).reverse()
    },

    async listRecommendedMovieIds(params) {
      const rows = await getDb()
        .select({ movieId: recommendationChatConversationMessageMovies.movieId })
        .from(recommendationChatConversationMessageMovies)
        .innerJoin(
          recommendationChatConversationMessages,
          eq(recommendationChatConversationMessages.id, recommendationChatConversationMessageMovies.messageId),
        )
        .where(eq(recommendationChatConversationMessages.conversationId, params.conversationId))

      return new Set(rows.map((row) => row.movieId))
    },

    async getConversationMessages(params) {
      const messageRows = await getDb()
        .select({
          id: recommendationChatConversationMessages.id,
          role: recommendationChatConversationMessages.role,
          content: recommendationChatConversationMessages.content,
          createdAt: recommendationChatConversationMessages.createdAt,
        })
        .from(recommendationChatConversationMessages)
        .where(eq(recommendationChatConversationMessages.conversationId, params.conversationId))
        .orderBy(asc(recommendationChatConversationMessages.createdAt))

      const moviesByMessageId = await findStoredMoviesByMessageIds(messageRows.map((row) => row.id))
      return messageRows.map((row) => ({
        id: row.id,
        role: row.role as "request" | "response",
        content: row.content,
        createdAt: row.createdAt,
        movies: moviesByMessageId.get(row.id) ?? [],
      })) satisfies RecommendationChatStoredMessageRepoResult[]
    },

    async listAvailableOptions() {
      const [genreRows, countryRows, languageRows] = await Promise.all([
        getDb()
          .select({ id: genres.id, name: genres.name, nameKo: genres.nameKo })
          .from(genres)
          .orderBy(asc(genres.id)),
        getDb().execute(sql<{ code: string }>`select distinct jsonb_array_elements_text(production_countries) as code from movies order by code`),
        getDb()
          .select({ code: movies.originalLanguage })
          .from(movies)
          .where(sql`${movies.originalLanguage} is not null`)
          .groupBy(movies.originalLanguage)
          .orderBy(asc(movies.originalLanguage)),
      ])

      return {
        genres: genreRows,
        countries: rowsFromExecute<{ code: string }>(countryRows).filter((row) => row.code),
        languages: languageRows.flatMap((row) => (row.code ? [{ code: row.code }] : [])),
      }
    },

    async listDebugQuestions() {
      return getDb()
        .select({
          id: recommendationChatDebugQuestions.id,
          text: recommendationChatDebugQuestions.text,
          isBuggy: recommendationChatDebugQuestions.isBuggy,
          createdAt: recommendationChatDebugQuestions.createdAt,
        })
        .from(recommendationChatDebugQuestions)
        .orderBy(desc(recommendationChatDebugQuestions.createdAt))
    },

    async insertDebugQuestion(params) {
      const [row] = await getDb()
        .insert(recommendationChatDebugQuestions)
        .values({ text: params.text })
        .returning({
          id: recommendationChatDebugQuestions.id,
          text: recommendationChatDebugQuestions.text,
          isBuggy: recommendationChatDebugQuestions.isBuggy,
          createdAt: recommendationChatDebugQuestions.createdAt,
        })

      return row
    },

    async updateDebugQuestion(params) {
      const [row] = await getDb()
        .update(recommendationChatDebugQuestions)
        .set({ isBuggy: params.isBuggy })
        .where(eq(recommendationChatDebugQuestions.id, params.questionId))
        .returning({
          id: recommendationChatDebugQuestions.id,
          text: recommendationChatDebugQuestions.text,
          isBuggy: recommendationChatDebugQuestions.isBuggy,
          createdAt: recommendationChatDebugQuestions.createdAt,
        })

      return row ?? null
    },

    async deleteDebugQuestion(params) {
      await getDb()
        .delete(recommendationChatDebugQuestions)
        .where(eq(recommendationChatDebugQuestions.id, params.questionId))
    },

    async listTagMappingTopN(params) {
      const queryVector = vectorLiteral(params.embedding)
      const rows = await getDb()
        .select({
          tagId: movieTagMappingEmbeddings.tagId,
          tag: movieTags.tag,
          relevance: sql<number>`1 - (${movieTagMappingEmbeddings.embedding} <=> ${queryVector}::vector)`,
        })
        .from(movieTagMappingEmbeddings)
        .innerJoin(movieTags, eq(movieTags.tagId, movieTagMappingEmbeddings.tagId))
        .where(eq(movieTagMappingEmbeddings.embeddingModel, params.embeddingModel))
        .orderBy(sql`${movieTagMappingEmbeddings.embedding} <=> ${queryVector}::vector`)
        .limit(params.limit)

      return rows
    },

    async listTaggedCandidates(params) {
      const conditions = buildCandidateConditions(params.filters, params.excludedMovieIds)
      conditions.push(
        sql`exists (
          select 1
          from ${movieTagRelevances}
          where ${movieTagRelevances.movieId} = ${movies.id}
            and ${movieTagRelevances.tagId} in (${sql.join(params.mappedTagIds.map((id) => sql`${id}`), sql`, `)})
        )`,
      )

      const rows = await selectCandidateBaseRows(conditions)
      return attachCandidateDetails(rows, params.mappedTagIds)
    },

    async listTaglessCandidates(params) {
      const rows = await selectCandidateBaseRows(buildCandidateConditions(params.filters, params.excludedMovieIds), params.limit)
      return attachCandidateDetails(rows, [])
    },
  }
}

async function insertMessage(params: {
  conversationId: string
  role: "request" | "response"
  content: string
  analysisResult?: unknown
}) {
  const [row] = await getDb()
    .insert(recommendationChatConversationMessages)
    .values({
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      analysisResult: params.analysisResult,
    })
    .returning({
      id: recommendationChatConversationMessages.id,
      conversationId: recommendationChatConversationMessages.conversationId,
    })

  await getDb()
    .update(recommendationChatConversations)
    .set({ updatedAt: new Date() })
    .where(eq(recommendationChatConversations.id, params.conversationId))

  return row
}

function buildCandidateConditions(filters: RecommendationChatFilters, excludedMovieIds: number[]) {
  const conditions = [sql`${movies.adult} = false`]

  if (filters.genreIds.length > 0) {
    conditions.push(sql`(
      select count(distinct ${movieGenres.genreId})
      from ${movieGenres}
      where ${movieGenres.movieId} = ${movies.id}
        and ${movieGenres.genreId} in ${filters.genreIds}
    ) = ${filters.genreIds.length}`)
  }

  if (filters.countryCodes.length > 0) {
    conditions.push(sql`exists (
      select 1
      from jsonb_array_elements_text(${movies.productionCountries}) as country(code)
      where country.code in ${filters.countryCodes}
    )`)
  }

  if (filters.languageCodes.length > 0) {
    conditions.push(inArray(movies.originalLanguage, filters.languageCodes))
  }

  if (filters.yearRange?.from !== null && filters.yearRange?.from !== undefined) {
    conditions.push(sql`${movies.releaseYear} >= ${filters.yearRange.from}`)
  }

  if (filters.yearRange?.to !== null && filters.yearRange?.to !== undefined) {
    conditions.push(sql`${movies.releaseYear} <= ${filters.yearRange.to}`)
  }

  if (filters.runtimeRange?.from !== null && filters.runtimeRange?.from !== undefined) {
    conditions.push(sql`${movies.runtime} >= ${filters.runtimeRange.from}`)
  }

  if (filters.runtimeRange?.to !== null && filters.runtimeRange?.to !== undefined) {
    conditions.push(sql`${movies.runtime} <= ${filters.runtimeRange.to}`)
  }

  if (excludedMovieIds.length > 0) {
    conditions.push(notInArray(movies.id, excludedMovieIds))
  }

  return conditions
}

async function selectCandidateBaseRows(conditions: ReturnType<typeof buildCandidateConditions>, limit?: number) {
  const rating = sql`case
    when ${movieStats.movielensRatingCount} + ${movieStats.cinemateReviewCount} > 0
    then (
      (${movieStats.movielensAvgRating} * ${movieStats.movielensRatingCount} + ${movieStats.cinemateRatingSum})
      / (${movieStats.movielensRatingCount} + ${movieStats.cinemateReviewCount})
    )
    else 0
  end`
  const ratingCount = sql`${movieStats.movielensRatingCount} + ${movieStats.cinemateReviewCount}`
  let query = getDb()
    .select({
      id: movies.id,
      title: movies.title,
      releaseYear: movies.releaseYear,
      overview: movies.overview,
      posterPath: movies.posterPath,
      movielensAvgRating: movieStats.movielensAvgRating,
      movielensRatingCount: movieStats.movielensRatingCount,
      cinemateRatingSum: movieStats.cinemateRatingSum,
      cinemateReviewCount: movieStats.cinemateReviewCount,
    })
    .from(movies)
    .innerJoin(movieStats, eq(movieStats.movieId, movies.id))
    .where(and(...conditions))
    .orderBy(sql`${rating} desc`, sql`${ratingCount} desc`, asc(movies.id))
    .$dynamic()

  if (limit !== undefined) {
    query = query.limit(limit)
  }

  return query
}

async function attachCandidateDetails(rows: CandidateBaseRow[], mappedTagIds: number[]): Promise<RecommendationChatCandidate[]> {
  if (rows.length === 0) {
    return []
  }

  const movieIds = rows.map((row) => row.id)
  const [genresByMovieId, tagRelevancesByMovieId] = await Promise.all([
    findGenresByMovieIds(movieIds),
    findTagRelevancesByMovieIds(movieIds, mappedTagIds),
  ])

  return rows.map((row) => ({
    ...row,
    genres: genresByMovieId.get(row.id) ?? [],
    tagRelevances: tagRelevancesByMovieId.get(row.id) ?? new Map(),
  }))
}

async function findGenresByMovieIds(movieIds: number[]) {
  if (movieIds.length === 0) {
    return new Map<number, { id: number; name: string }[]>()
  }

  const rows = await getDb()
    .select({
      movieId: movieGenres.movieId,
      id: genres.id,
      name: sql<string>`coalesce(${genres.nameKo}, ${genres.name})`,
    })
    .from(movieGenres)
    .innerJoin(genres, eq(genres.id, movieGenres.genreId))
    .where(inArray(movieGenres.movieId, movieIds))
    .orderBy(asc(movieGenres.movieId), asc(genres.name))

  const result = new Map<number, { id: number; name: string }[]>()
  for (const row of rows) {
    const movieGenres = result.get(row.movieId) ?? []
    movieGenres.push({ id: row.id, name: row.name })
    result.set(row.movieId, movieGenres)
  }
  return result
}

async function findTagRelevancesByMovieIds(movieIds: number[], tagIds: number[]) {
  if (movieIds.length === 0 || tagIds.length === 0) {
    return new Map<number, Map<number, number>>()
  }

  const rows = await getDb()
    .select({
      movieId: movieTagRelevances.movieId,
      tagId: movieTagRelevances.tagId,
      relevance: movieTagRelevances.relevance,
    })
    .from(movieTagRelevances)
    .where(and(inArray(movieTagRelevances.movieId, movieIds), inArray(movieTagRelevances.tagId, tagIds)))

  const result = new Map<number, Map<number, number>>()
  for (const row of rows) {
    const tagRelevances = result.get(row.movieId) ?? new Map<number, number>()
    tagRelevances.set(row.tagId, row.relevance)
    result.set(row.movieId, tagRelevances)
  }
  return result
}

async function findStoredMoviesByMessageIds(messageIds: string[]) {
  if (messageIds.length === 0) {
    return new Map<string, RecommendationChatStoredMovieRepoResult[]>()
  }

  const rows = await getDb()
    .select({
      messageId: recommendationChatConversationMessageMovies.messageId,
      id: movies.id,
      title: movies.title,
      releaseYear: movies.releaseYear,
      overview: movies.overview,
      posterPath: movies.posterPath,
      movielensAvgRating: movieStats.movielensAvgRating,
      movielensRatingCount: movieStats.movielensRatingCount,
      cinemateRatingSum: movieStats.cinemateRatingSum,
      cinemateReviewCount: movieStats.cinemateReviewCount,
      rank: recommendationChatConversationMessageMovies.rank,
      reason: recommendationChatConversationMessageMovies.reason,
    })
    .from(recommendationChatConversationMessageMovies)
    .innerJoin(movies, eq(movies.id, recommendationChatConversationMessageMovies.movieId))
    .innerJoin(movieStats, eq(movieStats.movieId, movies.id))
    .where(inArray(recommendationChatConversationMessageMovies.messageId, messageIds))
    .orderBy(asc(recommendationChatConversationMessageMovies.messageId), asc(recommendationChatConversationMessageMovies.rank))

  const genresByMovieId = await findGenresByMovieIds(rows.map((row) => row.id))
  const result = new Map<string, RecommendationChatStoredMovieRepoResult[]>()
  for (const row of rows) {
    const movies = result.get(row.messageId) ?? []
    movies.push({
      id: row.id,
      title: row.title,
      releaseYear: row.releaseYear,
      overview: row.overview,
      posterPath: row.posterPath,
      movielensAvgRating: row.movielensAvgRating,
      movielensRatingCount: row.movielensRatingCount,
      cinemateRatingSum: row.cinemateRatingSum,
      cinemateReviewCount: row.cinemateReviewCount,
      genres: genresByMovieId.get(row.id) ?? [],
      rank: row.rank,
      reason: row.reason,
    })
    result.set(row.messageId, movies)
  }
  return result
}

async function findRecommendedMovieTitlesByMessageIds(messageIds: string[]) {
  const storedMovies = await findStoredMoviesByMessageIds(messageIds)
  return new Map([...storedMovies].map(([messageId, rows]) => [messageId, rows.map((row) => ({ id: row.id, title: row.title }))]))
}

function vectorLiteral(embedding: number[]) {
  return `[${embedding.join(",")}]`
}

function rowsFromExecute<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}
