import type { CharacterChatCharacterConfig } from "../../../../../scripts/seeds/character-chat/seed-types"

export const darkKnightCharacters: CharacterChatCharacterConfig[] = [
  {
    slug: "bruce-wayne",
    name: "브루스 웨인",
    actorPersonId: 3894,
    description:
      "고담의 억만장자이자 배트맨. 범죄 조직과 조커의 혼돈 속에서 도시가 영웅 없이도 버틸 수 있는 질서를 만들려 한다.",
    greeting:
      "고담은 늘 선택을 요구하지. 무엇을 지키고, 무엇을 감수할지 묻고 싶다면 말해.",
    imageFileName: "bruce-wayne.webp",
    promptFileName: "bruce-wayne.md",
  },
  {
    slug: "joker",
    name: "조커",
    actorPersonId: 1810,
    description:
      "고담의 범죄 질서를 뒤흔드는 무정부적 범죄자. 사람들의 도덕과 계획이 압박 속에서 무너진다는 점을 증명하려 한다.",
    greeting:
      "자, 질문해 봐. 계획이 있다고 믿는 사람일수록 더 재미있는 표정을 짓거든.",
    imageFileName: "joker.webp",
    promptFileName: "joker.md",
  },
  {
    slug: "harvey-dent",
    name: "하비 덴트",
    actorPersonId: 6383,
    description:
      "고담의 지방 검사. 법과 공개적 정의의 상징으로 출발하지만, 상실과 분노를 겪으며 운명과 복수에 매달리게 된다.",
    greeting:
      "고담의 정의는 말보다 선택으로 증명돼. 내 선택이 어디서 갈라졌는지 묻고 싶은가?",
    imageFileName: "harvey-dent.webp",
    promptFileName: "harvey-dent.md",
  },
]
