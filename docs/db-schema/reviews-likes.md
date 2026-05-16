# 리뷰 및 찜

## movie_bookmarks

사용자의 찜 영화.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `user_id` | uuid | PK, FK `profiles(id)` | 사용자 ID |
| `movie_id` | bigint | PK, FK `movies(id)` | 영화 ID |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |

제약/메모:

- 비로그인 사용자는 찜할 수 없다.
- 비로그인 상태에서 영화 목록/상세의 `isBookmarked`는 항상 `false`다.

RLS:

- 사용자는 본인 찜 목록만 조회/생성/삭제 가능하다.

## reviews

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
- 리뷰 작성 시 `movie_stats.cinemate_rating_sum`과 `movie_stats.cinemate_review_count`를 갱신한다.

RLS:

- 모든 사용자가 리뷰 목록을 읽을 수 있다.
- 로그인 사용자만 리뷰를 작성할 수 있다.
- 사용자는 본인 user_id로만 리뷰를 작성할 수 있다.
- 수정/삭제 정책은 현재 제외한다.

## review_likes

리뷰 좋아요.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `review_id` | uuid | PK, FK `reviews(id)` | 리뷰 ID |
| `user_id` | uuid | PK, FK `profiles(id)` | 사용자 ID |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |

RLS:

- 모든 사용자가 좋아요 수 집계 결과를 볼 수 있다.
- 로그인 사용자는 본인 좋아요만 생성/삭제할 수 있다.
