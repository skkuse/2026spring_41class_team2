# AI 추천 채팅

## movie_tags

MovieLens Tag Genome의 tag master 테이블이다. 추천 채팅에서 사용자 태그를 Cinemate 태그로 매핑할 때 기준 tag 목록으로 사용한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `tag_id` | integer | PK | MovieLens Tag Genome tag id |
| `tag` | text | unique, not null | tag 이름 |

제약/메모:

- `tag`는 `movie_tag_mapping_embeddings` 생성과 `movie_tag_relevances` 연결의 기준값이다.

권한:

- 추천 채팅 API는 서버 repository를 통해 조회한다.
- 일반 사용자는 클라이언트에서 Supabase table에 직접 접근하지 않는다.

## movie_tag_mapping_embeddings

사용자 태그를 Cinemate 태그로 매핑하기 위한 `movie_tags` embedding 테이블이다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `tag_id` | integer | PK, FK `movie_tags(tag_id)` | MovieLens Tag Genome tag id |
| `embedding_model` | text | PK | embedding 생성에 사용한 모델명 |
| `embedding` | vector(1536) | not null | `text-embedding-3-small` embedding |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |

제약/메모:

- MVP embedding 모델은 `text-embedding-3-small`로 고정한다.
- `tag_id`, `embedding_model` 조합은 unique로 관리한다.
- vector search 성능을 위해 `embedding` 컬럼에 vector index를 둔다.
- embedding input 원문은 DB 컬럼에 중복 저장하지 않고 `data/seeds/recommendation-chat/...` 하위의 tag embedding file로 관리한다.

권한:

- 추천 채팅 API는 서버 repository를 통해 조회한다.
- 일반 사용자는 클라이언트에서 Supabase table에 직접 접근하지 않는다.

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

권한:

- 추천 채팅 API는 서버 repository를 통해 조회한다.
- 일반 사용자는 클라이언트에서 Supabase table에 직접 접근하지 않는다.

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
- 사용자당 추천 채팅 conversation은 최대 1개만 존재하며 `user_id` unique 제약으로 보장한다.

권한:

- 추천 채팅 API는 서버에서 현재 사용자 ID를 확인한 뒤 service/repository를 통해 조회/생성한다.
- 일반 사용자는 클라이언트에서 Supabase table에 직접 접근하지 않는다.

## recommendation_chat_conversation_messages

AI 영화 추천 채팅 메시지.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 메시지 ID |
| `conversation_id` | uuid | FK `recommendation_chat_conversations(id)`, not null | 대화 ID |
| `role` | text | not null | `request` 또는 `response` |
| `content` | text | not null | 메시지 본문 |
| `analysis_result` | jsonb | nullable | LLM 추천 요청 분석 결과 JSON |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |

제약/메모:

- `request`는 사용자가 추천 채팅에 입력한 메시지다.
- `response`는 사용자의 `request`에 대해 AI가 생성한 추천 응답 메시지다.
- `analysis_result`는 `response` 메시지에서 디버깅과 평가에 필요한 검증 완료 LLM 추천 요청 분석 JSON을 저장한다.
- 전체 prompt 전문은 저장하지 않는다.
- 사용자 개인정보나 불필요하게 긴 입력 전문을 `analysis_result`에 중복 저장하지 않는다.

권한:

- 추천 채팅 API는 서버에서 현재 사용자 ID를 확인한 뒤 service/repository를 통해 조회/생성한다.
- 일반 사용자는 클라이언트에서 Supabase table에 직접 접근하지 않는다.

## recommendation_chat_conversation_message_movies

추천 채팅 response 메시지에 포함된 추천 영화.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `message_id` | uuid | PK, FK `recommendation_chat_conversation_messages(id)` | 메시지 ID |
| `movie_id` | bigint | PK, FK `movies(id)` | 추천 영화 ID |
| `rank` | int | not null | 추천 순위 |
| `reason` | text | not null | LLM이 생성한 추천 사유 |

제약/메모:

- 추천 채팅 결과는 메시지 단위로 저장한다.
- `message_id`는 `role = 'response'`인 추천 응답 메시지를 가리킨다.

권한:

- 추천 채팅 API는 서버에서 현재 사용자 ID를 확인한 뒤 service/repository를 통해 조회/생성한다.
- 일반 사용자는 클라이언트에서 Supabase table에 직접 접근하지 않는다.
