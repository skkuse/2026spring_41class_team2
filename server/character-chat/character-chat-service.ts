import "server-only"

import { buildTmdbImageUrl } from "@/server/movies/movie-rules"
import type { RequestContext } from "@/server/auth/auth-types"
import { createSupabaseCharacterChatAvatarUrlSigner } from "./character-chat-avatar-url-signer"
import {
  CharacterChatConversationNotFoundError,
  CharacterChatInvalidCharacterError,
  CharacterChatLlmApiError,
  UnauthorizedCharacterChatError,
} from "./character-chat-errors"
import { createOpenAiCharacterChatLlmClient } from "./character-chat-openai-llm-client"
import { createCharacterChatRepository } from "./character-chat-repository"
import {
  CHARACTER_CHAT_RECENT_MESSAGE_LIMIT,
  CHARACTER_CHAT_SUPPORTED_MOVIE_IDS,
  mapSupportedMovieDto,
  normalizeSuggestedQuestions,
  selectRelevantEventContexts,
} from "./character-chat-rules"
import type {
  CharacterChatAvatarUrlSigner,
  CharacterChatLlmClient,
  CharacterChatRepository,
  CharacterChatService,
} from "./character-chat-types"

export type CharacterChatServiceDeps = {
  repository: CharacterChatRepository
  llmClient: CharacterChatLlmClient
  avatarUrlSigner: CharacterChatAvatarUrlSigner
}

export function createCharacterChatService(deps: CharacterChatServiceDeps): CharacterChatService {
  return {
    async listMovies(context) {
      requireUserId(context)
      const movies = await deps.repository.listSupportedMovies({ movieIds: CHARACTER_CHAT_SUPPORTED_MOVIE_IDS })
      const avatarPaths = unique(movies.flatMap((movie) => movie.characters.map((character) => character.avatarStoragePath)))
      const avatarUrlsByPath = new Map<string, string>()

      await Promise.all(
        avatarPaths.map(async (path) => {
          avatarUrlsByPath.set(path, await deps.avatarUrlSigner.sign(path))
        }),
      )

      return {
        movies: movies.map((movie) => mapSupportedMovieDto(movie, avatarUrlsByPath, buildTmdbImageUrl(movie.posterPath, "w500"))),
      }
    },

    async getConversation(context, input) {
      const userId = requireUserId(context)
      const character = await deps.repository.findCharacterForMovie(input)
      if (!character) {
        throw new CharacterChatInvalidCharacterError()
      }

      const conversation = await deps.repository.findLatestConversationForCharacter({ userId, ...input })
      if (!conversation) {
        return {
          conversationId: null,
          initialMessage: character.greeting,
          messages: [],
          suggestedQuestions: await deps.repository.listDefaultQuestions({ characterId: character.id }),
        }
      }

      const suggestedQuestions = getRestoredSuggestedQuestions(conversation.messages)
      return {
        conversationId: conversation.conversation.id,
        initialMessage: character.greeting,
        messages: conversation.messages.map((message) => ({
          id: message.id,
          role: message.senderType,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
        })),
        suggestedQuestions:
          suggestedQuestions.length > 0
            ? suggestedQuestions
            : await deps.repository.listDefaultQuestions({ characterId: character.id }),
      }
    },

    async createConversation(context, input) {
      const userId = requireUserId(context)
      const character = await deps.repository.findCharacterForMovie(input)
      if (!character) {
        throw new CharacterChatInvalidCharacterError()
      }

      const conversation = await deps.repository.createConversation({ userId, characterId: character.id })
      const suggestedQuestions = await deps.repository.listDefaultQuestions({ characterId: character.id })

      return {
        conversationId: conversation.id,
        initialMessage: character.greeting,
        suggestedQuestions,
      }
    },

    async sendMessage(context, input) {
      const userId = requireUserId(context)
      const conversationContext = await deps.repository.findConversationContext({
        userId,
        conversationId: input.conversationId,
        recentMessageLimit: CHARACTER_CHAT_RECENT_MESSAGE_LIMIT,
      })

      if (!conversationContext) {
        throw new CharacterChatConversationNotFoundError()
      }

      const eventContexts = selectRelevantEventContexts({
        message: input.message,
        recentMessages: conversationContext.recentMessages,
        events: conversationContext.events,
      })
      const reply = await generateReply(deps.llmClient, {
        movieTitle: conversationContext.movie.title,
        characterName: conversationContext.character.name,
        characterDescription: conversationContext.character.description,
        personaPrompt: conversationContext.character.personaPrompt,
        currentMessage: input.message,
        recentMessages: conversationContext.recentMessages,
        eventContexts,
      })
      const suggestedQuestions = normalizeSuggestedQuestions(reply.suggestedQuestions)

      await deps.repository.insertMessage({
        conversationId: conversationContext.conversation.id,
        senderType: "user",
        content: input.message,
      })
      const characterMessage = await deps.repository.insertMessage({
        conversationId: conversationContext.conversation.id,
        senderType: "character",
        content: reply.reply,
        suggestedQuestions,
      })

      return {
        messageId: characterMessage.id,
        reply: reply.reply,
        suggestedQuestions,
        createdAt: characterMessage.createdAt.toISOString(),
      }
    },
  }
}

function getRestoredSuggestedQuestions(messages: { senderType: "user" | "character"; suggestedQuestions: string[] | null }[]) {
  for (const message of [...messages].reverse()) {
    if (message.senderType === "character" && message.suggestedQuestions && message.suggestedQuestions.length > 0) {
      return message.suggestedQuestions
    }
  }

  return []
}

function requireUserId(context: RequestContext) {
  if (!context.user) {
    throw new UnauthorizedCharacterChatError()
  }

  return context.user.id
}

async function generateReply(llmClient: CharacterChatLlmClient, input: Parameters<CharacterChatLlmClient["generateReply"]>[0]) {
  try {
    return await llmClient.generateReply(input)
  } catch (error) {
    throw error instanceof CharacterChatLlmApiError ? error : new CharacterChatLlmApiError(error)
  }
}

function unique<T>(values: T[]) {
  return [...new Set(values)]
}

export const characterChatService = createCharacterChatService({
  repository: createCharacterChatRepository(),
  llmClient: createOpenAiCharacterChatLlmClient(),
  avatarUrlSigner: createSupabaseCharacterChatAvatarUrlSigner(),
})
