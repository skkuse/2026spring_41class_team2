import { z } from "zod"

export const characterChatCharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  greeting: z.string().min(1),
  avatarUrl: z.string().url(),
  actor: z.object({ id: z.number().int(), name: z.string().min(1) }).nullable(),
})

export const characterChatMovieSchema = z.object({
  id: z.number().int(),
  title: z.string().min(1),
  genres: z.array(z.object({ id: z.number().int(), name: z.string().min(1) })),
  posterUrl: z.string().url(),
  description: z.string().min(1),
  actors: z.array(z.string().min(1)),
  characters: z.array(characterChatCharacterSchema),
})

export const listCharacterChatMoviesResponseSchema = z.object({
  movies: z.array(characterChatMovieSchema),
})

export const createCharacterChatConversationRequestSchema = z.object({
  movieId: z.number().int(),
  characterId: z.string().uuid(),
})

export const getCharacterChatConversationQuerySchema = z.object({
  movieId: z.coerce.number().int(),
  characterId: z.string().uuid(),
})

export const createCharacterChatConversationResponseSchema = z.object({
  conversationId: z.string().uuid(),
  initialMessage: z.string().min(1),
  suggestedQuestions: z.array(z.string().min(1)),
})

export const characterChatConversationMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["user", "character"]),
  content: z.string().min(1),
  createdAt: z.string(),
})

export const getCharacterChatConversationResponseSchema = z.object({
  conversationId: z.string().uuid().nullable(),
  initialMessage: z.string().min(1),
  messages: z.array(characterChatConversationMessageSchema),
  suggestedQuestions: z.array(z.string().min(1)).max(4),
})

export const sendCharacterChatMessageRequestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
})

export const sendCharacterChatMessageResponseSchema = z.object({
  messageId: z.string().uuid(),
  reply: z.string().min(1),
  suggestedQuestions: z.array(z.string().min(1)).min(1).max(4),
  createdAt: z.string(),
})

export const characterChatLlmReplySchema = z.object({
  reply: z.string().trim().min(1).max(2000),
  suggestedQuestions: z.array(z.string().trim().min(1).max(120)).min(1).max(4),
})
