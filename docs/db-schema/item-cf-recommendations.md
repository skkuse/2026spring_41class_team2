# 맞춤 추천
## movie_stats

화면 표시 평점, 리뷰 집계, 추천 후보 조회와 fallback에 사용하는 영화별 통계 테이블이다. 
> fallback: “Item CF 추천 결과가 부족할 때 빈칸을 채우기 위해 가져오는 보충 영화 목록”

서비스에 노출되는 모든 `movies` row는 대응하는 `movie_stats` row를 가진다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `tmdb_id` | bigint | PK, FK `movies(id)` | TMDB movie id |
| `movielens_avg_rating` | numeric(3,2) | not null | MovieLens 평균 평점 |
| `movielens_rating_count` | integer | not null, default 0 | MovieLens 평점 수 |
| `cinemate_rating_sum` | numeric(10,2) | not null, default 0 | Cinemate 리뷰 평점 합 |
| `cinemate_review_count` | integer | not null, default 0 | Cinemate 리뷰 수 |
| `user_tag_count` | integer | not null, default 0 | MovieLens 사용자 태그 수 |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |
| `updated_at` | timestamptz | not null, default now() | 수정 시각 |

제약/메모:

- 구현계획 문서에서는 `movie_stats.tmdb_id`를 추천 테이블의 FK 대상으로 사용한다.
- `movies`는 TMDB 카탈로그 필드만 저장하고, 평점/리뷰/tag 집계는 이 테이블에 둔다.
- 리뷰 생성/수정/삭제 시 `cinemate_rating_sum`, `cinemate_review_count`를 갱신한다.
- fallback 정렬 인덱스는 `(movielens_rating_count DESC, movielens_avg_rating DESC)`를 둔다.
- 표시 평점은 DB에 저장하지 않고 API 응답 시 계산한다.

평점 계산:

```text
rating =
  (movielens_avg_rating * movielens_rating_count + cinemate_rating_sum)
  / (movielens_rating_count + cinemate_review_count)
```

- 분모가 0이면 `rating`은 0 또는 null로 응답한다.

## movielens_item_similarities

Item CF 추천 결과를 미리 저장하는 테이블이다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `source_tmdb_id` | bigint | PK, FK `movie_stats(tmdb_id)` | 기준 영화 |
| `target_tmdb_id` | bigint | PK, FK `movie_stats(tmdb_id)` | 함께 추천할 영화 |
| `score` | real | not null | Item CF 유사도 점수 |
| `co_rating_count` | integer | not null | 두 영화를 함께 평가한 사용자 수 |

제약/메모:

- 기준 영화별 조회 인덱스는 `(source_tmdb_id, score DESC)`를 둔다.
- `/recommend`의 온보딩 기반 추천은 이 테이블을 기준으로 조회한다.
