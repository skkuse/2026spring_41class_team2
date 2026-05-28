import "server-only"

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import {
  characterChatConversationMessages,
  characterChatConversations,
  characterChatDefaultQuestions,
  characterChatEventParticipants,
  characterChatEvents,
  characters,
  genres,
  movieGenres,
  movies,
  people,
} from "@/server/db/schema"
import type {
  CharacterChatEventContext,
  CharacterChatMovieRepoResult,
  CharacterChatRepository,
} from "./character-chat-types"

export function createCharacterChatRepository(): CharacterChatRepository {
  return {
    async listSupportedMovies(params) {
      if (params.movieIds.length === 0) {
        return []
      }

      const movieRows = await getDb()
        .select({
          id: movies.id,
          title: movies.title,
          overview: movies.overview,
          posterPath: movies.posterPath,
        })
        .from(movies)
        .where(inArray(movies.id, params.movieIds))
        .orderBy(asc(movies.id))

      const [genreRows, characterRows] = await Promise.all([
        getDb()
          .select({
            movieId: movieGenres.movieId,
            id: genres.id,
            name: sql<string>`coalesce(${genres.nameKo}, ${genres.name})`,
          })
          .from(movieGenres)
          .innerJoin(genres, eq(genres.id, movieGenres.genreId))
          .where(inArray(movieGenres.movieId, params.movieIds))
          .orderBy(asc(movieGenres.movieId), asc(genres.id)),
        getDb()
          .select({
            id: characters.id,
            movieId: characters.movieId,
            actorPersonId: characters.actorPersonId,
            actorName: people.name,
            name: characters.name,
            description: characters.description,
            greeting: characters.greeting,
            personaPrompt: characters.personaPrompt,
            avatarStoragePath: characters.avatarStoragePath,
          })
          .from(characters)
          .leftJoin(people, eq(people.id, characters.actorPersonId))
          .where(inArray(characters.movieId, params.movieIds))
          .orderBy(asc(characters.movieId), asc(characters.name)),
      ])

      const genresByMovieId = groupBy(genreRows, (row) => row.movieId)
      const charactersByMovieId = groupBy(characterRows, (row) => row.movieId)

      return movieRows.flatMap((movie) => {
        const movieCharacters = charactersByMovieId.get(movie.id) ?? []
        if (movieCharacters.length === 0) {
          return []
        }

        return [
          {
            ...movie,
            genres: genresByMovieId.get(movie.id)?.map(({ id, name }) => ({ id, name })) ?? [],
            characters: movieCharacters,
          },
        ]
      })
    },

    async findCharacterForMovie(params) {
      const [row] = await getDb()
        .select({
          id: characters.id,
          movieId: characters.movieId,
          actorPersonId: characters.actorPersonId,
          actorName: people.name,
          name: characters.name,
          description: characters.description,
          greeting: characters.greeting,
          personaPrompt: characters.personaPrompt,
          avatarStoragePath: characters.avatarStoragePath,
        })
        .from(characters)
        .leftJoin(people, eq(people.id, characters.actorPersonId))
        .where(and(eq(characters.id, params.characterId), eq(characters.movieId, params.movieId)))
        .limit(1)

      return row ?? null
    },

    async createConversation(params) {
      const [row] = await getDb()
        .insert(characterChatConversations)
        .values({ userId: params.userId, characterId: params.characterId })
        .returning({
          id: characterChatConversations.id,
          userId: characterChatConversations.userId,
          characterId: characterChatConversations.characterId,
        })

      return row
    },

    async listDefaultQuestions(params) {
      const rows = await getDb()
        .select({ question: characterChatDefaultQuestions.question })
        .from(characterChatDefaultQuestions)
        .where(eq(characterChatDefaultQuestions.characterId, params.characterId))
        .orderBy(asc(characterChatDefaultQuestions.displayOrder))

      return rows.map((row) => row.question)
    },

    async findConversationContext(params) {
      const [conversationRow] = await getDb()
        .select({
          id: characterChatConversations.id,
          userId: characterChatConversations.userId,
          characterId: characterChatConversations.characterId,
          movieId: characters.movieId,
          characterName: characters.name,
          characterDescription: characters.description,
          characterGreeting: characters.greeting,
          characterPersonaPrompt: characters.personaPrompt,
          characterAvatarStoragePath: characters.avatarStoragePath,
          actorPersonId: characters.actorPersonId,
          actorName: people.name,
          movieTitle: movies.title,
          movieOverview: movies.overview,
          moviePosterPath: movies.posterPath,
        })
        .from(characterChatConversations)
        .innerJoin(characters, eq(characters.id, characterChatConversations.characterId))
        .innerJoin(movies, eq(movies.id, characters.movieId))
        .leftJoin(people, eq(people.id, characters.actorPersonId))
        .where(and(eq(characterChatConversations.id, params.conversationId), eq(characterChatConversations.userId, params.userId)))
        .limit(1)

      if (!conversationRow) {
        return null
      }

      const [genreRows, messageRows, eventRows] = await Promise.all([
        getDb()
          .select({ id: genres.id, name: sql<string>`coalesce(${genres.nameKo}, ${genres.name})` })
          .from(movieGenres)
          .innerJoin(genres, eq(genres.id, movieGenres.genreId))
          .where(eq(movieGenres.movieId, conversationRow.movieId))
          .orderBy(asc(genres.id)),
        getDb()
          .select({
            id: characterChatConversationMessages.id,
            conversationId: characterChatConversationMessages.conversationId,
            senderType: characterChatConversationMessages.senderType,
            content: characterChatConversationMessages.content,
            suggestedQuestions: characterChatConversationMessages.suggestedQuestions,
            createdAt: characterChatConversationMessages.createdAt,
          })
          .from(characterChatConversationMessages)
          .where(eq(characterChatConversationMessages.conversationId, params.conversationId))
          .orderBy(desc(characterChatConversationMessages.createdAt))
          .limit(params.recentMessageLimit),
        getDb()
          .select({
            eventOrder: characterChatEvents.eventOrder,
            title: characterChatEvents.title,
            summary: characterChatEvents.summary,
            role: characterChatEventParticipants.role,
            perspectiveSummary: characterChatEventParticipants.perspectiveSummary,
            emotionalImpact: characterChatEventParticipants.emotionalImpact,
            knowledgeState: characterChatEventParticipants.knowledgeState,
          })
          .from(characterChatEventParticipants)
          .innerJoin(characterChatEvents, eq(characterChatEvents.id, characterChatEventParticipants.eventId))
          .where(eq(characterChatEventParticipants.characterId, conversationRow.characterId))
          .orderBy(asc(characterChatEvents.eventOrder)),
      ])

      const movie: CharacterChatMovieRepoResult = {
        id: conversationRow.movieId,
        title: conversationRow.movieTitle,
        overview: conversationRow.movieOverview,
        posterPath: conversationRow.moviePosterPath,
        genres: genreRows,
      }

      return {
        conversation: {
          id: conversationRow.id,
          userId: conversationRow.userId,
          characterId: conversationRow.characterId,
        },
        movie,
        character: {
          id: conversationRow.characterId,
          movieId: conversationRow.movieId,
          actorPersonId: conversationRow.actorPersonId,
          actorName: conversationRow.actorName,
          name: conversationRow.characterName,
          description: conversationRow.characterDescription,
          greeting: conversationRow.characterGreeting,
          personaPrompt: conversationRow.characterPersonaPrompt,
          avatarStoragePath: conversationRow.characterAvatarStoragePath,
        },
        recentMessages: messageRows
          .reverse()
          .map((row) => ({ senderType: row.senderType, content: row.content })),
        events: eventRows satisfies CharacterChatEventContext[],
      }
    },

    async findLatestConversationForCharacter(params) {
      const [conversation] = await getDb()
        .select({
          id: characterChatConversations.id,
          userId: characterChatConversations.userId,
          characterId: characterChatConversations.characterId,
        })
        .from(characterChatConversations)
        .innerJoin(characters, eq(characters.id, characterChatConversations.characterId))
        .where(
          and(
            eq(characterChatConversations.userId, params.userId),
            eq(characterChatConversations.characterId, params.characterId),
            eq(characters.movieId, params.movieId),
          ),
        )
        .orderBy(desc(characterChatConversations.updatedAt))
        .limit(1)

      if (!conversation) {
        return null
      }

      const messages = await getDb()
        .select({
          id: characterChatConversationMessages.id,
          conversationId: characterChatConversationMessages.conversationId,
          senderType: characterChatConversationMessages.senderType,
          content: characterChatConversationMessages.content,
          suggestedQuestions: characterChatConversationMessages.suggestedQuestions,
          createdAt: characterChatConversationMessages.createdAt,
        })
        .from(characterChatConversationMessages)
        .where(eq(characterChatConversationMessages.conversationId, conversation.id))
        .orderBy(asc(characterChatConversationMessages.createdAt), asc(characterChatConversationMessages.id))

      return { conversation, messages }
    },

    async insertMessage(params) {
      const [row] = await getDb()
        .insert(characterChatConversationMessages)
        .values({
          conversationId: params.conversationId,
          senderType: params.senderType,
          content: params.content,
          suggestedQuestions: params.suggestedQuestions ?? null,
        })
        .returning({
          id: characterChatConversationMessages.id,
          conversationId: characterChatConversationMessages.conversationId,
          senderType: characterChatConversationMessages.senderType,
          content: characterChatConversationMessages.content,
          suggestedQuestions: characterChatConversationMessages.suggestedQuestions,
          createdAt: characterChatConversationMessages.createdAt,
        })

      await getDb()
        .update(characterChatConversations)
        .set({ updatedAt: new Date() })
        .where(eq(characterChatConversations.id, params.conversationId))

      return row
    },
  }
}

function groupBy<T, K>(rows: T[], getKey: (row: T) => K) {
  const grouped = new Map<K, T[]>()
  for (const row of rows) {
    const key = getKey(row)
    grouped.set(key, [...(grouped.get(key) ?? []), row])
  }
  return grouped
}
