# Item CF 구현 계획

이 문서는 `/recommend`의 온보딩 기반 Item CF 추천 구현에 필요한 DB 저장 구조와 조회 흐름을 정리한다.

현재 화면 기준 전제는 아래와 같다.

- 온보딩에서 사용자가 고른 5개 영화는 `user_onboarding_movies`에 저장한다.
- `/recommend`는 그 5개 중 랜덤으로 3개를 seed로 사용한다.
- 추천 화면은 seed 3개를 기준으로 섹션 3개를 만든다.
- 섹션 간 중복 영화는 제거한다.

## DB 저장 구조

### `user_onboarding_movies`

온보딩에서 사용자가 선택한 선호 영화를 저장한다. 이 데이터는 `/recommend` 화면의 Item CF seed로 사용한다.

```sql
CREATE TABLE user_onboarding_movies (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id bigint NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  position int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, movie_id),
  UNIQUE (user_id, position)
);
```

제약/메모:

- 온보딩은 정확히 5개를 선택해야 완료된다.
- `movie_id`는 TMDB id다.
- `position`은 사용자가 선택한 순서이며 1~5 범위로 저장한다.
- `/recommend`는 이 테이블에서 사용자의 5개 영화를 읽고, 그중 3개를 랜덤으로 seed로 뽑는다.

### `movielens_item_similarities`

Item CF 추천 결과를 미리 저장하는 테이블이다.

```sql
CREATE TABLE movielens_item_similarities (
  source_tmdb_id INTEGER NOT NULL REFERENCES movie_stats(tmdb_id) ON DELETE CASCADE,
  target_tmdb_id INTEGER NOT NULL REFERENCES movie_stats(tmdb_id) ON DELETE CASCADE,
  score REAL NOT NULL,
  co_rating_count INTEGER NOT NULL,
  PRIMARY KEY (source_tmdb_id, target_tmdb_id)
);
```

이 테이블은 온보딩에서 선택한 영화 기반 Item CF 추천에 사용한다.

```text
source_tmdb_id = 기준 영화
target_tmdb_id = 함께 추천할 영화
score = Item CF 유사도 점수
co_rating_count = 두 영화를 함께 평가한 사용자 수
```

전처리 단계에서 `ratings.csv`를 사용해 선택된 3,000개 영화 간의 유사도를 미리 계산한 뒤, 각 기준 영화별 상위 유사 영화만 저장한다.

예를 들어 사용자가 온보딩에서 The Matrix를 선택했다면, 서버는 이 테이블에서 `source_tmdb_id = The Matrix의 tmdb_id`인 유사 영화 목록을 조회해 추천 섹션을 만든다.


### `movie_stats`

Item CF 결과가 부족할 때 사용하는 fallback 기준 테이블이다.

```sql
CREATE TABLE movie_stats (
  tmdb_id INTEGER PRIMARY KEY,
  movie_lens_id INTEGER NOT NULL UNIQUE,
  rating_count INTEGER NOT NULL,
  average_rating REAL NOT NULL,
  user_tag_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

이 테이블은 인기작 fallback에 사용한다. 태그 기반 fallback은 사용하지 않는다.

## 인덱스

```sql
CREATE INDEX idx_movielens_item_similarities_source_score
ON movielens_item_similarities (source_tmdb_id, score DESC);
```

기준 영화별 유사 영화를 빠르게 조회하기 위한 인덱스다.

## 생성할 중간 파일

```text
movielens_item_similarities_subset.csv
```

## 구현 단계

1. `ratings.csv`를 사용해 최종 3,000개 영화 간 Item CF 유사도를 미리 계산한다.
2. 각 기준 영화별 상위 유사 영화만 남긴다.
3. `movielens_item_similarities_subset.csv`를 생성한다.
4. `user_onboarding_movies`에서 사용자의 5개 선호 영화를 읽는다.
5. 그중 3개를 랜덤으로 seed로 뽑는다.
6. 각 seed에 대해 `movielens_item_similarities`에서 추천 후보를 조회한다.
7. 섹션 간 중복 영화는 제거한다.
8. 추천 결과가 부족하면 `movie_stats`에서 `rating_count`, `average_rating` 기준 인기작으로 채운다.
9. Supabase에 테이블과 인덱스를 생성한다.
10. CSV를 Supabase에 저장한다.

## 추천 응답 형식

추천 API는 `MovieCard`가 바로 사용할 수 있는 형태로 내려준다.

```text
id = tmdb_id
title = 영화 제목
year = 개봉 연도
rating = 추천용 점수 또는 표시용 평점
genre = 대표 장르
posterUrl = 포스터 이미지 URL
reason = 추천 이유
```

## fallback 정책

fallback은 단순하게 유지한다.

1. seed 영화의 Item CF 결과를 우선 사용한다.
2. 결과가 부족하면 `movie_stats`의 인기작으로 채운다.
3. 인기작 정렬은 `rating_count DESC, average_rating DESC`로 둔다.

태그 기반 fallback은 사용하지 않는다.

## 데이터 검증

| 항목 | 기준 |
|---|---|
| `movielens_item_similarities` row 수 | 기준 영화별 상위 유사 영화 수에 맞게 제한 |
| 기준 영화 매칭 | 모든 `source_tmdb_id`가 `movie_stats.tmdb_id`에 존재 |
| 대상 영화 매칭 | 모든 `target_tmdb_id`가 `movie_stats.tmdb_id`에 존재 |
| 온보딩 seed | 사용자당 5개 저장, 추천 시 3개 랜덤 선택 |
| 추천 중복 | 섹션 간 중복 영화 없음 |
