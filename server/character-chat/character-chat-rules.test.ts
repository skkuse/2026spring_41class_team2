import { describe, expect, it } from "vitest"
import { mapSupportedMovieDto, normalizeSuggestedQuestions, selectRelevantEventContexts } from "./character-chat-rules"
import type { CharacterChatEventContext, CharacterChatSupportedMovieRepoResult } from "./character-chat-types"

describe("character chat rules", () => {
  it("maps supported movie rows to screen DTOs", () => {
    const movie: CharacterChatSupportedMovieRepoResult = {
      id: 155,
      title: "다크 나이트",
      overview: "고담시를 공포로 몰아넣는 조커와 배트맨의 대결.",
      posterPath: "/poster.jpg",
      genres: [{ id: 80, name: "Crime" }],
      characters: [
        {
          id: "character-1",
          movieId: 155,
          actorPersonId: 3894,
          actorName: "Christian Bale",
          name: "Bruce Wayne",
          description: "고담의 억만장자",
          greeting: "고담은 늘 선택을 요구하지.",
          personaPrompt: "prompt",
          avatarStoragePath: "movies/155/characters/bruce-wayne.webp",
        },
        {
          id: "character-2",
          movieId: 155,
          actorPersonId: 3894,
          actorName: "Christian Bale",
          name: "Batman",
          description: "고담의 수호자",
          greeting: "나는 배트맨이다.",
          personaPrompt: "prompt",
          avatarStoragePath: "movies/155/characters/batman.webp",
        },
      ],
    }

    expect(
      mapSupportedMovieDto(
        movie,
        new Map([
          ["movies/155/characters/bruce-wayne.webp", "https://example.com/bruce.webp"],
          ["movies/155/characters/batman.webp", "https://example.com/batman.webp"],
        ]),
        "https://image.tmdb.org/t/p/w500/poster.jpg",
      ),
    ).toMatchObject({
      id: 155,
      actors: ["Christian Bale"],
      characters: [
        { name: "Bruce Wayne", actor: { id: 3894, name: "Christian Bale" }, avatarUrl: "https://example.com/bruce.webp" },
        { name: "Batman", actor: { id: 3894, name: "Christian Bale" }, avatarUrl: "https://example.com/batman.webp" },
      ],
    })
  })

  it("selects relevant event contexts by Korean keyword score with stable tie ordering", () => {
    const events = [
      event(1, "고담 은행 강도", "조커가 은행을 습격한다."),
      event(2, "Lau 체포", "Batman이 홍콩에서 Lau를 데려온다."),
      event(3, "호송대 습격", "조커가 Harvey 호송대를 습격한다."),
    ]

    expect(
      selectRelevantEventContexts({
        message: "조커가 Harvey 호송대를 습격했을 때 어땠어?",
        recentMessages: [],
        events,
      }).map((selected) => selected.eventOrder),
    ).toEqual([3, 1, 2])
  })

  it("normalizes suggested questions and falls back when empty", () => {
    expect(normalizeSuggestedQuestions([" 다음 질문 ", "", "다음 질문", "다른 질문"])).toEqual(["다음 질문", "다른 질문"])
    expect(normalizeSuggestedQuestions(["", " "])).toHaveLength(2)
  })
})

function event(eventOrder: number, title: string, summary: string): CharacterChatEventContext {
  return {
    eventOrder,
    title,
    summary,
    role: "witness",
    perspectiveSummary: summary,
    emotionalImpact: "긴장",
    knowledgeState: "사건을 알고 있다.",
  }
}
