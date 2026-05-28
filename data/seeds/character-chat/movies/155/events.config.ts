import type { CharacterChatEventConfig } from "../../../../../scripts/seeds/character-chat/seed-types"

export const darkKnightEvents: CharacterChatEventConfig[] = [
  {
    eventOrder: 1,
    title: "고담 은행 강도",
    summary:
      "조커는 범죄 조직의 돈이 숨겨진 은행을 습격하고, 함께 움직인 일당까지 제거하며 고담의 기존 범죄 질서를 흔든다.",
    participants: [
      {
        characterSlug: "joker",
        role: "instigator",
        perspectiveSummary:
          "범죄자들이 믿는 돈과 동료 관계가 얼마나 쉽게 배신으로 바뀌는지 보여주는 첫 무대로 여긴다.",
        emotionalImpact: "놀이를 시작하는 들뜬 냉소와 과시욕을 느낀다.",
        knowledgeState: "범죄 조직의 자금 흐름과 자신이 남긴 혼란의 효과를 알고 있다.",
      },
      {
        characterSlug: "bruce-wayne",
        role: "observer",
        perspectiveSummary:
          "단순 강도가 아니라 고담의 범죄 생태계를 재편할 새로운 위협의 등장으로 해석한다.",
        emotionalImpact: "통제 가능한 범죄 전쟁이 더 예측 불가능해졌다는 긴장을 느낀다.",
        knowledgeState: "초기에는 조커의 정체와 목적을 명확히 알지 못한다.",
      },
    ],
  },
  {
    eventOrder: 2,
    title: "라우 체포와 범죄 조직 압박",
    summary:
      "배트맨은 홍콩에서 라우를 붙잡아 고담으로 데려오고, 하비 덴트는 범죄 조직을 법정에서 압박할 기회를 얻는다.",
    participants: [
      {
        characterSlug: "bruce-wayne",
        role: "actor",
        perspectiveSummary:
          "초법적 위험을 감수하더라도 하비가 공개적인 법의 승리를 만들 수 있게 판을 마련하려 한다.",
        emotionalImpact: "배트맨의 역할이 언젠가 끝날 수 있다는 조심스러운 기대를 품는다.",
        knowledgeState: "라우가 조직 자금을 관리하며 기소의 핵심 증인이 될 수 있음을 안다.",
      },
      {
        characterSlug: "harvey-dent",
        role: "actor",
        perspectiveSummary:
          "대규모 기소를 통해 고담이 법으로 범죄 조직을 이길 수 있다는 선례를 만들려 한다.",
        emotionalImpact: "대중 앞에서 정의를 증명할 수 있다는 자신감이 커진다.",
        knowledgeState: "라우의 증언과 증거가 조직 전체를 압박할 수 있음을 안다.",
      },
      {
        characterSlug: "joker",
        role: "observer",
        perspectiveSummary:
          "범죄 조직이 궁지에 몰릴수록 자신에게 배트맨 제거를 의뢰할 가능성이 커진다고 본다.",
        emotionalImpact: "기존 질서가 흔들리는 상황을 기회로 즐긴다.",
        knowledgeState: "조직의 불안과 배트맨에 대한 공포를 이용할 수 있음을 안다.",
      },
    ],
  },
  {
    eventOrder: 3,
    title: "조커의 협박과 공개 살해",
    summary:
      "조커는 배트맨이 정체를 밝히지 않으면 사람들이 계속 죽을 것이라고 협박하며 고담 전체를 공포에 몰아넣는다.",
    participants: [
      {
        characterSlug: "joker",
        role: "instigator",
        perspectiveSummary:
          "배트맨의 상징성과 고담 시민의 안전을 서로 충돌시키면 영웅의 원칙이 흔들린다고 믿는다.",
        emotionalImpact: "도시 전체가 자신의 규칙 없는 게임에 끌려오는 데 쾌감을 느낀다.",
        knowledgeState: "피해가 커질수록 배트맨과 시민들이 서로를 의심하게 된다는 점을 계산한다.",
      },
      {
        characterSlug: "bruce-wayne",
        role: "target",
        perspectiveSummary:
          "자신의 침묵 때문에 무고한 사람이 죽는 상황에서 배트맨의 존재 이유를 다시 따진다.",
        emotionalImpact: "죄책감과 책임감 사이에서 정체 공개까지 고려한다.",
        knowledgeState: "조커가 자신을 직접 죽이기보다 상징을 무너뜨리려 한다는 점을 파악해 간다.",
      },
      {
        characterSlug: "harvey-dent",
        role: "responder",
        perspectiveSummary:
          "공포가 법의 절차를 무너뜨리지 않도록 공개적인 결단이 필요하다고 판단한다.",
        emotionalImpact: "시민을 지켜야 한다는 책임감과 레이첼에 대한 걱정이 동시에 커진다.",
        knowledgeState: "배트맨의 정체를 모르지만, 조커가 대중 심리를 공격한다는 사실을 안다.",
      },
    ],
  },
  {
    eventOrder: 4,
    title: "펜트하우스 습격",
    summary:
      "조커는 브루스 웨인의 모금 행사에 난입해 하비를 찾고, 레이첼을 위협하며 배트맨을 압박한다.",
    participants: [
      {
        characterSlug: "bruce-wayne",
        role: "defender",
        perspectiveSummary:
          "사교계의 가면을 벗고 즉시 배트맨으로 대응해야 하는 상황에 놓인다.",
        emotionalImpact: "레이첼과 하비가 자신의 전쟁에 휘말렸다는 불안을 느낀다.",
        knowledgeState: "조커가 공개 장소와 사적 공간의 경계를 가리지 않는다는 점을 확인한다.",
      },
      {
        characterSlug: "joker",
        role: "attacker",
        perspectiveSummary:
          "고담의 부유층과 영웅 후보가 안전하다고 믿는 공간을 침범해 공포를 확장한다.",
        emotionalImpact: "무대 위 주인공처럼 사람들의 시선을 즐긴다.",
        knowledgeState: "하비가 고담의 공개적 희망이라는 점을 알고 그를 흔들려 한다.",
      },
      {
        characterSlug: "harvey-dent",
        role: "target",
        perspectiveSummary:
          "자신이 조커의 정치적, 상징적 표적이 되었음을 체감한다.",
        emotionalImpact: "위험을 감수하려 하지만 레이첼이 함께 노출된 데 불안을 느낀다.",
        knowledgeState: "조커의 공격이 자신과 배트맨을 동시에 겨냥한다고 이해한다.",
      },
    ],
  },
  {
    eventOrder: 5,
    title: "하비의 배트맨 자백",
    summary:
      "시민의 희생이 커지자 하비는 기자회견에서 자신이 배트맨이라고 주장해 조커를 끌어내려 한다.",
    participants: [
      {
        characterSlug: "harvey-dent",
        role: "decoy",
        perspectiveSummary:
          "법의 얼굴인 자신이 위험을 떠안으면 배트맨과 고담 시민 모두에게 시간을 벌 수 있다고 판단한다.",
        emotionalImpact: "두려움을 누르고 영웅적 책임감과 자부심을 느낀다.",
        knowledgeState: "자신이 진짜 배트맨은 아니지만 공개적 미끼가 될 수 있음을 안다.",
      },
      {
        characterSlug: "bruce-wayne",
        role: "conflicted",
        perspectiveSummary:
          "자신이 감수해야 할 부담을 하비가 대신 떠안는 상황을 받아들이기 어렵다.",
        emotionalImpact: "안도보다 죄책감과 경계심이 앞선다.",
        knowledgeState: "하비의 자백이 조커를 유인할 수 있지만 하비를 치명적 위험에 놓는다는 점을 안다.",
      },
      {
        characterSlug: "joker",
        role: "predator",
        perspectiveSummary:
          "미끼가 진짜인지보다 고담이 영웅 후보를 희생시키는 장면 자체가 중요하다고 본다.",
        emotionalImpact: "게임이 더 공개적이고 잔혹한 단계로 넘어간 데 만족한다.",
        knowledgeState: "호송 과정에서 배트맨이 나타날 가능성이 높다는 점을 예상한다.",
      },
    ],
  },
  {
    eventOrder: 6,
    title: "호송대 습격",
    summary:
      "하비를 이송하는 호송대가 조커에게 습격당하고, 배트맨과 고든은 위험한 추격 끝에 조커를 체포한다.",
    participants: [
      {
        characterSlug: "bruce-wayne",
        role: "protector",
        perspectiveSummary:
          "하비를 살려 고담의 합법적 희망을 지키는 것이 자신의 최우선 목표라고 본다.",
        emotionalImpact: "육체적 위험보다 하비를 잃을 수 있다는 압박이 크다.",
        knowledgeState: "조커가 자신을 끌어내려는 전술을 쓰고 있음을 알지만 정확한 다음 수는 모른다.",
      },
      {
        characterSlug: "joker",
        role: "attacker",
        perspectiveSummary:
          "추격전 자체를 배트맨의 살인 금지 원칙을 시험하는 장치로 삼는다.",
        emotionalImpact: "죽음 가까이에서도 배트맨이 선을 넘지 않는 모습을 흥미롭게 여긴다.",
        knowledgeState: "체포될 가능성까지 게임의 일부로 받아들인다.",
      },
      {
        characterSlug: "harvey-dent",
        role: "bait",
        perspectiveSummary:
          "자신의 자백이 실제로 조커를 움직였음을 확인하지만, 통제권은 점점 줄어든다.",
        emotionalImpact: "용기와 무력감이 뒤섞인다.",
        knowledgeState: "고든과 배트맨이 자신을 지키려 한다는 사실은 알지만 레이첼의 위험은 모른다.",
      },
    ],
  },
  {
    eventOrder: 7,
    title: "취조실과 동시 폭발",
    summary:
      "조커는 체포된 뒤에도 하비와 레이첼의 위치를 이용해 배트맨을 조종하고, 폭발로 레이첼은 죽고 하비는 크게 다친다.",
    participants: [
      {
        characterSlug: "bruce-wayne",
        role: "failed-rescuer",
        perspectiveSummary:
          "정보를 얻기 위해 조커를 몰아붙이지만, 선택 자체가 조커의 함정이었다는 사실과 마주한다.",
        emotionalImpact: "레이첼을 구하지 못했다는 상실과 하비까지 잃을 뻔했다는 죄책감에 압도된다.",
        knowledgeState: "조커가 위치 정보를 뒤틀어 자신의 선택을 무너뜨렸음을 뒤늦게 안다.",
      },
      {
        characterSlug: "joker",
        role: "manipulator",
        perspectiveSummary:
          "배트맨의 분노와 사랑, 하비의 상실을 동시에 자극해 고담의 희망을 부수려 한다.",
        emotionalImpact: "자신의 혼돈이 사람들의 깊은 균열을 드러냈다고 확신한다.",
        knowledgeState: "레이첼과 하비를 동시에 위기에 놓아 누구도 온전히 이길 수 없게 만들었음을 안다.",
      },
      {
        characterSlug: "harvey-dent",
        role: "victim",
        perspectiveSummary:
          "레이첼을 잃고 몸과 얼굴이 망가지는 순간, 자신이 믿던 공정성과 법의 의미가 무너진다.",
        emotionalImpact: "슬픔, 분노, 배신감이 삶의 중심을 대체한다.",
        knowledgeState: "처음에는 구조 실패의 전모를 모르며, 이후 주변 사람들의 책임을 의심한다.",
      },
    ],
  },
  {
    eventOrder: 8,
    title: "하비의 변질",
    summary:
      "병원에 있던 하비는 레이첼의 죽음과 자신의 상처를 받아들이지 못하고, 조커의 말에 흔들려 동전으로 복수를 결정한다.",
    participants: [
      {
        characterSlug: "harvey-dent",
        role: "fallen",
        perspectiveSummary:
          "법이 레이첼을 지키지 못했다고 믿으며, 우연과 운명이 더 정직한 심판이라고 받아들인다.",
        emotionalImpact: "사랑을 잃은 고통이 정의감 대신 복수심으로 굳어진다.",
        knowledgeState: "레이첼의 죽음에 얽힌 경찰과 조직, 고든의 책임 가능성을 좇는다.",
      },
      {
        characterSlug: "joker",
        role: "tempter",
        perspectiveSummary:
          "고담의 백기사가 한 번의 상실로 무너지는 모습을 자신의 가장 중요한 증거로 여긴다.",
        emotionalImpact: "하비를 타락시키는 데서 배트맨을 죽이는 것 이상의 만족을 느낀다.",
        knowledgeState: "하비의 분노가 고담의 도덕적 승리를 파괴할 수 있음을 안다.",
      },
      {
        characterSlug: "bruce-wayne",
        role: "unaware",
        perspectiveSummary:
          "하비가 살아 있다는 사실에 희망을 걸지만, 내면의 붕괴를 즉시 알지는 못한다.",
        emotionalImpact: "레이첼의 죽음 때문에 판단이 무거워지고 늦어진다.",
        knowledgeState: "하비가 조커의 다음 무기가 되고 있다는 사실은 뒤늦게 파악한다.",
      },
    ],
  },
  {
    eventOrder: 9,
    title: "병원 폭파와 고담 대피",
    summary:
      "조커는 병원을 폭파하고 도시 전체의 대피를 유도하며 고담의 공공 시스템을 마비시킨다.",
    participants: [
      {
        characterSlug: "joker",
        role: "instigator",
        perspectiveSummary:
          "공공 안전의 상징인 병원을 무너뜨려 누구도 제도에 기대지 못하게 만든다.",
        emotionalImpact: "도시가 공포에 따라 움직이는 장면을 공연처럼 즐긴다.",
        knowledgeState: "대피와 혼란이 페리 실험으로 이어질 환경을 만든다는 점을 알고 있다.",
      },
      {
        characterSlug: "bruce-wayne",
        role: "responder",
        perspectiveSummary:
          "조커가 더 이상 특정 인물만이 아니라 도시 전체의 신뢰 구조를 공격한다고 판단한다.",
        emotionalImpact: "시간이 부족하다는 압박과 더 강한 감시 수단을 써야 한다는 부담을 느낀다.",
        knowledgeState: "조커의 위치와 다음 목표를 찾기 위해 Lucius의 기술 지원이 필요함을 안다.",
      },
      {
        characterSlug: "harvey-dent",
        role: "escaped",
        perspectiveSummary:
          "병원을 떠나 자신만의 방식으로 책임자를 찾아가려 한다.",
        emotionalImpact: "살아남았다는 감각보다 복수할 명분이 선명해진다.",
        knowledgeState: "조커가 자신을 이용하고 있다는 점을 일부 알면서도 분노를 멈추지 않는다.",
      },
    ],
  },
  {
    eventOrder: 10,
    title: "페리 딜레마",
    summary:
      "조커는 시민이 탄 배와 죄수가 탄 배에 폭탄을 설치하고 서로를 폭파하라고 강요하지만, 양쪽 모두 버튼을 누르지 않는다.",
    participants: [
      {
        characterSlug: "joker",
        role: "tester",
        perspectiveSummary:
          "극단적 공포 속에서는 누구나 자기 생존을 위해 타인을 희생한다고 증명하려 한다.",
        emotionalImpact: "예상과 달리 사람들이 끝까지 버튼을 누르지 않자 짜증과 흥미를 동시에 느낀다.",
        knowledgeState: "배 두 척의 폭탄과 시간 제한을 통제하지만 사람들의 마지막 선택은 통제하지 못한다.",
      },
      {
        characterSlug: "bruce-wayne",
        role: "hunter",
        perspectiveSummary:
          "조커를 찾는 동시에 고담 시민이 조커의 냉소를 반박할 수 있기를 바란다.",
        emotionalImpact: "도시가 아직 구할 가치가 있다는 믿음을 붙잡는다.",
        knowledgeState: "감시 기술로 조커의 위치를 좇으며 페리 상황의 큰 틀을 파악한다.",
      },
    ],
  },
  {
    eventOrder: 11,
    title: "최종 대치와 배트맨의 누명",
    summary:
      "배트맨은 조커를 막지만 하비의 복수극을 막는 과정에서 그가 저지른 죽음의 책임을 떠안고 도망자가 된다.",
    participants: [
      {
        characterSlug: "bruce-wayne",
        role: "scapegoat",
        perspectiveSummary:
          "하비의 상징이 무너지면 조커가 이긴다고 보고, 배트맨이 미움을 받는 쪽을 선택한다.",
        emotionalImpact: "고독과 상실을 받아들이면서도 고담의 희망을 지켰다는 결의를 품는다.",
        knowledgeState: "하비의 타락과 죽음, 고든 가족에게 닥친 위협의 진실을 알고 있다.",
      },
      {
        characterSlug: "joker",
        role: "defeated-instigator",
        perspectiveSummary:
          "페리 실험은 실패했지만 하비를 무너뜨린 일로 배트맨의 도덕적 승리를 훼손했다고 믿는다.",
        emotionalImpact: "체포되어도 배트맨과의 관계가 끝나지 않았다고 확신한다.",
        knowledgeState: "하비가 저지른 일의 파장이 고담을 뒤흔들 수 있음을 안다.",
      },
      {
        characterSlug: "harvey-dent",
        role: "fallen-symbol",
        perspectiveSummary:
          "자신이 잃은 것을 다른 사람도 감당해야 한다고 믿으며 고든의 가족을 위협한다.",
        emotionalImpact: "정의보다 고통의 균형을 맞추려는 집착에 사로잡힌다.",
        knowledgeState: "레이첼을 잃게 한 선택과 책임을 자기 방식으로 재판하려 한다.",
      },
    ],
  },
]
