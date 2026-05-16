# 캐릭터 대화 API

관련 DB 문서: [../db-schema/character-chat.md](../db-schema/character-chat.md), [../db-schema/movies.md](../db-schema/movies.md), [../db-schema/people.md](../db-schema/people.md)

캐릭터 채팅 전체 기능은 로그인 뒤 기능으로 잠근다.

## `GET /api/character-chat/movies`

캐릭터 대화가 가능한 영화 목록을 조회한다. 캐릭터 채팅 seed가 적재된 영화만 반환한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/character-chat` |
| Query | 없음 |
| Response | `movies: CharacterMovie[]` |

초기 캐릭터 채팅 지원 영화는 2개로 고정하므로 페이지네이션을 제공하지 않는다. 

`CharacterMovie` 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | TMDB movie id |
| `title` | string | 영화 제목 |
| `genres` | `Genre[]` | TMDB 장르 목록 |
| `posterUrl` | string | TMDB 포스터 이미지 URL. 영화 카탈로그 seed에서 `movies.poster_path` 누락을 허용하지 않는다. |
| `description` | string | `movies.overview` 기반 화면 표시 설명. 영화 카탈로그 seed에서 `movies.overview` 누락을 허용하지 않는다. |
| `actors` | string[] | seed된 캐릭터의 배우명 목록. `actor_person_id`가 null인 캐릭터는 제외하며, 배우 연결이 없으면 빈 배열 |
| `characters` | `Character[]` | 대화 가능 캐릭터 목록 |

`Character` 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | 캐릭터 식별자. `characters.id` UUID |
| `name` | string | 캐릭터 이름 |
| `description` | string | 캐릭터 설명 |
| `greeting` | string | 첫 인사 |
| `avatarUrl` | string | 캐릭터 이미지 URL. 초기 캐릭터 seed는 모든 캐릭터의 `avatar_storage_path`를 필수로 검증한다. |
| `actor` | `CharacterActor` 또는 null | 연결 배우 정보. `actor_person_id`가 null이면 null |

`CharacterActor` 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | TMDB person id |
| `name` | string | 배우 표시명 |

## `POST /api/character-chat/conversations`

캐릭터 대화 세션을 생성한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/character-chat` |
| Request body | `movieId`, `characterId` |
| Response | `conversationId`, `initialMessage`, `suggestedQuestions` |

`movieId`와 `characterId` 조합은 검증한다. `characterId`가 요청한 `movieId`에 속하지 않으면 실패한다.

`initialMessage`는 `characters.greeting`을 사용한다.

`suggestedQuestions`는 `character_chat_default_questions`에 seed된 캐릭터별 기본 추천 질문이다. 초기 seed 기준으로 캐릭터당 정확히 4개이며, `display_order` 오름차순으로 반환한다.

## `POST /api/character-chat/conversations/{conversationId}/messages`

사용자 메시지를 저장하고 캐릭터 응답을 생성한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/character-chat` |
| Path | `conversationId` |
| Request body | `message` |
| Response | `messageId`, `reply`, `suggestedQuestions`, `createdAt` |

`message`는 비어 있지 않은 사용자 입력 문자열이다.

`suggestedQuestions`는 현재 대화 맥락 기반 동적 추천 질문이다. 이 값은 seed 테이블에 저장하지 않는다.

## API 없음

| 화면 | 기능/영역 | 동작 |
|---|---|---|
| `/character-chat` | 배우 기반 추천 | `/chat` 화면으로 이동하며 실제 추천 응답은 AI 영화 추천 채팅 API가 처리한다. |
