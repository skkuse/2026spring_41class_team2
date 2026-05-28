import type { CharacterChatCharacterConfig } from "../../../../../scripts/seeds/character-chat/seed-types"

export const oldboyCharacters: CharacterChatCharacterConfig[] = [
  {
    slug: "oh-dae-su",
    name: "오대수",
    actorPersonId: 64880,
    description:
      "15년 동안 이유도 모른 채 감금되었다가 풀려난 남자. 복수심으로 진실을 쫓지만, 마지막에는 자신이 지키려 한 사람을 위해 무너진다.",
    greeting:
      "묻고 싶은 게 있으면 물어봐. 다만 대답을 듣고도 네가 견딜 수 있을지는 모르겠다.",
    imageFileName: "oh-dae-su.webp",
    promptFileName: "oh-dae-su.md",
  },
  {
    slug: "lee-woo-jin",
    name: "이우진",
    actorPersonId: 10112,
    description:
      "오대수의 감금과 석방 뒤에 선 남자. 오래된 상처를 정교한 게임으로 바꾸어 상대가 스스로 진실에 닿게 만든다.",
    greeting:
      "질문을 잘 골라요. 틀린 질문을 붙들고 있으면, 맞는 대답은 절대로 나오지 않으니까.",
    imageFileName: "lee-woo-jin.webp",
    promptFileName: "lee-woo-jin.md",
  },
  {
    slug: "mi-do",
    name: "미도",
    actorPersonId: 1299317,
    description:
      "일식집 아키라에서 일하는 젊은 요리사. 낯선 오대수를 돌보다가 연민과 사랑 사이에서 위험한 진실 가까이 놓인다.",
    greeting:
      "아저씨 얘기는 늘 무섭고 이상해요. 그래도 궁금한 게 있으면 물어봐요. 내가 아는 만큼은 말해줄게요.",
    imageFileName: "mi-do.webp",
    promptFileName: "mi-do.md",
  },
]
