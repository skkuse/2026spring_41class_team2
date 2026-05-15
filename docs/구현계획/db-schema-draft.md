# Cinemate DB Schema 초안

이 문서는 Cinemate 서비스 정책 및 아키텍처 결정사항을 기준으로 작성한 DB schema 초안이다. 실제 SQL DDL 작성 전, 테이블 구조와 관계, 주요 제약, RLS 방향을 정리하는 목적이다.

## 1. 설계 기준

- 인증은 Supabase Auth를 사용한다.
- Supabase `auth.users`는 인증 사용자 원천으로 사용한다.
- 서비스 사용자 정보는 `profiles` 테이블에서 관리한다.
- 영화 상세 정보 원천은 TMDB다.
- MovieLens는 추천 학습, 랭킹, 초기 평점 집계 원천으로 사용한다.
- IMDB는 사용하지 않는다.
- 영화는 MovieLens에 `tmdbId`가 있는 항목만 적재한다.
- TMDB 전체 영화는 적재하지 않는다.
- 영화 데이터는 최초 적재 후 고정한다.
- `movies.id`는 TMDB movie id다.
- 장르는 TMDB 장르 기준으로 통일한다.
- MovieLens 원본/전처리 데이터는 Python 추천 서버에서 Item CF 계산에 사용한다.
- `/recommend` 맞춤 추천 결과는 DB에 저장하지 않고, 백엔드가 Python 추천 서버를 호출해 화면 응답을 조립한다.
- AI 영화 추천 채팅과 캐릭터 채팅은 분리한다.
- AI 영화 추천 채팅 테이블은 `recommendation_chat_*` 이름을 사용한다.
- 캐릭터 채팅 테이블은 `character_chat_*` 이름을 사용한다.

## 2. ERD 개요

```text
auth.users
  └─ profiles
      ├─ user_onboarding_movies
      ├─ liked_movies
      ├─ reviews
      ├─ review_likes
      ├─ recommendation_chat_conversations
      └─ character_chat_conversations

movies
  ├─ movie_genres
  ├─ movie_casts
  ├─ movie_crew
  ├─ liked_movies
  ├─ reviews
  ├─ similar_movies
  ├─ user_onboarding_movies
  ├─ recommendation_chat_message_movies
  └─ characters

genres
  └─ movie_genres

people
  ├─ movie_casts
  ├─ movie_crew
  └─ characters

recommendation_chat_conversations
  └─ recommendation_chat_messages
      └─ recommendation_chat_message_movies

characters
  ├─ character_suggested_questions
  └─ character_chat_conversations
      └─ character_chat_messages
```

## 3. 테이블 목록

| 영역 | 테이블 | 목적 |
|---|---|---|
| 사용자 | `profiles` | 서비스 사용자 프로필 |
| 사용자 | `user_onboarding_movies` | 온보딩에서 선택한 선호 영화 |
| 영화 | `movies` | TMDB 기반 영화 기본 정보 |
| 영화 | `genres` | TMDB 장르 |
| 영화 | `movie_genres` | 영화-장르 연결 |
| 인물 | `people` | TMDB 인물 정보 |
| 인물 | `movie_casts` | 영화 출연진 |
| 인물 | `movie_crew` | 영화 제작진 |
| 리뷰/찜 | `liked_movies` | 사용자의 찜 영화 |
| 리뷰/찜 | `reviews` | 영화 리뷰 |
| 리뷰/찜 | `review_likes` | 리뷰 좋아요 |
| 추천 | `similar_movies` | 영화 간 유사도 결과 |
| 추천 채팅 | `recommendation_chat_conversations` | 영화 추천 채팅 대화 |
| 추천 채팅 | `recommendation_chat_messages` | 영화 추천 채팅 메시지 |
| 추천 채팅 | `recommendation_chat_message_movies` | 추천 채팅 메시지에 포함된 영화 |
| 캐릭터 | `characters` | 수동 관리 캐릭터 |
| 캐릭터 | `character_suggested_questions` | 캐릭터별 추천 질문 |
| 캐릭터 채팅 | `character_chat_conversations` | 캐릭터 채팅 대화 |
| 캐릭터 채팅 | `character_chat_messages` | 캐릭터 채팅 메시지 |

## 4. 사용자 및 온보딩

### profiles

서비스 사용자 프로필. Supabase `auth.users`와 1:1로 연결한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK, FK `auth.users(id)` | 사용자 ID |
| `name` | text | not null | 표시 이름 |
| `email` | text | not null | 이메일 |
| `profile_image_url` | text | nullable | 프로필 이미지 URL |
| `onboarding_completed` | boolean | not null, default false | 온보딩 완료 여부 |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |
| `updated_at` | timestamptz | not null, default now() | 수정 시각 |

제약/메모:

- `profiles.id`는 `auth.users.id`를 참조한다.
- 온보딩은 로그인 사용자만 가능하다.
- 온보딩 완료 후에는 온보딩 화면으로 다시 이동하지 않는다.

RLS:

- 사용자는 본인 프로필만 조회/수정 가능하다.

### user_onboarding_movies

온보딩에서 사용자가 선택한 선호 영화를 저장한다. 이 데이터는 `/recommend` 화면의 Item CF 추천 seed로 사용한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `user_id` | uuid | PK, FK `profiles(id)` | 사용자 ID |
| `movie_id` | bigint | PK, FK `movies(id)` | 온보딩에서 선택한 영화 ID |
| `position` | int | not null | 사용자가 선택한 순서. 1~5 |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |

제약/메모:

- 온보딩은 인기 영화 목록에서 선호 영화 5개를 정확히 선택해야 완료된다.
- 온보딩 후보 영화는 MovieLens 매핑이 있는 영화로 한정한다.
- `unique (user_id, movie_id)`를 둔다.
- `unique (user_id, position)`을 둔다.
- 사용자당 정확히 5개 저장 규칙은 API 레벨에서 검증한다.
- `position`은 1~5 범위로 제한한다.
- `/recommend`에서 `seedLimit=3`이면 기본적으로 `position`이 빠른 3개를 추천 섹션 seed로 사용한다.

RLS:

- 사용자는 본인 온보딩 선호 영화만 조회/수정 가능하다.

## 5. 영화 카탈로그

### movies

TMDB 기반 영화 카탈로그. `id`는 TMDB movie id다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | bigint | PK | TMDB movie id |
| `movielens_id` | bigint | unique, not null | MovieLens movieId |
| `title` | text | not null | 표시 제목 |
| `original_title` | text | nullable | 원제 |
| `overview` | text | nullable | 줄거리 |
| `release_date` | date | nullable | 개봉일 |
| `release_year` | int | nullable | 개봉 연도 |
| `runtime` | int | nullable | 러닝타임 |
| `original_language` | text | nullable | 원어 |
| `production_countries` | jsonb | not null, default '[]' | TMDB 제작 국가 목록 |
| `poster_path` | text | nullable | TMDB poster path |
| `backdrop_path` | text | nullable | TMDB backdrop path |
| `trailer_url` | text | nullable | 예고편 URL |
| `adult` | boolean | not null, default false | 성인 콘텐츠 여부 |
| `movielens_avg_rating` | numeric(3,2) | nullable | MovieLens 평균 평점 |
| `movielens_rating_count` | int | not null, default 0 | MovieLens 평점 수 |
| `cinemate_rating_sum` | numeric(10,2) | not null, default 0 | Cinemate 리뷰 평점 합 |
| `cinemate_review_count` | int | not null, default 0 | Cinemate 리뷰 수 |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |
| `updated_at` | timestamptz | not null, default now() | 수정 시각 |

제약/메모:

- `movies.id`에는 TMDB movie id를 저장한다.
- DB 주석으로 `movies.id`가 TMDB movie id임을 명시한다.
- IMDB ID는 저장하지 않는다.
- TMDB 평점은 사용하지 않는다.
- 영화 데이터는 최초 적재 후 고정한다.
- `production_countries`에는 TMDB 영화 상세 응답의 `production_countries` 배열을 저장한다.
- `poster_path`는 완성 URL이 아니라 TMDB path를 저장하고, API 응답에서 이미지 base URL과 조합한다.

평점 계산:

```text
rating =
  (movielens_avg_rating * movielens_rating_count + cinemate_rating_sum)
  / (movielens_rating_count + cinemate_review_count)
```

- `rating`은 DB에 저장하지 않고 API 응답 시 계산한다.
- 분모가 0이면 `rating`은 0 또는 null로 응답한다.

RLS:

- 모든 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

### genres

TMDB 장르 기준의 장르 테이블.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | bigint | PK | TMDB genre id |
| `name` | text | not null | 장르 이름 |
| `name_ko` | text | nullable | 한국어 장르 이름 |

제약/메모:

- MovieLens 장르는 서비스 장르 기준으로 사용하지 않는다.
- 화면과 검색의 장르 표시는 TMDB 장르 기준으로 통일한다.

RLS:

- 모든 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

### movie_genres

영화와 장르의 다대다 연결 테이블.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `movie_id` | bigint | PK, FK `movies(id)` | 영화 ID, TMDB movie id |
| `genre_id` | bigint | PK, FK `genres(id)` | TMDB 장르 ID |

RLS:

- 모든 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

## 6. 인물, 출연진, 제작진

### people

TMDB 인물 정보. 배우, 감독, 제작진을 모두 포함한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | bigint | PK | TMDB person id |
| `name` | text | not null | 표시 이름 |
| `original_name` | text | nullable | 원문 이름 |
| `profile_path` | text | nullable | TMDB profile path |
| `known_for_department` | text | nullable | 주요 분야 |
| `popularity` | numeric | nullable | TMDB 인물 popularity |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |
| `updated_at` | timestamptz | not null, default now() | 수정 시각 |

RLS:

- 모든 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

### movie_casts

영화 출연진 정보. TMDB credits 응답의 `cast`에 해당한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `movie_id` | bigint | PK, FK `movies(id)` | 영화 ID |
| `person_id` | bigint | PK, FK `people(id)` | 배우 ID |
| `character_name` | text | PK | 배역명 |
| `cast_order` | int | nullable | 출연 순서 |

제약/메모:

- 같은 배우가 한 영화에서 여러 배역을 맡을 수 있으므로 `character_name`을 PK에 포함한다.

RLS:

- 모든 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

### movie_crew

영화 제작진 정보. TMDB credits 응답의 `crew`에 해당한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `movie_id` | bigint | PK, FK `movies(id)` | 영화 ID |
| `person_id` | bigint | PK, FK `people(id)` | 인물 ID |
| `department` | text | PK | 부서 |
| `job` | text | PK | 역할 |

제약/메모:

- 감독은 `job = 'Director'`로 조회한다.
- 출연진과 제작진은 분리해서 관리한다.

RLS:

- 모든 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

## 7. 리뷰 및 찜

### liked_movies

사용자의 찜 영화.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `user_id` | uuid | PK, FK `profiles(id)` | 사용자 ID |
| `movie_id` | bigint | PK, FK `movies(id)` | 영화 ID |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |

제약/메모:

- 비로그인 사용자는 찜할 수 없다.
- 비로그인 상태에서 영화 목록/상세의 `isLiked`는 항상 `false`다.

RLS:

- 사용자는 본인 찜 목록만 조회/생성/삭제 가능하다.

### reviews

영화 리뷰.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 리뷰 ID |
| `user_id` | uuid | FK `profiles(id)`, not null | 작성자 ID |
| `movie_id` | bigint | FK `movies(id)`, not null | 영화 ID |
| `rating` | numeric(2,1) | not null | 0.5~5.0 평점 |
| `content` | text | not null | 리뷰 본문 |
| `created_at` | timestamptz | not null, default now() | 작성 시각 |

제약/메모:

- 한 유저는 한 영화에 리뷰 하나만 작성할 수 있다.
- `unique (user_id, movie_id)`를 둔다.
- 리뷰 수정/삭제는 현재 범위에서 제외한다.
- 리뷰 작성 시 `movies.cinemate_rating_sum`과 `movies.cinemate_review_count`를 갱신한다.

RLS:

- 모든 사용자가 리뷰 목록을 읽을 수 있다.
- 로그인 사용자만 리뷰를 작성할 수 있다.
- 사용자는 본인 user_id로만 리뷰를 작성할 수 있다.
- 수정/삭제 정책은 현재 제외한다.

### review_likes

리뷰 좋아요.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `review_id` | uuid | PK, FK `reviews(id)` | 리뷰 ID |
| `user_id` | uuid | PK, FK `profiles(id)` | 사용자 ID |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |

RLS:

- 모든 사용자가 좋아요 수 집계 결과를 볼 수 있다.
- 로그인 사용자는 본인 좋아요만 생성/삭제할 수 있다.

## 8. 추천 결과

### similar_movies

영화 간 유사도 결과. MovieLens genome, TMDB 메타데이터, 하이브리드 방식 등 오프라인 계산 결과를 저장한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `movie_id` | bigint | PK, FK `movies(id)` | 기준 영화 ID |
| `similar_movie_id` | bigint | PK, FK `movies(id)` | 유사 영화 ID |
| `source` | text | PK | 유사도 출처 |
| `score` | numeric | not null | 유사도 점수 |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |

제약/메모:

- `source` 예시: `movielens_genome`, `tmdb`, `hybrid`.
- 일반 서비스 요청에서 실시간 계산하지 않고 미리 계산한다.

RLS:

- 모든 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

### `/recommend` 추천 결과 저장 정책

`/recommend` 맞춤 추천 결과는 DB 테이블로 저장하지 않는다.

제약/메모:

- `/recommend`는 온보딩에서 선택한 `user_onboarding_movies`를 seed로 사용한다.
- 백엔드는 `seedLimit`, `limitPerSeed`, `excludeMovieIds`를 구성해 Python 추천 서버에 요청한다.
- Python 추천 서버는 MovieLens 기반 Item CF 결과를 반환한다.
- 백엔드는 반환된 movie id 목록을 `movies`, `movie_genres`, `genres`, `liked_movies`와 조합해 화면용 응답으로 변환한다.
- 추천 결과가 부족하면 평점이 높은 영화로 보충한다.
- AI 추천 채팅에서 response 메시지에 포함된 추천 영화는 `recommendation_chat_message_movies`에 메시지 단위로 저장한다.

## 9. 추천 채팅

### recommendation_chat_conversations

AI 영화 추천 채팅 대화.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 대화 ID |
| `user_id` | uuid | FK `profiles(id)`, not null | 사용자 ID |
| `title` | text | nullable | 대화 제목 |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |
| `updated_at` | timestamptz | not null, default now() | 수정 시각 |

제약/메모:

- 비로그인 사용자는 추천 채팅을 사용할 수 없다.

RLS:

- 사용자는 본인 추천 채팅 대화만 조회/생성 가능하다.

### recommendation_chat_messages

AI 영화 추천 채팅 메시지.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 메시지 ID |
| `conversation_id` | uuid | FK `recommendation_chat_conversations(id)`, not null | 대화 ID |
| `role` | text | not null | `request` 또는 `response` |
| `content` | text | not null | 메시지 본문 |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |

RLS:

- 사용자는 본인 대화에 속한 메시지만 조회/생성 가능하다.

### recommendation_chat_message_movies

추천 채팅 response 메시지에 포함된 추천 영화.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `message_id` | uuid | PK, FK `recommendation_chat_messages(id)` | 메시지 ID |
| `movie_id` | bigint | PK, FK `movies(id)` | 추천 영화 ID |
| `rank` | int | not null | 추천 순위 |
| `reason` | text | nullable | 추천 사유 |

제약/메모:

- 추천 채팅 결과는 메시지 단위로 저장한다.

RLS:

- 사용자는 본인 추천 채팅 메시지에 연결된 추천 영화만 조회 가능하다.

## 10. 캐릭터 및 캐릭터 채팅

### characters

수동 관리 캐릭터. 캐릭터 대본/설정은 서비스 기획 데이터로 관리한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 캐릭터 ID |
| `movie_id` | bigint | FK `movies(id)`, not null | 연결 영화 ID |
| `actor_person_id` | bigint | FK `people(id)`, nullable | 배우 ID |
| `name` | text | not null | 캐릭터 이름 |
| `description` | text | nullable | 캐릭터 설명 |
| `greeting` | text | nullable | 첫 인사 |
| `persona_prompt` | text | nullable | 캐릭터 대화 프롬프트 |
| `avatar_color` | text | nullable | UI 표시 색상 |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |
| `updated_at` | timestamptz | not null, default now() | 수정 시각 |

제약/메모:

- 캐릭터 데이터는 TMDB 자동 파생 데이터가 아니라 수동 관리 데이터다.
- 캐릭터는 특정 영화와 연결된다.
- 캐릭터는 필요하면 TMDB 배우 정보와 연결할 수 있다.

RLS:

- 로그인 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

### character_suggested_questions

캐릭터별 추천 질문.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 추천 질문 ID |
| `character_id` | uuid | FK `characters(id)`, not null | 캐릭터 ID |
| `question` | text | not null | 추천 질문 |
| `display_order` | int | not null, default 0 | 표시 순서 |

RLS:

- 로그인 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

### character_chat_conversations

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

### character_chat_messages

캐릭터 채팅 메시지.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 메시지 ID |
| `conversation_id` | uuid | FK `character_chat_conversations(id)`, not null | 대화 ID |
| `role` | text | not null | `user` 또는 `assistant` |
| `content` | text | not null | 메시지 본문 |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |

RLS:

- 사용자는 본인 캐릭터 채팅 대화에 속한 메시지만 조회/생성 가능하다.

## 11. RLS 요약

| 테이블 | 읽기 | 쓰기 |
|---|---|---|
| `profiles` | 본인 | 본인 |
| `user_onboarding_movies` | 본인 | 본인 |
| `movies` | 전체 공개 | 일반 사용자 불가 |
| `genres` | 전체 공개 | 일반 사용자 불가 |
| `movie_genres` | 전체 공개 | 일반 사용자 불가 |
| `people` | 전체 공개 | 일반 사용자 불가 |
| `movie_casts` | 전체 공개 | 일반 사용자 불가 |
| `movie_crew` | 전체 공개 | 일반 사용자 불가 |
| `liked_movies` | 본인 | 본인 |
| `reviews` | 전체 공개 | 로그인 사용자 본인 작성 |
| `review_likes` | 전체 공개 또는 집계 공개 | 로그인 사용자 본인 생성/삭제 |
| `similar_movies` | 전체 공개 | 일반 사용자 불가 |
| `recommendation_chat_conversations` | 본인 | 본인 |
| `recommendation_chat_messages` | 본인 | 본인 |
| `recommendation_chat_message_movies` | 본인 | 일반 사용자 불가 |
| `characters` | 로그인 사용자 | 일반 사용자 불가 |
| `character_suggested_questions` | 로그인 사용자 | 일반 사용자 불가 |
| `character_chat_conversations` | 본인 | 본인 |
| `character_chat_messages` | 본인 | 본인 |

## 12. 보류 사항

- 리뷰 수정/삭제는 현재 범위에서 제외한다.
- TMDB 재동기화는 현재 범위에서 제외한다.
- TMDB 실시간 검색은 기본 검색 정책에서 제외한다.
- MovieLens 원본 CSV를 DB에 직접 적재하지 않는다.
