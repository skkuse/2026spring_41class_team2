# 맞춤 추천 API

관련 DB 문서: [../db-schema/users.md](../db-schema/users.md), [../db-schema/item-cf-recommendations.md](../db-schema/item-cf-recommendations.md), [../db-schema/reviews-likes.md](../db-schema/reviews-likes.md)

## `GET /api/me/recommendations/item-cf`

온보딩에서 선택한 영화 기반의 Item CF 추천 섹션을 조회한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/recommend` |
| Query | `seedLimit`, `limitPerSeed` |
| Response | `sections: RecommendationSection[]` |

`seedLimit`은 온보딩에서 선택한 영화 5개 중 추천 섹션을 만들 기준 영화를 몇 개 사용할지 의미한다. 기본값은 3이다.

`limitPerSeed`는 각 seed 영화 섹션마다 추천 영화를 몇 개 반환할지 의미한다. 기본값은 10이다.

## 응답 타입

`RecommendedMovie` 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | TMDB movie id |
| `title` | string | 영화 제목 |
| `year` | number | 개봉 연도 |
| `rating` | number | 평균 평점 |
| `genres` | `Genre[]` | TMDB 장르 목록 |
| `posterUrl` | string | 포스터 이미지 URL |
| `reason` | string | 추천 이유 |
| `source` | `'item_cf' \| 'fallback'` | 추천 출처. Item CF 결과인지 fallback 보충 추천인지 구분 |
| `score` | number \| null | Item CF 유사도 점수. `source`가 `fallback`이면 null |
| `coRatingCount` | number \| null | 두 영화를 함께 평가한 사용자 수. `source`가 `fallback`이면 null |
| `isBookmarked` | boolean | 현재 사용자의 찜 여부 |

`RecommendationSection` 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `seedMovie` | object | 섹션 기준이 되는 온보딩 선택 영화 |
| `title` | string | 섹션 제목. 예: `{영화 제목}을 좋아한 사람들이 함께 좋아한 영화` |
| `movies` | `RecommendedMovie[]` | 해당 seed 영화 기준 추천 영화 목록 |

`seedMovie` 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | TMDB movie id |
| `title` | string | 영화 제목 |
| `year` | number | 개봉 연도 |
| `posterUrl` | string | 포스터 이미지 URL |

## 추천 조회 로직

백엔드는 DB에 미리 적재된 `movie_similarities`를 기준으로 Item CF 추천을 조회한다.

조회 흐름:

1. 온보딩에서 선택한 영화 중 `seedLimit`개를 기준 영화로 사용한다. 기본은 `position`이 빠른 3개다.
2. 기준 영화별로 `movie_similarities.source_tmdb_id`를 조회한다.
3. Item CF 후보는 `score DESC`, `co_rating_count DESC`, `target_tmdb_id ASC` 순으로 정렬한다.
4. 최종 추천 결과에서 제외할 영화는 후보에서 제거한다.
5. 후보가 `limitPerSeed`보다 부족하면 fallback으로 빈칸을 채운다.
6. 백엔드가 영화 상세 필드, 장르, `isBookmarked`, `reason`, `source`, `score`, `coRatingCount`를 조립해 응답한다.

제외 대상:

| 대상 | 설명 |
|---|---|
| 온보딩 선택 영화 | 사용자가 이미 선택한 seed 영화 |
| 찜한 영화 | 현재 사용자가 이미 찜한 영화 |
| 리뷰한 영화 | 현재 사용자가 이미 리뷰한 영화 |
| 응답 내 중복 영화 | 같은 응답의 다른 섹션에서 이미 노출된 영화 |

fallback 후보는 제외 대상을 제거한 뒤 `movie_stats` 기준으로 조회한다.

> fallback: “Item CF 추천 결과가 부족할 때 빈칸을 채우기 위해 가져오는 보충 영화 목록”

fallback 정렬:

```text
movielens_rating_count DESC,
movielens_avg_rating DESC,
tmdb_id ASC
```

`source`가 `item_cf`인 추천은 `score`와 `coRatingCount`를 포함한다.

`source`가 `fallback`인 추천은 `score`와 `coRatingCount`를 null로 응답한다.
