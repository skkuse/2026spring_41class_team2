# 화면별 API 매핑

이 문서는 화면에서 필요한 API를 빠르게 찾기 위한 색인이다. API별 요청/응답 상세는 각 도메인 문서를 따른다.

## 공통 Header

| 기능/영역 | 사용자 액션 | API | 상세 문서 | 인증 | 비고 |
|---|---|---|---|---|---|
| 로그인 상태 표시 | 화면 진입 | `GET /api/me` | [auth-users.md](./auth-users.md) | 선택 | 비로그인도 정상 응답 |
| 로그아웃 | 로그아웃 클릭 | API 없음 | - | 필요 | Supabase `signOut` 사용 |

## `/` 홈

| 기능/영역 | 사용자 액션 | API | 상세 문서 | 인증 | 비고 |
|---|---|---|---|---|---|
| 인기 영화 섹션 | 화면 진입 | `GET /api/movies?sort=popular&page=1&size=6` | [movies.md](./movies.md) | 선택 | 공개 영화 목록 |
| 최고 평점 섹션 | 화면 진입 | `GET /api/movies?sort=rating&page=1&size=6` | [movies.md](./movies.md) | 선택 | 공개 영화 목록 |
| 자주 묻는 AI 질문 | 질문 클릭 | API 없음 | - | 불필요 | `/chat?q=...`로 이동 |

## `/search` 영화 탐색

| 기능/영역 | 사용자 액션 | API | 상세 문서 | 인증 | 비고 |
|---|---|---|---|---|---|
| 영화 검색 결과 | 검색어 입력 | `GET /api/movies?q=...&page=1&size=50` | [movies.md](./movies.md) | 선택 | 공개 영화 목록 |
| 영화 찜 | 하트 클릭 | `PUT/DELETE /api/me/bookmarked-movies/{movieId}` | [reviews-bookmarks.md](./reviews-bookmarks.md) | 필요 | 낙관적 업데이트 후 실패 시 되돌림 |

## `/movie/[id]` 영화 상세

| 기능/영역 | 사용자 액션 | API | 상세 문서 | 인증 | 비고 |
|---|---|---|---|---|---|
| 영화 상세 정보 | 화면 진입 | `GET /api/movies/{movieId}` | [movies.md](./movies.md) | 선택 | `movieId`는 TMDB movie id |
| 찜하기 | 찜하기 클릭 | `PUT/DELETE /api/me/bookmarked-movies/{movieId}` | [reviews-bookmarks.md](./reviews-bookmarks.md) | 필요 | 낙관적 업데이트 후 실패 시 되돌림 |
| 사용자 리뷰 목록 | 화면 진입 | `GET /api/movies/{movieId}/reviews` | [reviews-bookmarks.md](./reviews-bookmarks.md) | 선택 | 현재 상세 데이터 안에 포함 |
| 리뷰 작성 | 리뷰 등록 | `POST /api/movies/{movieId}/reviews` | [reviews-bookmarks.md](./reviews-bookmarks.md) | 필요 | 중복 작성 시 `409 Conflict` |
| 리뷰 좋아요 | 좋아요 클릭 | `PUT/DELETE /api/reviews/{reviewId}/like` | [reviews-bookmarks.md](./reviews-bookmarks.md) | 필요 | 현재 버튼은 카운트만 표시 |
| 비슷한 영화 | 화면 진입 | API 없음 | - | 불필요 | 현재 하드코딩, 추후 Item-CF API 전환 |

## `/chat` AI 영화 추천

| 기능/영역 | 사용자 액션 | API | 상세 문서 | 인증 | 비고 |
|---|---|---|---|---|---|
| 초기 추천 질문 | 화면 진입 | `GET /api/recommendation-chat/initial-questions` | [recommendation-chat.md](./recommendation-chat.md) | 불필요 | 사용자 맥락 없는 초기 질문 |
| 대화 메시지 전송 | 질문 입력/추천 질문 클릭 | `POST /api/recommendation-chat/messages` | [recommendation-chat.md](./recommendation-chat.md) | 필요 | 첫 메시지에서 대화 생성 가능 |
| 대화 기록 | 화면 진입 | `GET /api/recommendation-chat/conversations` | [recommendation-chat.md](./recommendation-chat.md) | 필요 | 사이드바 목록 |
| 대화 상세 | 대화 선택 | `GET /api/recommendation-chat/conversations/{conversationId}` | [recommendation-chat.md](./recommendation-chat.md) | 필요 | 메시지와 추천 결과 조회 |

## `/recommend` 맞춤 추천

| 기능/영역 | 사용자 액션 | API | 상세 문서 | 인증 | 비고 |
|---|---|---|---|---|---|
| 온보딩 영화 기반 추천 섹션 | 화면 진입 | `GET /api/me/recommendations/item-cf` | [item-cf-recommendations.md](./item-cf-recommendations.md) | 필요 | Python 추천 서버 결과를 백엔드가 조립 |
| 추천 영화 찜 | 하트 클릭 | `PUT/DELETE /api/me/bookmarked-movies/{movieId}` | [reviews-bookmarks.md](./reviews-bookmarks.md) | 필요 | 낙관적 업데이트 후 실패 시 되돌림 |

## `/character-chat` 캐릭터 대화

| 기능/영역 | 사용자 액션 | API | 상세 문서 | 인증 | 비고 |
|---|---|---|---|---|---|
| 캐릭터 대화 가능 영화 목록 | 화면 진입 | `GET /api/character-chat/movies` | [character-chat.md](./character-chat.md) | 필요 | 로그인 뒤 기능 |
| 영화별 캐릭터 목록 | 영화 선택 | `GET /api/character-chat/movies/{movieId}/characters` | [character-chat.md](./character-chat.md) | 필요 | 목록 API에 포함 가능 |
| 캐릭터 대화 시작 | 캐릭터 선택 | `POST /api/character-chat/conversations` | [character-chat.md](./character-chat.md) | 필요 | 기본 추천 질문 반환 |
| 캐릭터 메시지 전송 | 메시지 입력/추천 질문 클릭 | `POST /api/character-chat/conversations/{conversationId}/messages` | [character-chat.md](./character-chat.md) | 필요 | 맥락 기반 추천 질문 반환 |
| 배우 기반 추천 | 배우 추천 버튼 클릭 | API 없음 | - | 불필요 | `/chat` API가 처리 |

## `/mypage` 마이페이지

| 기능/영역 | 사용자 액션 | API | 상세 문서 | 인증 | 비고 |
|---|---|---|---|---|---|
| 프로필 헤더 | 화면 진입 | `GET /api/me` | [auth-users.md](./auth-users.md) | 필요 | `user=null`이면 로그인 화면으로 이동 |
| 찜한 영화 탭 | 탭 진입 | `GET /api/me/bookmarked-movies?page=&size=` | [reviews-bookmarks.md](./reviews-bookmarks.md) | 필요 | 초기 20개 로드 후 스크롤 시 추가 조회 |
| 내 리뷰 탭 | 탭 진입 | `GET /api/me/reviews` | [reviews-bookmarks.md](./reviews-bookmarks.md) | 필요 | 현재 하드코딩 |
| 프로필 수정 | 수정 클릭 | `PATCH /api/me` | [auth-users.md](./auth-users.md) | 필요 | 수정 화면 미구현 |
| 설정 | 설정 클릭 | API 없음 | - | 필요 | 현재 범위 제외 |

## `/login` 로그인

| 기능/영역 | 사용자 액션 | API | 상세 문서 | 인증 | 비고 |
|---|---|---|---|---|---|
| Google 로그인 | Google로 계속하기 클릭 | API 없음 | - | 불필요 | Supabase `signInWithOAuth` 사용 |

## `/onboarding` 선호 영화 선택

| 기능/영역 | 사용자 액션 | API | 상세 문서 | 인증 | 비고 |
|---|---|---|---|---|---|
| 인기 영화 선택지 | 화면 진입/스크롤 | `GET /api/movies?sort=popular&page=&size=` | [movies.md](./movies.md) | 선택 | 화면 접근은 로그인 필요, API는 공개 |
| 선호 영화 저장 | 5개 선택 후 시작하기 클릭 | `PUT /api/me/preferences/movies` | [auth-users.md](./auth-users.md) | 필요 | 정확히 5개 저장 |
