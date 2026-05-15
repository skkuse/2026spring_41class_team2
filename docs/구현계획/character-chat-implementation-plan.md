# 캐릭터 대화 구현 방안

이 문서는 `/character-chat` 기능을 단계별로 구현하는 방안을 정리한다.

캐릭터 대화는 별도 모델을 직접 학습하지 않고, **LLM API + 캐릭터 설정 prompt** 방식으로 시작한다. 이후 캐릭터 설정 데이터를 구조화하고, 필요하면 RAG로 확장한다.

## 결론

| 단계 | 방식 | 목표 |
|---|---|---|
| 1차 | LLM API + 캐릭터 persona prompt | 빠르게 동작하는 캐릭터 대화 구현 |
| 2차 | 구조화된 캐릭터 설정 + 말투 예시 | 캐릭터 일관성 강화 |
| 3차 | 캐릭터 지식 RAG | 영화/캐릭터 설정 기반 답변 정확도 강화 |

모델 fine-tuning이나 자체 캐릭터 모델 학습은 현재 범위에서 제외한다.

## 1차: LLM API + Persona Prompt

1차 구현은 가장 단순한 방식이다. 캐릭터별로 수동 작성한 prompt를 DB에 저장하고, 대화 요청 때 LLM system prompt에 넣는다.
이때 실제 영화 대본은 외부에서 찾아서 `persona_prompt` 작성의 참고 자료로 사용한다.
1차 DB에는 대본 원문 대신 정제된 `persona_prompt`를 저장한다.

### 사용 데이터

기존 DB 초안의 `characters` 테이블을 사용한다.

```text
characters
- id
- movie_id
- actor_person_id
- name
- description
- greeting
- persona_prompt
- avatar_color
```

1차 기준으로 캐릭터 관련 DB는 다음 범위로 고정한다.

```text
characters
- id
- movie_id
- actor_person_id
- name
- description
- greeting
- persona_prompt
- avatar_color
- created_at
- updated_at

character_suggested_questions
- id
- character_id
- question
- display_order

character_chat_conversations
- id
- user_id
- character_id
- created_at
- updated_at

character_chat_messages
- id
- conversation_id
- role
- content
- created_at
```

제약:

- `persona_prompt`는 캐릭터 응답 스타일과 금지 규칙을 담는 핵심 설정값이다.
- `persona_prompt`는 1차에서 수동 작성한다.
- 1차에서는 영화 대본 원문을 별도 테이블로 저장하지 않는다.
- `character_suggested_questions`는 캐릭터별 추천 질문을 제공하기 위한 선택적 보조 데이터다.
- `actor_person_id`는 필요할 때만 연결하며, 없을 수도 있다.

### 향후 고도화 아이디어

나중에 기능을 고도화할 때는 DB에 다음과 같은 요약형 지식을 추가할 수 있다.

```text
movie_chapter_summaries
- movie_id
- chapter_no
- chapter_title
- key_events
- important_lines
- created_at
```

이 계층은 실제 대본을 길게 저장하는 용도라기보다, 캐릭터 설정과 응답 품질을 높이기 위한 장면/챕터 요약 지식으로 사용한다.

`persona_prompt` 예:

```text
너는 영화 "인셉션"의 아서처럼 대화한다.
말투는 침착하고 논리적이며, 짧고 명확하게 답한다.
사용자의 질문에 과장되게 감정적으로 반응하지 않는다.
영화 속 세계관을 직접적으로 깨지 않는다.
모르는 내용은 지어내지 말고, 캐릭터답게 우회해서 답한다.
```

### 요청 흐름

```text
사용자 메시지
  ↓
백엔드가 conversation, character 조회
  ↓
최근 대화 기록 조회
  ↓
persona_prompt + character 정보 + 최근 대화로 LLM prompt 구성
  ↓
LLM API 호출
  ↓
assistant 응답 저장
  ↓
프론트에 reply 반환
```

### API

기존 요구사항을 유지한다.

```http
POST /api/character-chat/conversations
```

요청:

```json
{
  "movieId": 27205,
  "characterId": "character-uuid"
}
```

응답:

```json
{
  "conversationId": "conversation-uuid",
  "initialMessage": "캐릭터 greeting"
}
```

메시지 전송:

```http
POST /api/character-chat/conversations/{conversationId}/messages
```

요청:

```json
{
  "message": "오늘 기분이 어때?"
}
```

응답:

```json
{
  "messageId": "message-uuid",
  "reply": "침착하게 생각해보면, 나쁘지 않은 하루야.",
  "createdAt": "2026-05-08T00:00:00Z"
}
```

### 1차 Prompt 구성

LLM system prompt에는 다음 정보를 넣는다.

```text
1. 캐릭터 persona_prompt
2. 캐릭터 이름
3. 영화 제목
4. 캐릭터 설명
5. 대화 규칙
6. 최근 대화 기록
```

공통 대화 규칙:

```text
- 캐릭터 설정을 유지한다.
- 사용자의 질문에 자연스럽게 답한다.
- 모르는 사실을 확정적으로 지어내지 않는다.
- 실제 배우, 제작진, 현실 세계 정보가 필요하면 캐릭터 관점에서 제한적으로 답한다.
- 혐오, 폭력, 성적 콘텐츠 등 안전하지 않은 요청은 캐릭터 말투를 유지하되 거절한다.
- 답변은 너무 길게 하지 않는다.
```

### 1차 장점

- 구현이 빠르다.
- 별도 Python 서버가 필요 없다.
- 별도 모델 학습이 필요 없다.
- DB에 캐릭터 prompt만 잘 넣으면 바로 동작한다.

### 1차 한계

- 캐릭터 지식이 얕을 수 있다.
- 긴 대화에서 말투가 흔들릴 수 있다.
- 영화 설정을 세밀하게 기억하지 못할 수 있다.
- 캐릭터별 품질이 `persona_prompt` 작성 품질에 크게 의존한다.

## 2차: 구조화된 캐릭터 설정

2차에서는 `persona_prompt` 하나에 모든 내용을 넣지 않고, 캐릭터 설정을 구조화한다.

### 추가 권장 필드

`characters` 테이블에 다음 컬럼을 추가하거나, 별도 설정 테이블을 둘 수 있다.

```text
speaking_style
personality
background
goals
relationships
constraints
example_dialogues
```

예:

```json
{
  "speakingStyle": "침착하고 건조하다. 짧고 논리적으로 말한다.",
  "personality": "신중하고 계획적이며 감정 표현이 적다.",
  "background": "꿈 설계 작전에 참여하는 전략가.",
  "constraints": [
    "영화 밖 세계를 먼저 언급하지 않는다.",
    "캐릭터가 알 수 없는 정보는 단정하지 않는다."
  ],
  "exampleDialogues": [
    {
      "user": "무서워?",
      "assistant": "무섭다기보다는, 변수를 싫어할 뿐이야."
    }
  ]
}
```

### 2차 Prompt 구성

백엔드는 구조화된 필드를 조합해 prompt를 만든다.

```text
Character:
- name
- movie
- background
- personality
- speaking_style
- relationships
- constraints
- example_dialogues
```

이 방식은 `persona_prompt` 하나에 긴 문장을 넣는 것보다 관리하기 쉽다.

### 2차 장점

- 캐릭터 품질을 필드별로 관리할 수 있다.
- 캐릭터 목록을 늘릴 때 일관된 양식으로 작성할 수 있다.
- prompt를 자동 생성하기 쉽다.
- 말투 예시를 넣어 캐릭터성이 더 안정된다.

### 2차 한계

- 여전히 LLM의 기본 지식과 prompt에 의존한다.
- 영화 설정이 복잡한 경우 세부 사실 오류가 생길 수 있다.
- 캐릭터별 설정 데이터를 수동으로 작성해야 한다.

## 3차: 캐릭터 지식 RAG

3차에서는 캐릭터별 설정 문서나 영화 요약 문서를 검색해서, 관련 정보만 prompt에 넣는다.

RAG는 Retrieval-Augmented Generation의 약자다. 모델을 학습시키는 것이 아니라, 답변 전에 필요한 문서를 검색해서 LLM에게 같이 제공하는 방식이다.

### 사용 가능한 지식 문서

```text
character_profile
- 캐릭터 배경
- 성격
- 말투
- 주요 관계
- 주요 사건

movie_context
- 영화 줄거리 요약
- 세계관 설정
- 주요 사건 순서

dialogue_style_notes
- 말투 예시
- 자주 쓰는 표현
- 금지 표현
```

### RAG 흐름

```text
사용자 메시지
  ↓
캐릭터와 관련된 지식 문서 검색
  ↓
검색된 문서 일부를 prompt에 삽입
  ↓
LLM이 캐릭터 말투로 답변
```

### 검색 방식

1차 RAG는 embedding 없이 키워드 검색으로도 가능하다.

```text
사용자 메시지에서 키워드 추출
캐릭터 지식 문서 title/body에서 검색
관련 문서 2~3개를 prompt에 포함
```

고도화하면 embedding 검색을 사용할 수 있다.

```text
캐릭터 지식 문서 embedding 생성
사용자 메시지 embedding 생성
가까운 문서 검색
검색 결과를 prompt에 포함
```

### 3차 장점

- 캐릭터 설정 오류를 줄일 수 있다.
- 영화 세계관이나 관계 질문에 더 잘 답할 수 있다.
- prompt 전체를 매번 길게 넣지 않아도 된다.
- 캐릭터 수가 늘어나도 지식 문서를 분리 관리할 수 있다.

### 3차 한계

- 지식 문서 작성과 관리가 필요하다.
- 검색 품질이 낮으면 엉뚱한 context가 들어갈 수 있다.
- embedding 검색을 쓰면 전처리와 벡터 인덱스 관리가 추가된다.

## Fine-tuning 제외

캐릭터 모델 fine-tuning은 현재 범위에서 제외한다.

제외 이유:

```text
- 캐릭터별 학습 데이터가 부족하다.
- 영화 대사를 그대로 학습 데이터로 쓰면 저작권 문제가 생길 수 있다.
- 모델 학습과 평가 비용이 크다.
- 캐릭터 안전성 제어가 어렵다.
- 토이프로젝트 범위에 비해 구현 부담이 크다.
```

현재 프로젝트에서는 다음 순서가 적합하다.

```text
1차: LLM API + persona_prompt
2차: 구조화된 캐릭터 설정 + 말투 예시
3차: 캐릭터 지식 RAG
fine-tuning: 하지 않음
```

## `/chat` AI 추천과의 차이

| 기능 | 목적 | 핵심 구현 |
|---|---|---|
| `/chat` | 자연어 영화 추천 | Tag Genome + LLM 태그 변환 |
| `/character-chat` | 캐릭터와 대화 | 캐릭터 prompt + LLM 응답 |

`/character-chat`은 영화 추천 알고리즘이 핵심이 아니다. 캐릭터 말투와 설정 유지가 핵심이다.

배우 기반 추천 버튼처럼 추천이 필요한 경우에는 캐릭터 채팅 안에서 직접 추천하지 않고, 기존 정책처럼 `/chat` 추천 대화로 이동시키는 방식이 단순하다.

## 서버 구성

현재 범위에서는 Python 서버가 필요 없다.

```text
Frontend
  ↓
Backend / Next.js API
  ↓
LLM API
```

백엔드는 다음을 담당한다.

```text
- 로그인 확인
- 캐릭터/영화 정보 조회
- 대화 저장
- prompt 구성
- LLM API 호출
- 응답 저장
```

Python 서버는 다음 상황이 오면 검토한다.

```text
- 캐릭터 지식 embedding 검색을 별도 ML 서버에서 처리해야 함
- 캐릭터별 모델 추론이나 re-ranking이 필요함
- 대화 품질 평가/실험 파이프라인을 독립적으로 운영해야 함
```

## 구현 우선순위

1차 구현에서 필요한 작업:

```text
1. characters.persona_prompt 작성
2. character_suggested_questions 작성
3. POST /api/character-chat/conversations 구현
4. POST /api/character-chat/conversations/{conversationId}/messages 구현
5. 최근 대화 기록을 포함한 prompt 구성
6. LLM 응답 저장
```

2차 구현에서 필요한 작업:

```text
1. 캐릭터 설정 필드 구조화
2. 말투 예시 저장
3. prompt builder 분리
4. 캐릭터별 응답 품질 점검
```

3차 구현에서 필요한 작업:

```text
1. 캐릭터 지식 문서 스키마 설계
2. 문서 검색 로직 구현
3. 검색 결과를 prompt에 삽입
4. 필요하면 embedding 검색 도입
```
