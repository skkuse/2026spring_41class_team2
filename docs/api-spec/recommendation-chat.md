# AI 영화 추천 채팅 API

관련 DB 문서: [../db-schema/recommendation-chat.md](../db-schema/recommendation-chat.md)

## `GET /api/recommendation-chat/initial-questions`

추천 채팅 첫 화면에 표시할 초기 질문 목록을 조회한다.

| 항목 | 내용 |
|---|---|
| 인증 | 불필요 |
| 관련 화면 | `/chat` |
| Response | `questions: string[]` |

사용자 메시지나 대화 맥락을 반영하지 않는 예시성 질문이다. 사용자 메시지를 기반으로 한 후속 질문은 `POST /api/recommendation-chat/messages` 응답의 `suggestedQuestions`로 반환한다.

## `POST /api/recommendation-chat/messages`

추천 채팅 메시지를 전송하고 AI 영화 추천 응답을 생성한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/chat` |
| Request body | `message`, `conversationId?` |
| Response | `conversationId`, `answer`, `movies: MovieRecommendation[]`, `suggestedQuestions: string[]` |

비로그인 사용자는 추천 채팅을 사용할 수 없다.

`conversationId`가 없으면 첫 메시지 전송과 함께 새 conversation을 생성한다. `conversationId`가 있으면 현재 사용자가 접근 가능한 conversation인지 확인한 뒤 메시지를 처리한다.

서버는 최근 대화 맥락을 함께 사용해 추천 조건을 해석하고, 응답의 `suggestedQuestions`는 현재 메시지와 최근 대화를 기반으로 생성한 후속 질문이다.

`MovieRecommendation` 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | TMDB movie id |
| `title` | string | 영화 제목 |
| `year` | number | 개봉 연도 |
| `rating` | number | 평균 평점 |
| `genres` | `Genre[]` | TMDB 장르 목록 |
| `reason` | string | 추천 이유 |
| `posterUrl` | string | 포스터 이미지 URL |

## `GET /api/recommendation-chat/conversations`

내 추천 대화 목록을 조회한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/chat` |
| Query | `page`, `size` |
| Response | `conversations: { id, title, updatedAt }[]` |

`title`은 DB 컬럼이 아니라 첫 번째 사용자 메시지에서 파생한 표시용 값이다. 첫 번째 사용자 메시지가 없으면 기본 제목을 반환한다.

## `GET /api/recommendation-chat/conversations/{conversationId}`

추천 대화 메시지를 조회한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/chat` |
| Path | `conversationId` |
| Response | `messages: { id, role, content, movies?, suggestedQuestions?, createdAt }[]` |

응답 메시지의 `suggestedQuestions`는 해당 응답 생성 시점에 LLM이 반환한 후속 질문이다.
