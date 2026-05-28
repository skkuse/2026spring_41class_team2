export type CharacterChatCharacterConfig = {
  slug: string
  name: string
  actorPersonId: number
  description: string
  greeting: string
  imageFileName: string
  promptFileName: string
}

export type CharacterChatMovieSeedConfig = {
  movieId: number
  characters: CharacterChatCharacterConfig[]
  events: CharacterChatEventConfig[]
  defaultQuestions: CharacterChatDefaultQuestionConfig[]
}

export type CharacterChatEventParticipantConfig = {
  characterSlug: string
  role: string
  perspectiveSummary: string
  emotionalImpact: string
  knowledgeState: string
}

export type CharacterChatEventConfig = {
  eventOrder: number
  title: string
  summary: string
  participants: CharacterChatEventParticipantConfig[]
}

export type CharacterChatDefaultQuestionCategory = "event" | "relationship" | "identity"

export type CharacterChatDefaultQuestionConfig = {
  characterSlug: string
  displayOrder: number
  category: CharacterChatDefaultQuestionCategory
  question: string
}

export type CharacterSeedRow = {
  id: string
  movie_id: number
  actor_person_id: number
  name: string
  description: string
  greeting: string
  persona_prompt: string
  avatar_storage_path: string
}

export type CharacterChatEventSeedRow = {
  id: string
  movie_id: number
  event_order: number
  title: string
  summary: string
}

export type CharacterChatEventParticipantSeedRow = {
  event_id: string
  character_id: string
  role: string
  perspective_summary: string
  emotional_impact: string
  knowledge_state: string
}

export type CharacterChatDefaultQuestionSeedRow = {
  id: string
  character_id: string
  question: string
  display_order: number
}
