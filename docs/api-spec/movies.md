# 영화/장르 API

관련 DB 문서: [../db-schema/movies.md](../db-schema/movies.md), [../db-schema/people.md](../db-schema/people.md), [../db-schema/item-cf-recommendations.md](../db-schema/item-cf-recommendations.md)

## `GET /api/movies`

영화 목록, 검색, 정렬 결과를 조회한다.

| 항목 | 내용 |
|---|---|
| 인증 | 선택 |
| 관련 화면 | `/`, `/search`, `/onboarding` |
| Query | `q?`, `sort?`, `page?`, `size?` |
| Response | `movies: MovieCard[]`, `page`, `size`, `totalCount` |

주요 사용 예:

| 화면 | Query | 비고 |
|---|---|---|
| `/` | `sort=popular&page=1&size=6` | 인기 영화 섹션 |
| `/` | `sort=rating&page=1&size=6` | 최고 평점 영화 섹션 |
| `/search` | `q&page=1&size=50` | 영화 제목 검색 결과 |
| `/onboarding` | `sort=popular&page=&size=` | 인기 영화 후보. 무한 스크롤 |

`MovieCard`는 [common.md](./common.md)의 공통 타입을 따른다. 현재 `movies.movielens_id`는 `not null`이므로 온보딩 후보용 별도 MovieLens 필터는 두지 않는다. 온보딩 화면에서는 검색을 제공하지 않는다.

## `GET /api/movies/{movieId}`

영화 상세 정보를 조회한다.

| 항목 | 내용 |
|---|---|
| 인증 | 선택 |
| 관련 화면 | `/movie/[id]` |
| Path | `movieId` |
| Response | 영화 상세 필드 |

응답 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | TMDB movie id |
| `title` | string | 영화 제목 |
| `originalTitle` | string 또는 null | 영화 원제 |
| `year` | number | 개봉 연도 |
| `rating` | number | 평균 평점 |
| `genres` | `Genre[]` | TMDB 장르 목록 |
| `runtime` | number 또는 null | 러닝타임 |
| `originalLanguage` | string 또는 null | 원어 코드 |
| `countries` | string[] | TMDB `production_countries[].iso_3166_1` 기준 제작 국가 코드 |
| `director` | string 또는 null | 감독 표시명 |
| `cast` | object[] | 주요 출연진 |
| `synopsis` | string 또는 null | 줄거리 |
| `posterUrl` | string 또는 null | 포스터 이미지 URL |
| `backdropUrl` | string 또는 null | 배경 이미지 URL |
| `trailerUrl` | string 또는 null | 예고편 URL |
| `isBookmarked` | boolean | 현재 로그인 사용자의 찜 여부 |
| `reviewCount` | number | 리뷰 수 |

`movieId`는 TMDB movie id다.

## `GET /api/movies/{movieId}/similar`

영화 상세 페이지의 비슷한 영화 목록을 조회한다.

| 항목 | 내용 |
|---|---|
| 인증 | 선택 |
| 관련 화면 | `/movie/[id]` |
| Path | `movieId` |
| Query | `limit?` |
| Response | `movies: MovieCard[]` |

`limit` 기본값은 4이며, 허용 범위는 1~20이다.

조회 로직:

1. `movie_similarities.source_movie_id`가 `movieId`인 row를 조회한다.
2. 후보는 `score DESC`, `co_rating_count DESC`, `target_movie_id ASC` 순으로 정렬한다.
3. 현재 보고 있는 영화는 결과에 포함하지 않는다.
4. 로그인 사용자는 맞춤 추천과 동일하게 온보딩 선택, 찜, 리뷰한 영화를 제외한다.
5. 백엔드가 영화 카드 표시 필드, 장르, `isBookmarked`를 조립해 응답한다.

추천 제외 규칙상 로그인 사용자의 찜한 영화는 결과에 포함되지 않으므로 `isBookmarked`는 `false`로 응답된다.

`MovieCard`는 [common.md](./common.md)의 공통 타입을 따른다.

## `GET /api/genres`

장르 목록을 조회한다.

| 항목 | 내용 |
|---|---|
| 인증 | 불필요 |
| 관련 화면 | 검색/필터 UI 확장 시 사용 |
| Request | 없음 |
| Response | `genres: Genre[]` |

`Genre`는 [common.md](./common.md)의 공통 타입을 따른다.
