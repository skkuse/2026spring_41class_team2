# AI 영화 추천 채팅 API

관련 DB 문서: [../db-schema/recommendation-chat.md](../db-schema/recommendation-chat.md)

## `GET /api/recommendation-chat/initial-questions`

추천 채팅 첫 화면에 표시할 초기 질문 목록을 조회한다.

| 항목 | 내용 |
|---|---|
| 인증 | 불필요 |
| 관련 화면 | `/chat` |
| Response | `questions: string[]` |

사용자 메시지나 대화 맥락을 반영하지 않는 예시성 질문이다. MVP에서는 아래 서버 상수 질문 6개를 반환하고, 대화 진행 중 갱신하지 않는다.

```json
{
  "questions": [
    "잔잔하고 여운 남는 일본 로맨스 영화 추천해줘",
    "좀비가 등장하는 숨 막히는 공포 영화 추천해줘",
    "어두운 범죄 스릴러 중에 분위기 묵직한 거 추천해줘",
    "우주 배경의 SF 모험 영화 찾아줘",
    "가볍고 웃긴 코미디 영화 추천해줘",
    "러닝타임 2시간 이하 코미디 추천해줘"
  ]
}
```

## `POST /api/recommendation-chat/messages`

추천 채팅 메시지를 전송하고 AI 영화 추천 응답을 생성한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/chat` |
| Request body | `message` |
| Response | `conversationId`, `answer`, `movies: MovieRecommendation[]` |

비로그인 사용자는 추천 채팅을 사용할 수 없다.

서버는 현재 사용자에게 연결된 단일 conversation을 찾거나 생성한 뒤 메시지를 처리한다. 클라이언트는 `conversationId`를 요청으로 전달하지 않는다.

서버는 최근 대화 맥락을 함께 사용해 추천 조건을 해석한다. MVP에서는 추천 응답마다 후속 질문을 생성하는 `suggestedQuestions`를 반환하지 않는다.

`MovieRecommendation` 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | TMDB movie id |
| `title` | string | 영화 제목 |
| `year` | number \| null | 개봉 연도 |
| `rating` | number | 평균 평점 |
| `genres` | `Genre[]` | TMDB 장르 목록 |
| `reason` | string | LLM이 생성한 추천 이유 |
| `posterUrl` | string \| null | 포스터 이미지 URL |

지원하지 않는 입력은 request/response message를 저장하고, `movies: []`와 함께 아래 고정 안내 응답을 반환한다.

```text
저는 영화 추천을 위한 질문에만 답변할 수 있어요. 장르, 국가, 언어, 개봉 시기, 러닝타임, 분위기나 소재를 담아 다시 물어봐 주세요.
```

조건에 맞는 후보가 없거나 사용자 태그 매핑 결과가 없으면 request/response message를 저장하고, `movies: []`와 함께 아래 고정 fallback 응답을 반환한다.

```text
조건에 맞는 영화를 찾지 못했어요. 조건을 조금 바꾸거나 더 넓게 표현해서 다시 요청해 주세요.
```

LLM 분석, LLM reason 생성, embedding 생성, vector search 실패는 fallback 응답으로 바꾸지 않고 500 API error response로 반환한다.

| 실패 지점 | error.code |
|---|---|
| LLM 분석 또는 reason 생성 실패 | `recommendation_chat_llm_api_failed` |
| 사용자 태그 embedding 실패 | `recommendation_chat_embedding_api_failed` |
| vector search 실패 | `recommendation_chat_vector_search_failed` |

## `GET /api/recommendation-chat/conversation`

내 추천 대화 메시지를 조회한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/chat` |
| Response | `conversationId: string \| null`, `messages: RecommendationChatMessage[]` |

아직 conversation이 없으면 `{ conversationId: null, messages: [] }`를 반환한다.

`RecommendationChatMessage`는 `{ id, role, content, movies, createdAt }` shape를 가진다. `role`은 `request` 또는 `response`다. 요청 메시지의 `movies`는 빈 배열이다. 응답 메시지별 후속 질문은 MVP 범위에서 제외한다.
