# Cinemate API Spec

이 폴더는 Cinemate 백엔드 API의 기준 문서다.

화면 구현계획 문서는 API 요청/응답을 직접 중복 작성하지 않고 이 폴더의 문서를 참조한다. DB 테이블 정의의 기준 문서는 [../db-schema/README.md](../db-schema/README.md)를 따른다.

## 작성 기준

| 항목 | 설명 |
|---|---|
| Method/Path | Next.js App Router의 `app/api/**/route.ts`로 구현할 REST API 경로 |
| 인증 | `필요`, `선택`, `불필요` 중 하나 |
| Request | path, query, body에 포함될 주요 값 |
| Response | 화면 렌더링에 필요한 주요 필드 |
| 관련 화면 | API를 사용하는 Next.js 화면 또는 공통 컴포넌트 |
| 관련 DB 문서 | API 구현 시 참조할 `docs/db-schema/**` 문서 |

상세 JSON Schema보다 구현에 필요한 요청값과 응답 필드를 중심으로 작성한다. 공통 응답 타입은 [common.md](./common.md)를 참조한다.

## 문서 목록

| 문서 | 범위 |
|---|---|
| [common.md](./common.md) | 공통 타입, 인증 표기, 공통 에러 |
| [auth-users.md](./auth-users.md) | 현재 사용자, 프로필, 온보딩 선호 영화 |
| [movies.md](./movies.md) | 영화 목록/검색/상세, 장르, 유사 영화 |
| [reviews-bookmarks.md](./reviews-bookmarks.md) | 영화 찜, 리뷰, 리뷰 좋아요 |
| [item-cf-recommendations.md](./item-cf-recommendations.md) | 온보딩 기반 Item CF 추천 |
| [recommendation-chat.md](./recommendation-chat.md) | AI 영화 추천 채팅 |
| [character-chat.md](./character-chat.md) | 캐릭터 대화 |
| [screen-mapping.md](./screen-mapping.md) | 화면별 API 사용 매핑 |

## 통합 API 목록

### 인증/사용자

| Method | Path | 목적 | 인증 | 문서 |
|---|---|---|---|---|
| `GET` | `/api/me` | 현재 로그인 상태 및 내 정보 조회 | 선택 | [auth-users.md](./auth-users.md) |
| `PATCH` | `/api/me` | 프로필 수정 | 필요 | [auth-users.md](./auth-users.md) |
| `GET` | `/api/me/preferences/movies` | 내 온보딩 선호 영화 조회 | 필요 | [auth-users.md](./auth-users.md) |
| `PUT` | `/api/me/preferences/movies` | 온보딩 선호 영화 5개 저장 | 필요 | [auth-users.md](./auth-users.md) |

### 영화/장르

| Method | Path | 목적 | 인증 | 문서 |
|---|---|---|---|---|
| `GET` | `/api/movies` | 영화 목록, 검색, 정렬 | 선택 | [movies.md](./movies.md) |
| `GET` | `/api/movies/{movieId}` | 영화 상세 조회 | 선택 | [movies.md](./movies.md) |
| `GET` | `/api/movies/{movieId}/similar` | 유사 영화 조회 | 선택 | [movies.md](./movies.md) |
| `GET` | `/api/genres` | 장르 목록 조회 | 불필요 | [movies.md](./movies.md) |

### 찜/리뷰

| Method | Path | 목적 | 인증 | 문서 |
|---|---|---|---|---|
| `GET` | `/api/me/bookmarked-movies` | 내 찜 영화 목록 | 필요 | [reviews-bookmarks.md](./reviews-bookmarks.md) |
| `PUT` | `/api/me/bookmarked-movies/{movieId}` | 영화 찜 추가 | 필요 | [reviews-bookmarks.md](./reviews-bookmarks.md) |
| `DELETE` | `/api/me/bookmarked-movies/{movieId}` | 영화 찜 삭제 | 필요 | [reviews-bookmarks.md](./reviews-bookmarks.md) |
| `GET` | `/api/movies/{movieId}/reviews` | 영화 리뷰 목록 | 선택 | [reviews-bookmarks.md](./reviews-bookmarks.md) |
| `POST` | `/api/movies/{movieId}/reviews` | 리뷰 작성 | 필요 | [reviews-bookmarks.md](./reviews-bookmarks.md) |
| `GET` | `/api/me/reviews` | 내가 작성한 리뷰 목록 | 필요 | [reviews-bookmarks.md](./reviews-bookmarks.md) |
| `PUT` | `/api/reviews/{reviewId}/like` | 리뷰 좋아요 추가 | 필요 | [reviews-bookmarks.md](./reviews-bookmarks.md) |
| `DELETE` | `/api/reviews/{reviewId}/like` | 리뷰 좋아요 삭제 | 필요 | [reviews-bookmarks.md](./reviews-bookmarks.md) |

### 추천/채팅

| Method | Path | 목적 | 인증 | 문서 |
|---|---|---|---|---|
| `GET` | `/api/me/recommendations/item-cf` | 온보딩 영화 기반 Item CF 추천 섹션 조회 | 필요 | [item-cf-recommendations.md](./item-cf-recommendations.md) |
| `GET` | `/api/recommendation-chat/initial-questions` | 초기 추천 질문 목록 조회 | 불필요 | [recommendation-chat.md](./recommendation-chat.md) |
| `POST` | `/api/recommendation-chat/messages` | 추천 채팅 메시지 전송 | 필요 | [recommendation-chat.md](./recommendation-chat.md) |
| `GET` | `/api/recommendation-chat/conversations` | 내 추천 대화 목록 | 필요 | [recommendation-chat.md](./recommendation-chat.md) |
| `GET` | `/api/recommendation-chat/conversations/{conversationId}` | 추천 대화 상세 조회 | 필요 | [recommendation-chat.md](./recommendation-chat.md) |

### 캐릭터 대화

| Method | Path | 목적 | 인증 | 문서 |
|---|---|---|---|---|
| `GET` | `/api/character-chat/movies` | 캐릭터 대화 가능 영화 목록 | 필요 | [character-chat.md](./character-chat.md) |
| `GET` | `/api/character-chat/movies/{movieId}/characters` | 영화별 캐릭터 목록 | 필요 | [character-chat.md](./character-chat.md) |
| `POST` | `/api/character-chat/conversations` | 캐릭터 대화 세션 생성 | 필요 | [character-chat.md](./character-chat.md) |
| `POST` | `/api/character-chat/conversations/{conversationId}/messages` | 캐릭터 메시지 전송 | 필요 | [character-chat.md](./character-chat.md) |

## 우선순위 제안

| 우선순위 | API 묶음 | 이유 |
|---|---|---|
| 1 | `GET /api/movies`, `GET /api/movies/{movieId}`, `GET /api/genres` | 홈, 검색, 상세 화면의 기본 데이터 기반 |
| 2 | 리뷰 조회/작성, 찜 추가/삭제 | 사용자 상호작용이 있는 핵심 기능 |
| 3 | 로그인, `GET /api/me`, 마이페이지 | 개인화와 사용자 데이터의 전제 |
| 4 | `PUT /api/me/preferences/movies`, `/api/me/recommendations/item-cf`, `/api/recommendation-chat/messages` | 온보딩 기반 개인화와 서비스 차별화 기능 |
| 5 | 캐릭터 대화 API | 별도 AI/대화 설계가 필요한 확장 기능 |

## 결정된 정책

| 항목 | 결정 내용 | API 반영 기준 |
|---|---|---|
| 평점 기준 | 0.5~5.0 범위 사용 | DB 기준 5점 만점 |
| 비로그인 찜/리뷰 | 클릭 시 로그인 유도 | 로그인 유도 |
| AI 추천 채팅 | 비로그인 사용 불가 | 로그인 사용자만 사용/저장 |
| 캐릭터 채팅 | 전체 기능을 로그인 뒤로 잠금 | 로그인 사용자만 사용/저장 |
| 영화 데이터 소스 | MovieLens + TMDB enrich. MovieLens에 `tmdbId`가 있는 영화만 적재 | 백엔드에서 정규화된 자체 응답 제공 |
| 이미지 URL | 외부 이미지 URL 직접 사용 또는 프록시 사용 | 외부 URL 직접 사용 |
| 온보딩 | 로그인 사용자만 가능. 인기 영화 중 선호 영화 5개를 반드시 선택 | `user_onboarding_movies` 저장 후 `profiles.onboarding_completed = true` |
