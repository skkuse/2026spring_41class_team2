import type { RequestContext } from "@/server/auth/auth-types"

// HTTP DTO
export type CharacterChatActorDto = {
  id: number
  name: string
}

export type CharacterChatCharacterDto = {
  id: string
  name: string
  description: string
  greeting: string
  avatarUrl: string
  actor: CharacterChatActorDto | null
}

export type CharacterChatMovieDto = {
  id: number
  title: string
  genres: { id: number; name: string }[]
  posterUrl: string
  description: string
  actors: string[]
  characters: CharacterChatCharacterDto[]
}

export type ListCharacterChatMoviesResponseDto = {
  movies: CharacterChatMovieDto[]
}

export type CreateCharacterChatConversationRequestDto = {
  movieId: number
  characterId: string
}

export type CreateCharacterChatConversationResponseDto = {
  conversationId: string
  initialMessage: string
  suggestedQuestions: string[]
}

export type SendCharacterChatMessageRequestDto = {
  message: string
}

export type SendCharacterChatMessageResponseDto = {
  messageId: string
  reply: string
  suggestedQuestions: string[]
  createdAt: string
}

export type GetCharacterChatConversationQueryDto = {
  movieId: number
  characterId: string
}

export type CharacterChatConversationMessageDto = {
  id: string
  role: "user" | "character"
  content: string
  createdAt: string
}

export type GetCharacterChatConversationResponseDto = {
  conversationId: string | null
  initialMessage: string
  messages: CharacterChatConversationMessageDto[]
  suggestedQuestions: string[]
}

// Service input
export type CreateCharacterChatConversationInput = CreateCharacterChatConversationRequestDto

export type GetCharacterChatConversationInput = GetCharacterChatConversationQueryDto

export type SendCharacterChatMessageInput = {
  conversationId: string
  message: string
}

// Service output
export type CharacterChatReply = {
  reply: string
  suggestedQuestions: string[]
}

// Domain
export type CharacterChatRecentMessage = {
  senderType: "user" | "character"
  content: string
}

export type CharacterChatEventContext = {
  eventOrder: number
  title: string
  summary: string
  role: string
  perspectiveSummary: string
  emotionalImpact: string
  knowledgeState: string
}

export type CharacterChatConversationContext = {
  conversation: CharacterChatConversationRepoResult
  movie: CharacterChatMovieRepoResult
  character: CharacterChatCharacterRepoResult
  recentMessages: CharacterChatRecentMessage[]
  events: CharacterChatEventContext[]
}

export type CharacterChatConversationWithMessages = {
  conversation: CharacterChatConversationRepoResult
  messages: CharacterChatMessageRepoResult[]
}

// Repository params
export type FindSupportedMoviesRepoParams = {
  movieIds: number[]
}

export type FindCharacterForMovieRepoParams = {
  movieId: number
  characterId: string
}

export type CreateConversationRepoParams = {
  userId: string
  characterId: string
}

export type ListDefaultQuestionsRepoParams = {
  characterId: string
}

export type FindConversationContextRepoParams = {
  userId: string
  conversationId: string
  recentMessageLimit: number
}

export type FindLatestConversationForCharacterRepoParams = {
  userId: string
  movieId: number
  characterId: string
}

export type InsertMessageRepoParams = {
  conversationId: string
  senderType: "user" | "character"
  content: string
  suggestedQuestions?: string[] | null
}

// Repository results
export type CharacterChatMovieRepoResult = {
  id: number
  title: string
  overview: string | null
  posterPath: string | null
  genres: { id: number; name: string }[]
}

export type CharacterChatCharacterRepoResult = {
  id: string
  movieId: number
  actorPersonId: number | null
  actorName: string | null
  name: string
  description: string
  greeting: string
  personaPrompt: string
  avatarStoragePath: string
}

export type CharacterChatSupportedMovieRepoResult = CharacterChatMovieRepoResult & {
  characters: CharacterChatCharacterRepoResult[]
}

export type CharacterChatConversationRepoResult = {
  id: string
  userId: string
  characterId: string
}

export type CharacterChatMessageRepoResult = {
  id: string
  conversationId: string
  senderType: "user" | "character"
  content: string
  suggestedQuestions: string[] | null
  createdAt: Date
}

// Repository port
export type CharacterChatRepository = {
  listSupportedMovies(params: FindSupportedMoviesRepoParams): Promise<CharacterChatSupportedMovieRepoResult[]>
  findCharacterForMovie(params: FindCharacterForMovieRepoParams): Promise<CharacterChatCharacterRepoResult | null>
  createConversation(params: CreateConversationRepoParams): Promise<CharacterChatConversationRepoResult>
  listDefaultQuestions(params: ListDefaultQuestionsRepoParams): Promise<string[]>
  findConversationContext(params: FindConversationContextRepoParams): Promise<CharacterChatConversationContext | null>
  findLatestConversationForCharacter(
    params: FindLatestConversationForCharacterRepoParams,
  ): Promise<CharacterChatConversationWithMessages | null>
  insertMessage(params: InsertMessageRepoParams): Promise<CharacterChatMessageRepoResult>
}

export type CharacterChatAvatarUrlSigner = {
  sign(path: string): Promise<string>
}

export type CharacterChatLlmClient = {
  generateReply(input: {
    movieTitle: string
    characterName: string
    characterDescription: string
    personaPrompt: string
    currentMessage: string
    recentMessages: CharacterChatRecentMessage[]
    eventContexts: CharacterChatEventContext[]
  }): Promise<CharacterChatReply>
}

export type CharacterChatService = {
  listMovies(context: RequestContext): Promise<ListCharacterChatMoviesResponseDto>
  getConversation(
    context: RequestContext,
    input: GetCharacterChatConversationInput,
  ): Promise<GetCharacterChatConversationResponseDto>
  createConversation(
    context: RequestContext,
    input: CreateCharacterChatConversationInput,
  ): Promise<CreateCharacterChatConversationResponseDto>
  sendMessage(context: RequestContext, input: SendCharacterChatMessageInput): Promise<SendCharacterChatMessageResponseDto>
}
