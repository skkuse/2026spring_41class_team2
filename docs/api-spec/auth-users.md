# 인증/사용자 API

관련 DB 문서: [../db-schema/users.md](../db-schema/users.md)

## `GET /api/me`

현재 요청의 로그인 상태와 내 기본 정보를 조회한다.

| 항목 | 내용 |
|---|---|
| 인증 | 선택 |
| 관련 화면 | 공통 Header, `/mypage` |
| Request | 없음 |
| Response | `authenticated`, `user` |

비로그인 요청도 정상 응답한다. 비로그인 시 `authenticated=false`, `user=null`이다.

`user` 객체 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | 사용자 ID. `profiles.id` |
| `name` | string | 표시 이름 |
| `email` | string | 이메일 |
| `profileImageUrl` | string 또는 null | 프로필 이미지 URL |
| `onboardingCompleted` | boolean | 온보딩 완료 여부 |
| `bookmarkedMovieCount` | number | 찜한 영화 수. 마이페이지 통계 표시용 |
| `reviewCount` | number | 작성 리뷰 수. 마이페이지 통계 표시용 |

`/mypage`에서는 `user=null`이면 로그인 화면으로 이동한다.

## `GET /api/me/preferences/movies`

내 온보딩 선호 영화 목록을 조회한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/onboarding`, `/recommend` |
| Request | 없음 |
| Response | `movies: MovieCard[]` |

`MovieCard`는 [common.md](./common.md)의 공통 타입을 따른다.

## `PUT /api/me/preferences/movies`

온보딩 선호 영화 5개를 저장한다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 관련 화면 | `/onboarding` |
| Request body | `movieIds: number[]` |
| Response | `movieIds`, `onboardingCompleted` |

정확히 5개를 선택해야 저장할 수 있다. 이 API는 전체 교체 방식으로 동작하므로 다시 호출하면 기존 선호 영화 row를 모두 삭제한 뒤 요청 배열 순서대로 다시 저장한다. 같은 요청을 반복하면 최종 상태는 동일하며, 같은 영화라도 순서가 다르면 새 순서가 `position`에 반영된다. 저장 후 `profiles.onboarding_completed = true`로 갱신한다.
