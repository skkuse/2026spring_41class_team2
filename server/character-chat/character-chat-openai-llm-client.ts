import "server-only"

import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { CharacterChatLlmApiError } from "./character-chat-errors"
import { characterChatLlmReplySchema } from "./character-chat-schema"
import type { CharacterChatLlmClient } from "./character-chat-types"

export const CHARACTER_CHAT_MODEL = process.env.OPENAI_CHARACTER_CHAT_MODEL ?? "gpt-4.1-mini"

export function createOpenAiCharacterChatLlmClient(client?: OpenAI): CharacterChatLlmClient {
  return {
    async generateReply(input) {
      try {
        const openai = client ?? new OpenAI()
        const completion = await openai.chat.completions.parse({
          model: CHARACTER_CHAT_MODEL,
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: [
                "당신은 영화 캐릭터 채팅 응답 생성기입니다.",
                "반드시 제공된 persona_prompt, 사건 요약, 캐릭터 관점, knowledge_state 안에서만 답하세요.",
                "캐릭터가 알 수 없는 사실은 단정하지 말고, 그 캐릭터가 느끼거나 추측할 수 있는 범위로 답하세요.",
                "대본 원문이나 긴 인용문을 만들지 마세요.",
                "한국어로 답하고, 응답 JSON schema에 맞는 값만 반환하세요.",
                "suggestedQuestions는 사용자가 이어서 물어볼 만한 짧은 한국어 질문 2~4개로 만드세요.",
              ].join(" "),
            },
            {
              role: "user",
              content: JSON.stringify(input),
            },
          ],
          response_format: zodResponseFormat(characterChatLlmReplySchema, "character_chat_reply"),
        })

        const parsed = completion.choices[0]?.message.parsed
        if (!parsed) {
          throw new CharacterChatLlmApiError()
        }

        return parsed
      } catch (error) {
        throw error instanceof CharacterChatLlmApiError ? error : new CharacterChatLlmApiError(error)
      }
    },
  }
}
