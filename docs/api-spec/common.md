# 공통 API 타입

## 인증 표기

| 표기 | 의미 |
|---|---|
| 불필요 | 로그인 여부와 관계없이 동일하게 사용할 수 있다. |
| 선택 | 비로그인도 사용할 수 있으나, 로그인 시 사용자별 필드가 포함될 수 있다. |
| 필요 | 로그인 사용자만 사용할 수 있다. 비로그인 요청은 `401 Unauthorized`를 반환한다. |

## 공통 에러

| 상태 코드 | 용도 |
|---|---|
| `400 Bad Request` | 요청값 형식 또는 검증 실패 |
| `401 Unauthorized` | 로그인 필요 |
| `403 Forbidden` | 로그인했지만 접근 권한 없음 |
| `404 Not Found` | 대상 리소스 없음 |
| `409 Conflict` | 중복 생성 등 현재 상태와 충돌 |

## Pagination

목록 API는 필요한 경우 다음 필드를 사용한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `page` | number | 현재 페이지. 기본값은 1 |
| `size` | number | 페이지 크기 |
| `totalCount` | number | 전체 항목 수 |

## Genre

TMDB 장르 기준의 장르 표시 필드다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | TMDB genre id |
| `name` | string | TMDB 장르 이름 |

관련 DB 문서: [../db-schema/movies.md](../db-schema/movies.md)

## MovieCard

여러 화면에서 반복 사용되는 영화 카드 최소 필드다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | 영화 식별자. TMDB movie id |
| `title` | string | 영화 제목 |
| `year` | number | 개봉 연도 |
| `rating` | number | 평균 평점 |
| `genres` | `Genre[]` | TMDB 장르 목록 |
| `posterUrl` | string 또는 null | 포스터 이미지 URL |
| `isBookmarked` | boolean | 현재 로그인 사용자의 찜 여부 |

## UserSummary

사용자 표시용 최소 프로필이다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | 사용자 ID. `profiles.id` |
| `name` | string | 표시 이름 |
| `profileImageUrl` | string 또는 null | 프로필 이미지 URL |

관련 DB 문서: [../db-schema/users.md](../db-schema/users.md)

## Review

영화 상세 화면의 리뷰 목록에서 사용하는 필드다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | 리뷰 식별자 |
| `user` | `UserSummary` | 작성자 정보 |
| `rating` | number | 사용자가 준 평점. 0.5~5.0 |
| `content` | string | 리뷰 본문 |
| `date` | string | 작성일 |
| `likes` | number | 리뷰 좋아요 수 |
| `isLiked` | boolean | 현재 사용자의 리뷰 좋아요 여부 |

관련 DB 문서: [../db-schema/reviews-likes.md](../db-schema/reviews-likes.md)
