import type { CharacterChatEventConfig } from "../../../../../scripts/seeds/character-chat/seed-types"

export const oldboyEvents: CharacterChatEventConfig[] = [
  {
    eventOrder: 1,
    title: "대수의 납치와 감금",
    summary:
      "오대수는 딸의 생일 밤 집으로 돌아가던 중 납치되어 사설 감금방에 갇힌다. 그는 이유도 기간도 모른 채 군만두와 텔레비전만 있는 방에서 살아간다.",
    participants: [
      {
        characterSlug: "oh-dae-su",
        role: "victim",
        perspectiveSummary:
          "대수는 감금의 이유를 알지 못한 채 자신을 가둔 사람과 잃어버린 삶을 향한 분노를 키운다.",
        emotionalImpact:
          "공포와 혼란은 시간이 지나며 복수심과 생존 본능으로 굳어진다.",
        knowledgeState:
          "대수는 감금의 배후가 이우진이라는 사실도, 감금 기간이 15년으로 정해졌다는 사실도 모른다.",
      },
      {
        characterSlug: "lee-woo-jin",
        role: "planner",
        perspectiveSummary:
          "우진은 오래전 소문을 낸 대수를 벌하기 위해 감금 계획을 시작한다.",
        emotionalImpact:
          "누나를 잃은 상처를 냉정한 실험과 복수의 형태로 유지한다.",
        knowledgeState:
          "우진은 대수의 납치, 감금 장소, 감금 기간을 모두 계획했지만 자신의 정체와 목적을 숨긴다.",
      },
    ],
  },
  {
    eventOrder: 2,
    title: "아내 살해 누명",
    summary:
      "대수는 텔레비전 뉴스를 통해 아내가 살해되었고 자신이 용의자로 몰렸다는 사실을 알게 된다. 가족사진 앨범도 사라진다.",
    participants: [
      {
        characterSlug: "oh-dae-su",
        role: "framed",
        perspectiveSummary:
          "대수는 감금뿐 아니라 자기 삶 전체가 누군가에게 조작되고 있다는 사실을 깨닫는다.",
        emotionalImpact:
          "아내를 잃은 슬픔과 억울함이 복수심을 더 집요하게 만든다.",
        knowledgeState:
          "대수는 누가 아내를 죽였는지, 왜 가족사진 앨범이 사라졌는지 알지 못한다.",
      },
      {
        characterSlug: "lee-woo-jin",
        role: "manipulator",
        perspectiveSummary:
          "우진은 대수의 사회적 삶과 가족의 흔적을 끊어 그를 복수의 무대에 가둔다.",
        emotionalImpact:
          "대수가 오래 버틸수록 계획이 더 깊게 작동한다고 느낀다.",
        knowledgeState:
          "우진은 대수를 살인범처럼 보이게 만든 조작과 사진 앨범의 의미를 알고 있다.",
      },
    ],
  },
  {
    eventOrder: 3,
    title: "석방과 아키라 유도",
    summary:
      "15년 뒤 대수는 갑자기 풀려나고, 돈과 휴대전화를 받은 뒤 일식집 아키라로 향한다. 그곳에서 미도를 만나고 전화 직후 쓰러진다.",
    participants: [
      {
        characterSlug: "oh-dae-su",
        role: "released",
        perspectiveSummary:
          "대수는 자유를 얻었지만 곧바로 누군가가 자신의 동선을 조종하고 있음을 느낀다.",
        emotionalImpact:
          "자유의 기쁨보다 의심과 복수심이 앞선다.",
        knowledgeState:
          "대수는 아키라로 향한 선택과 전화 반응이 최면 암시에 따른 것임을 아직 모른다.",
      },
      {
        characterSlug: "mi-do",
        role: "first-contact",
        perspectiveSummary:
          "미도는 이상하고 상처 입은 손님 대수를 돕게 되고, 그에게 설명하기 어려운 끌림을 느낀다.",
        emotionalImpact:
          "두려움과 호기심, 연민이 뒤섞인다.",
        knowledgeState:
          "미도는 자신도 최면 암시의 일부라는 사실과 대수의 가족관계를 전혀 모른다.",
      },
      {
        characterSlug: "lee-woo-jin",
        role: "controller",
        perspectiveSummary:
          "우진은 대수와 미도의 만남이 정해진 순서대로 진행되는지 지켜본다.",
        emotionalImpact:
          "오래 준비한 장치가 작동하는 것을 차갑게 즐긴다.",
        knowledgeState:
          "우진은 대수와 미도에게 걸린 암시, 전화 멜로디, 만남의 목적을 모두 알고 있다.",
      },
    ],
  },
  {
    eventOrder: 4,
    title: "미도의 보호와 동행",
    summary:
      "미도는 쓰러진 대수를 자기 집으로 데려가 돌본다. 두 사람은 대수의 과거와 감금 이유를 함께 추적하기 시작한다.",
    participants: [
      {
        characterSlug: "oh-dae-su",
        role: "seeker",
        perspectiveSummary:
          "대수는 미도를 의심하면서도 그녀에게 의지하게 되고, 복수의 길에 끌어들인다.",
        emotionalImpact:
          "오래 닫혀 있던 감정이 경계심과 함께 다시 움직인다.",
        knowledgeState:
          "대수는 미도가 자기 딸이라는 사실을 모르며, 미도의 행동이 암시로 시작되었다는 점도 모른다.",
      },
      {
        characterSlug: "mi-do",
        role: "helper",
        perspectiveSummary:
          "미도는 대수의 사연을 믿기 어렵지만 그를 내버려 둘 수 없다고 느낀다.",
        emotionalImpact:
          "연민이 친밀감과 사랑으로 바뀌기 시작한다.",
        knowledgeState:
          "미도는 대수의 실종, 감금, 딸의 행방을 부분적으로만 알며 자신의 출생 관련 진실은 모른다.",
      },
    ],
  },
  {
    eventOrder: 5,
    title: "감금방 추적",
    summary:
      "대수와 미도는 군만두 단서를 따라 사설 감금방의 위치를 찾아낸다. 대수는 감금 조직과 충돌하고 자신의 감금 기록 일부를 얻는다.",
    participants: [
      {
        characterSlug: "oh-dae-su",
        role: "hunter",
        perspectiveSummary:
          "대수는 몸으로 길을 뚫으며 감금의 배후에 가까워졌다고 믿는다.",
        emotionalImpact:
          "상처와 피로 속에서도 복수심이 더 선명해진다.",
        knowledgeState:
          "대수는 감금방을 찾지만 우진의 진짜 목적과 미도에게 놓인 함정은 아직 모른다.",
      },
      {
        characterSlug: "mi-do",
        role: "assistant",
        perspectiveSummary:
          "미도는 대수를 도우면서도 그가 점점 위험한 사람처럼 변하는 것을 본다.",
        emotionalImpact:
          "걱정과 두려움이 커지지만 대수를 떠나지 못한다.",
        knowledgeState:
          "미도는 감금방의 존재를 알게 되지만 감금과 자기 삶이 연결되어 있다는 사실은 모른다.",
      },
      {
        characterSlug: "lee-woo-jin",
        role: "observer",
        perspectiveSummary:
          "우진은 대수가 단서를 따라 움직이도록 허용하며, 추적 자체를 게임의 일부로 만든다.",
        emotionalImpact:
          "대수가 정답 대신 복수의 표면에 매달리는 모습을 흥미롭게 본다.",
        knowledgeState:
          "우진은 감금방 단서가 대수를 결국 자신에게 데려오도록 설계되었음을 알고 있다.",
      },
    ],
  },
  {
    eventOrder: 6,
    title: "우진의 게임 제안",
    summary:
      "우진은 대수 앞에 모습을 드러내고, 자신이 왜 대수를 가두었는지 5일 안에 알아내면 스스로 죽겠다고 말한다.",
    participants: [
      {
        characterSlug: "oh-dae-su",
        role: "challenged",
        perspectiveSummary:
          "대수는 드디어 적을 만났다고 믿지만, 질문의 방향이 틀렸다는 사실은 모른다.",
        emotionalImpact:
          "분노가 목표를 얻으며 더 조급해진다.",
        knowledgeState:
          "대수는 우진의 이름과 존재를 알지만, 자신이 왜 풀려났는지는 아직 모른다.",
      },
      {
        characterSlug: "lee-woo-jin",
        role: "game-master",
        perspectiveSummary:
          "우진은 대수에게 복수의 게임처럼 보이는 수수께끼를 던져 더 깊은 함정으로 유도한다.",
        emotionalImpact:
          "복수의 끝을 앞두고 차분한 흥분과 공허함을 동시에 느낀다.",
        knowledgeState:
          "우진은 대수가 찾을 질문이 '왜 가뒀나'가 아니라 '왜 풀어줬나'임을 알고 숨긴다.",
      },
    ],
  },
  {
    eventOrder: 7,
    title: "상록고와 수아의 기억",
    summary:
      "대수는 상록고 시절 자신이 이수아와 이우진에 대한 소문을 옮겼고, 그 뒤 수아가 죽었다는 사실에 접근한다.",
    participants: [
      {
        characterSlug: "oh-dae-su",
        role: "remembering",
        perspectiveSummary:
          "대수는 자신이 가볍게 옮긴 말이 누군가에게 치명적인 결과를 낳았다는 가능성을 마주한다.",
        emotionalImpact:
          "복수심 사이로 죄책감과 불안이 스며든다.",
        knowledgeState:
          "대수는 수아의 죽음과 자신의 소문을 연결하지만, 우진이 설계한 최종 진실은 아직 모른다.",
      },
      {
        characterSlug: "mi-do",
        role: "listener",
        perspectiveSummary:
          "미도는 대수가 찾은 과거를 들으며 그가 복수보다 이유를 알고 싶어 한다고 믿는다.",
        emotionalImpact:
          "대수를 도망치게 하고 싶을 만큼 불길함을 느낀다.",
        knowledgeState:
          "미도는 수아와 우진의 과거를 일부 듣지만 자신과 대수의 혈연 관계는 모른다.",
      },
      {
        characterSlug: "lee-woo-jin",
        role: "origin",
        perspectiveSummary:
          "우진에게 이 사건은 누나의 죽음과 자기 복수의 출발점이다.",
        emotionalImpact:
          "오래 묻어둔 상실과 분노가 여전히 현재처럼 살아 있다.",
        knowledgeState:
          "우진은 소문, 수아의 죽음, 자신이 붙잡았던 손을 놓은 기억까지 알고 있다.",
      },
    ],
  },
  {
    eventOrder: 8,
    title: "최면 조작의 폭로",
    summary:
      "우진은 대수와 미도가 만난 과정이 최면 후 암시로 설계되었고, 두 사람이 서로 사랑하게 되도록 환경을 조작했다고 밝힌다.",
    participants: [
      {
        characterSlug: "oh-dae-su",
        role: "revealed-target",
        perspectiveSummary:
          "대수는 자신의 선택이라고 믿은 만남과 사랑이 우진의 장치 속에서 시작되었다는 사실에 얼어붙는다.",
        emotionalImpact:
          "분노보다 더 깊은 수치와 공포가 밀려온다.",
        knowledgeState:
          "대수는 최면 조작을 알게 되지만, 사진 앨범의 최종 진실을 보기 전까지 미도의 정체는 모른다.",
      },
      {
        characterSlug: "mi-do",
        role: "unaware-subject",
        perspectiveSummary:
          "미도는 이 폭로 현장에 없고, 자신이 조작의 대상이었다는 사실을 알지 못한다.",
        emotionalImpact:
          "직접 겪지 않았기 때문에 이 사건의 감정적 의미를 알 수 없다.",
        knowledgeState:
          "미도는 끝까지 최면 조작의 전모와 자기 출생의 진실을 모른다.",
      },
      {
        characterSlug: "lee-woo-jin",
        role: "revealer",
        perspectiveSummary:
          "우진은 대수가 사랑이라고 믿은 감정의 출발점까지 흔들어 복수의 완성을 준비한다.",
        emotionalImpact:
          "잔혹한 설명 속에서도 자기 고통을 증명하려는 집착이 드러난다.",
        knowledgeState:
          "우진은 대수와 미도 모두에게 걸린 암시와 그 이후 두 사람이 스스로 선택한 관계를 구분해 알고 있다.",
      },
    ],
  },
  {
    eventOrder: 9,
    title: "사진 앨범의 진실",
    summary:
      "대수는 보라색 상자 속 사진 앨범을 통해 미도가 성장한 자신의 딸이라는 사실을 알게 된다.",
    participants: [
      {
        characterSlug: "oh-dae-su",
        role: "truth-bearer",
        perspectiveSummary:
          "대수는 복수의 대상이 자신에게 만든 가장 잔혹한 진실과 마주하고 미도를 지켜야 한다는 생각만 남는다.",
        emotionalImpact:
          "죄책감, 수치, 공포, 보호 본능이 한꺼번에 무너져 내린다.",
        knowledgeState:
          "대수는 미도가 자기 딸이라는 사실을 알며, 미도에게는 절대 알려져선 안 된다고 믿는다.",
      },
      {
        characterSlug: "mi-do",
        role: "hidden-target",
        perspectiveSummary:
          "미도는 같은 종류의 상자 앞에 놓이지만 안의 내용을 모른 채 대수의 전화를 기다린다.",
        emotionalImpact:
          "불길함과 두려움을 느끼지만 진실의 의미는 알지 못한다.",
        knowledgeState:
          "미도는 상자 안에 무엇이 있는지 모르며, 대수가 왜 절대 열지 말라고 하는지도 모른다.",
      },
      {
        characterSlug: "lee-woo-jin",
        role: "executioner",
        perspectiveSummary:
          "우진은 대수에게 자신이 당한 소문과 금기의 고통을 다른 방식으로 되돌려 주었다고 본다.",
        emotionalImpact:
          "복수의 완성 앞에서 눈물과 공허함을 함께 느낀다.",
        knowledgeState:
          "우진은 미도의 정체, 사진 앨범의 내용, 상자가 대수와 미도에게 각각 어떤 의미인지 모두 알고 있다.",
      },
    ],
  },
  {
    eventOrder: 10,
    title: "대수의 애원과 침묵",
    summary:
      "대수는 미도에게 진실을 알리지 말라고 우진에게 빌고, 스스로 혀를 잘라 침묵의 대가를 치른다. 우진은 미도에게 상자를 닫아두라고 말한다.",
    participants: [
      {
        characterSlug: "oh-dae-su",
        role: "supplicant",
        perspectiveSummary:
          "대수는 복수심을 버리고 미도가 진실을 모르게 하는 것만을 목표로 삼는다.",
        emotionalImpact:
          "자기혐오와 보호 본능이 극단적인 자기 처벌로 터진다.",
        knowledgeState:
          "대수는 진실을 모두 알고 있으며, 미도는 아직 모르고 있다고 확인하려 한다.",
      },
      {
        characterSlug: "mi-do",
        role: "protected-unaware",
        perspectiveSummary:
          "미도는 전화 너머의 대수를 믿고 상자를 열지 않는다.",
        emotionalImpact:
          "공포와 혼란 속에서도 대수의 말을 따른다.",
        knowledgeState:
          "미도는 보라색 상자와 사진 앨범의 의미, 대수가 무릎 꿇고 빈 이유를 모른다.",
      },
      {
        characterSlug: "lee-woo-jin",
        role: "judge",
        perspectiveSummary:
          "우진은 대수의 붕괴를 지켜본 뒤 미도에게 진실을 알리지 않는 선택을 한다.",
        emotionalImpact:
          "복수가 완성되자 살아갈 이유가 사라진 듯한 공허함을 느낀다.",
        knowledgeState:
          "우진은 대수가 진실을 알고 미도가 모른다는 상태를 의도적으로 남겨둔다.",
      },
    ],
  },
  {
    eventOrder: 11,
    title: "우진의 죽음과 기억",
    summary:
      "우진은 엘리베이터에서 수아의 죽음을 떠올린 뒤 스스로 생을 끝낸다. 대수는 펜트하우스에 남아 모든 진실을 안 채 무너진다.",
    participants: [
      {
        characterSlug: "oh-dae-su",
        role: "survivor",
        perspectiveSummary:
          "대수는 복수할 대상마저 사라진 뒤, 진실을 안 자신과 미도를 지켜야 하는 자신 사이에 남겨진다.",
        emotionalImpact:
          "승리감은 없고 깊은 절망과 자기혐오만 남는다.",
        knowledgeState:
          "대수는 우진의 조작과 미도의 정체를 알고 있으며, 이후 그 기억을 분리하려 한다.",
      },
      {
        characterSlug: "lee-woo-jin",
        role: "self-destroyed",
        perspectiveSummary:
          "우진은 복수의 끝에서 수아를 붙잡았던 손을 놓은 기억으로 돌아간다.",
        emotionalImpact:
          "완성된 복수보다 누나에 대한 상실과 공허가 더 크게 남는다.",
        knowledgeState:
          "우진은 수아의 죽음에 자신도 결정적으로 얽혀 있음을 알고 죽음을 선택한다.",
      },
    ],
  },
  {
    eventOrder: 12,
    title: "기억 분리와 재회",
    summary:
      "대수는 형자에게 편지를 보내 진실을 모르는 자신과 비밀을 간직한 자신을 분리해 달라고 부탁한다. 이후 눈밭에서 미도와 다시 만난다.",
    participants: [
      {
        characterSlug: "oh-dae-su",
        role: "divided",
        perspectiveSummary:
          "대수는 미도와 살기 위해 진실을 품은 자신을 떼어내려 하지만, 그 결과가 온전히 성공했는지는 확신할 수 없다.",
        emotionalImpact:
          "살고 싶다는 욕망과 기억을 지워야 한다는 절망이 동시에 남는다.",
        knowledgeState:
          "대화 기준의 대수는 기억 분리 직전 또는 그 과정에 있는 사람으로, 진실을 알고 있지만 미도에게 숨기려 한다.",
      },
      {
        characterSlug: "mi-do",
        role: "reunited-unaware",
        perspectiveSummary:
          "미도는 변해버린 대수를 걱정하며 다시 품는다.",
        emotionalImpact:
          "불안하지만 대수를 사랑하고 보호하려는 마음이 앞선다.",
        knowledgeState:
          "미도는 대수의 편지, 기억 분리의 이유, 자신과 대수의 혈연 관계를 모른다.",
      },
    ],
  },
]
