import "server-only"

export class UnauthorizedCharacterChatError extends Error {}

export class CharacterChatInvalidCharacterError extends Error {}

export class CharacterChatConversationNotFoundError extends Error {}

export class CharacterChatLlmApiError extends Error {
  constructor(cause?: unknown) {
    super("Character chat LLM request failed")
    this.cause = cause
  }
}
