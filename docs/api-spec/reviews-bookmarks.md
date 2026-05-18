# 찜/리뷰 API

관련 DB 문서: [../db-schema/reviews-likes.md](../db-schema/reviews-likes.md)

## `GET /api/me/bookmarked-movies`

내가 찜한 영화 목록을 조회한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/mypage` |
| Query | `page`, `size` |
| Response | `movies: MovieCard[]`, `totalCount` |

`MovieCard`는 [common.md](./common.md)의 공통 타입을 따른다. 찜 목록에 포함된 영화이므로 각 항목의 `isBookmarked`는 `true`다. 포스터가 없는 영화의 `posterUrl`은 `null`이다.

## `PUT /api/me/bookmarked-movies/{movieId}`

영화를 찜 목록에 추가한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/search`, `/movie/[id]`, `/recommend` |
| Path | `movieId` |
| Response | `movieId`, `isBookmarked` |

## `DELETE /api/me/bookmarked-movies/{movieId}`

영화를 찜 목록에서 삭제한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/search`, `/movie/[id]`, `/recommend` |
| Path | `movieId` |
| Response | `movieId`, `isBookmarked` |

영화 자체가 존재하지 않는 `movieId`는 `404 Not Found`를 반환한다. 영화는 존재하지만 현재 사용자의 찜 row가 없는 경우에는 멱등 삭제로 보고 `200 OK`와 `isBookmarked=false`를 반환한다.

비로그인 사용자가 찜 버튼을 누르면 API 호출 대신 로그인 유도 UI를 표시한다.

## `GET /api/movies/{movieId}/reviews`

영화 리뷰 목록을 조회한다.

| 항목 | 내용 |
|---|---|
| 인증 | 선택 |
| 관련 화면 | `/movie/[id]` |
| Path | `movieId` |
| Query | `page`, `size`, `sort` |
| Response | `reviews: Review[]`, `totalCount` |

`Review`는 [common.md](./common.md)의 공통 타입을 따른다.

## `POST /api/movies/{movieId}/reviews`

영화 리뷰를 작성한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/movie/[id]` |
| Path | `movieId` |
| Request body | `rating`, `content` |
| Response | `reviewId`, `rating`, `content`, `date` |

평점은 0.5~5.0 범위를 사용한다. 같은 사용자가 이미 해당 영화에 리뷰를 작성했다면 `409 Conflict`를 반환한다. 등록 후 화면은 리뷰 목록과 평균 평점을 갱신해야 한다.

## `GET /api/me/reviews`

내가 작성한 리뷰 목록을 조회한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/mypage` |
| Query | `page`, `size` |
| Response | `reviews: MyReview[]`, `totalCount` |

`MyReview` 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | 리뷰 식별자 |
| `movieId` | number | TMDB movie id |
| `movieTitle` | string | 영화 제목 |
| `posterUrl` | string | 포스터 이미지 URL |
| `rating` | number | 사용자가 준 평점 |
| `content` | string | 리뷰 본문 |
| `date` | string | 작성일 |
| `likes` | number | 리뷰 좋아요 수 |

## `PUT /api/reviews/{reviewId}/like`

리뷰 좋아요를 추가한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/movie/[id]` |
| Path | `reviewId` |
| Response | `reviewId`, `likes`, `isLiked` |

## `DELETE /api/reviews/{reviewId}/like`

리뷰 좋아요를 삭제한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/movie/[id]` |
| Path | `reviewId` |
| Response | `reviewId`, `likes`, `isLiked` |
