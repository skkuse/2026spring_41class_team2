# 캐릭터 및 캐릭터 채팅

## characters

수동 관리 캐릭터. 캐릭터 대본/설정은 서비스 기획 데이터로 관리한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 캐릭터 ID |
| `movie_id` | bigint | FK `movies(id)`, not null | 연결 영화 ID |
| `actor_person_id` | bigint | FK `people(id)`, nullable | 배우 ID |
| `name` | text | not null | 캐릭터 이름 |
| `description` | text | not null | 캐릭터 설명 |
| `greeting` | text | not null | 첫 인사 |
| `persona_prompt` | text | not null | 캐릭터 대화 프롬프트 |
| `avatar_storage_path` | text | not null | Supabase Storage 캐릭터 이미지 object path |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |
| `updated_at` | timestamptz | not null, default now() | 수정 시각 |

제약/메모:

- 캐릭터 데이터는 TMDB 자동 파생 데이터가 아니라 수동 관리 데이터다.
- 캐릭터는 특정 영화와 연결된다.
- 캐릭터는 필요하면 TMDB 배우 정보와 연결할 수 있다. 배우 연결이 불명확하거나 `people`에 없으면 `actor_person_id`는 null일 수 있다.
- `persona_prompt`는 말투, 성격, 배경, 응답 규칙, 예시 대사 등을 포함하는 캐릭터 대화 프롬프트로 수동 작성한다.
- 캐릭터 이미지는 Supabase Storage에 수동 업로드하고, DB에는 파일 자체가 아니라 object path만 저장한다.
- 캐릭터 이미지 Storage bucket은 `character-images`를 사용한다.
- `avatar_storage_path` 예시: `movies/603/characters/neo.webp`.
- 화면에서는 `avatar_storage_path`로 Supabase Storage public URL 또는 signed URL을 생성해 표시한다.
- 영화 대본 원문은 저장하지 않고, 대본에서 추출한 주요 사건과 캐릭터별 관점만 별도 테이블에 저장한다.

RLS:

- 로그인 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

## character_chat_events

영화 대본에서 추출한 객관적인 주요 사건.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 사건 ID |
| `movie_id` | bigint | FK `movies(id)`, not null | 연결 영화 ID |
| `event_order` | int | not null | 영화 대본 내 사건 순서 |
| `title` | text | not null | 사건 짧은 제목 |
| `summary` | text | not null | 사건 객관 요약 |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |
| `updated_at` | timestamptz | not null, default now() | 수정 시각 |

제약/메모:

- `event_order`는 영화 안의 사건 흐름을 유지하기 위한 정렬 기준이다.
- `summary`에는 캐릭터별 감정이나 해석을 넣지 않고, 대본 기준으로 실제 일어난 일을 요약한다.
- 대본 원문, 출처, 타임코드는 저장하지 않는다.

RLS:

- 로그인 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

## character_chat_event_participants

특정 사건을 각 캐릭터가 어떻게 겪고 기억하는지 저장한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `event_id` | uuid | PK, FK `character_chat_events(id)` | 사건 ID |
| `character_id` | uuid | PK, FK `characters(id)` | 캐릭터 ID |
| `role` | text | not null | 사건에서 캐릭터의 역할 |
| `perspective_summary` | text | not null | 캐릭터 관점의 사건 요약 |
| `emotional_impact` | text | not null | 사건이 캐릭터에게 남긴 감정과 변화 |
| `knowledge_state` | text | not null | 이 사건 이후 캐릭터가 알고 있거나 모르는 사실 |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |
| `updated_at` | timestamptz | not null, default now() | 수정 시각 |

제약/메모:

- 같은 `character_chat_events` row라도 캐릭터마다 다른 관점 row를 가질 수 있다.
- 캐릭터 채팅 응답 생성 시 현재 캐릭터의 `character_chat_event_participants` row를 조회해 context로 사용한다.
- `role` 예시: `subject`, `witness`, `helper`, `opponent`, `betrayer`, `betrayed`, `victim`, `cause`.
- `knowledge_state`는 캐릭터가 알 수 없는 사실을 말하지 않도록 제한하는 데 사용한다.
- participant row는 LLM context로 바로 사용되므로 역할, 관점, 감정, 지식 상태를 모두 필수로 저장한다.

RLS:

- 로그인 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

## character_chat_default_questions

캐릭터 채팅 시작 시 보여줄 캐릭터별 기본 추천 질문.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 기본 추천 질문 ID |
| `character_id` | uuid | FK `characters(id)`, not null | 캐릭터 ID |
| `question` | text | not null | 기본 추천 질문 |
| `display_order` | int | not null, default 0 | 표시 순서 |

제약/메모:

- 이 테이블은 대화 시작 전에 보여줄 고정 seed 질문만 저장한다.
- 대화 중 다음 질문 후보는 현재 대화 맥락에 따라 API 응답에서 동적으로 반환하고, 이 테이블에 저장하지 않는다.

RLS:

- 로그인 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

## character_chat_conversations

캐릭터 채팅 대화.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 대화 ID |
| `user_id` | uuid | FK `profiles(id)`, not null | 사용자 ID |
| `character_id` | uuid | FK `characters(id)`, not null | 캐릭터 ID |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |
| `updated_at` | timestamptz | not null, default now() | 수정 시각 |

제약/메모:

- 비로그인 사용자는 캐릭터 채팅을 사용할 수 없다.

RLS:

- 사용자는 본인 캐릭터 채팅 대화만 조회/생성 가능하다.

## character_chat_conversation_messages

캐릭터 채팅 메시지.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 메시지 ID |
| `conversation_id` | uuid | FK `character_chat_conversations(id)`, not null | 대화 ID |
| `sender_type` | text | not null | `user` 또는 `character` |
| `content` | text | not null | 메시지 본문 |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |

RLS:

- 사용자는 본인 캐릭터 채팅 대화에 속한 메시지만 조회/생성 가능하다.
