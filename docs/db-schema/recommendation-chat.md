# AI 추천 채팅

## movie_tags

MovieLens Tag Genome의 tag master 테이블이다. 추천 채팅에서 자연어 조건을 구조화할 때 선택 가능한 tag 목록으로 사용한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `tag_id` | integer | PK | MovieLens Tag Genome tag id |
| `tag` | text | unique, not null | tag 이름 |

제약/메모:

- `tag`는 LLM에 전달하는 `availableOptions.tags`의 원천이다.
- 일반 사용자는 읽기만 가능하다.

RLS:

- 모든 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

## movie_tag_relevances

영화별 MovieLens Tag Genome relevance 점수를 저장하는 테이블이다. 추천 채팅에서 tag 조건과 맞는 후보 영화를 찾고 ranking하는 데 사용한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `movie_id` | bigint | PK, FK `movies(id)` | Movie id |
| `tag_id` | integer | PK, FK `movie_tags(tag_id)` | MovieLens Tag Genome tag id |
| `relevance` | real | not null | tag와 영화의 관련도 점수 |

제약/메모:

- `movie_id`는 MovieLens subset에 포함된 영화만 저장한다.
- 추천 채팅의 tag 기반 후보 조회 인덱스는 `(tag_id, relevance DESC, movie_id)`를 둔다.
- 영화별 tag 조회 인덱스는 `(movie_id, relevance DESC)`를 둔다.
- relevance는 MovieLens `genome-scores.csv`의 값을 사용한다.
- seed는 `relevance >= 0.5` row를 기본 저장하고, 영화별 저장 row가 20개 미만이면 `relevance DESC`, `tag_id ASC` 기준 상위 tag를 추가해 최소 20개를 보장한다.

RLS:

- 모든 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

## recommendation_chat_conversations

AI 영화 추천 채팅 대화.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 대화 ID |
| `user_id` | uuid | FK `profiles(id)`, not null | 사용자 ID |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |
| `updated_at` | timestamptz | not null, default now() | 수정 시각 |

제약/메모:

- 비로그인 사용자는 추천 채팅을 사용할 수 없다.
- 대화 목록 화면의 제목은 첫 번째 사용자 메시지에서 파생해 API 응답에서 만든다.
- 첫 번째 사용자 메시지가 없으면 API에서 기본 제목을 반환한다.

RLS:

- 사용자는 본인 추천 채팅 대화만 조회/생성 가능하다.

## recommendation_chat_conversation_messages

AI 영화 추천 채팅 메시지.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 메시지 ID |
| `conversation_id` | uuid | FK `recommendation_chat_conversations(id)`, not null | 대화 ID |
| `role` | text | not null | `request` 또는 `response` |
| `content` | text | not null | 메시지 본문 |
| `raw_response` | jsonb | nullable | LLM이 반환한 구조화 출력 JSON |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |

제약/메모:

- `request`는 사용자가 추천 채팅에 입력한 메시지다.
- `response`는 사용자의 `request`에 대해 AI가 생성한 추천 응답 메시지다.
- `raw_response`는 `response` 메시지에서 디버깅과 평가에 필요한 LLM 출력 JSON을 저장한다.
- 전체 prompt 전문은 저장하지 않는다.
- 사용자 개인정보나 불필요하게 긴 입력 전문을 `raw_response`에 중복 저장하지 않는다.

RLS:

- 사용자는 본인 대화에 속한 메시지만 조회/생성 가능하다.

## recommendation_chat_conversation_message_movies

추천 채팅 response 메시지에 포함된 추천 영화.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `message_id` | uuid | PK, FK `recommendation_chat_conversation_messages(id)` | 메시지 ID |
| `movie_id` | bigint | PK, FK `movies(id)` | 추천 영화 ID |
| `rank` | int | not null | 추천 순위 |
| `reason` | text | nullable | 추천 사유 |

제약/메모:

- 추천 채팅 결과는 메시지 단위로 저장한다.
- `message_id`는 `role = 'response'`인 추천 응답 메시지를 가리킨다.

RLS:

- 사용자는 본인 추천 채팅 메시지에 연결된 추천 영화만 조회 가능하다.
