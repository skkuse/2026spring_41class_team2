# Cinemate 화면별 API 요구사항

이 문서는 현재 Next.js 화면에서 하드코딩 또는 클라이언트 상태로 처리되는 데이터를 기준으로, 백엔드 구현 시 필요한 API를 화면별로 정리한 초안이다. 상세 JSON 스키마보다는 화면 구현에 필요한 요청값과 응답 필드를 중심으로 작성한다.

## 기술 기준

| 항목 | 설명 |
|---|---|
| 화면 | Next.js 라우트 또는 공통 컴포넌트 기준 |
| 기능/영역 | 화면 안에서 API가 필요한 UI 영역 |
| 사용자 액션 | 사용자가 수행하는 동작. 단순 진입이면 "화면 진입" |
| 필요한 API | 백엔드가 제공해야 하는 기능명 |
| Method/Path 초안 | REST API 기준의 임시 경로 |
| 요청값 | query, path, body에 포함될 주요 값 |
| 응답 필드 | 화면 렌더링에 필요한 주요 필드 |
| 인증 | 필요, 선택, 불필요 중 하나 |
| 비고 | 현재 화면 구현 상태 또는 백엔드 구현 시 고려사항 |

## 공통 데이터 필드

### MovieCard

여러 화면에서 반복 사용되는 영화 카드 최소 필드다.

| 필드        | 타입                           | 설명                         |
| ----------- | ------------------------------ | ---------------------------- |
| `id`        | number                         | 영화 식별자. TMDB movie id   |
| `title`     | string                         | 영화 제목                    |
| `year`      | number                         | 개봉 연도                    |
| `rating`    | number                         | 평균 평점                    |
| `genres`    | { id: number, name: string }[] | TMDB 장르 목록               |
| `posterUrl` | string                         | 포스터 이미지 URL            |
| `isLiked`   | boolean                        | 현재 로그인 사용자의 찜 여부 |

`genres`는 TMDB 영화 상세 응답의 `genres` 타입을 따른다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | TMDB genre id |
| `name` | string | TMDB 장르 이름 |

### Review

| 필드        | 타입      | 설명                 |
| --------- | ------- | ------------------ |
| `id`      | string  | 리뷰 식별자             |
| `user`    | object  | 작성자 정보             |
| `rating`  | number  | 사용자가 준 평점. 0.5~5.0 |
| `content` | string  | 리뷰 본문              |
| `date`    | string  | 작성일                |
| `likes`   | number  | 리뷰 좋아요 수           |
| `isLiked` | boolean | 현재 사용자의 리뷰 좋아요 여부  |

`user` 필드는 리뷰 작성자 표시용 최소 프로필이다.

| 필드                | 타입             | 설명                        |
| ----------------- | -------------- | ------------------------- |
| `id`              | string         | 작성자 사용자 ID. `profiles.id` |
| `name`            | string         | 작성자 표시 이름                 |
| `profileImageUrl` | string 또는 null | 작성자 프로필 이미지 URL           |

## 화면별 API 요구사항

### 공통 Header

| 화면  | 기능/영역     | 사용자 액션  | 필요한 API    | Method/Path 초안          | 요청값 | 응답 필드                                                           | 인증  | 비고                                    |
| --- | --------- | ------- | ---------- | ----------------------- | --- | --------------------------------------------------------------- | --- | ------------------------------------- |
| 공통  | 로그인 상태 표시 | 화면 진입   | 내 기본 정보 조회 | `GET /api/me`           | 없음  | `authenticated`, `user` | 선택  | 비로그인도 정상 응답. 비로그인 시 `authenticated=false`, `user=null` |
| 공통  | 로그아웃      | 로그아웃 클릭 | Supabase Auth 로그아웃 | API 없음 | 없음  | 없음                                                       | 필요  | 백엔드 REST API가 아니라 Supabase `signOut` 사용 |

`GET /api/me` 응답의 `user` 필드는 로그인 상태일 때만 값이 있다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `authenticated` | boolean | 현재 요청의 로그인 여부 |
| `user` | object 또는 null | 로그인 사용자 정보. 비로그인 시 null |

`user` 객체 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | 사용자 ID. `profiles.id` |
| `name` | string | 표시 이름 |
| `email` | string | 이메일 |
| `profileImageUrl` | string 또는 null | 프로필 이미지 URL |
| `onboardingCompleted` | boolean | 온보딩 완료 여부 |
| `likedMovieCount` | number | 찜한 영화 수. 마이페이지 통계 표시용 |
| `reviewCount` | number | 작성 리뷰 수. 마이페이지 통계 표시용 |

### `/` 홈

| 화면 | 기능/영역 | 사용자 액션 | 필요한 API | Method/Path 초안 | 요청값 | 응답 필드 | 인증 | 비고 |
|---|---|---|---|---|---|---|---|---|
| `/` | 인기 영화 섹션 | 화면 진입 | 인기 영화 목록 조회 | `GET /api/movies` | `sort=popular`, `limit=6` | `movies: MovieCard[]` | 선택 | 현재 `popularMovies` 하드코딩 |
| `/` | 최고 평점 섹션 | 화면 진입 | 최고 평점 영화 목록 조회 | `GET /api/movies` | `sort=rating`, `limit=6` | `movies: MovieCard[]` | 선택 | 현재 `topRatedMovies` 하드코딩 |
| `/` | 자주 묻는 AI 질문 | 질문 클릭 | 채팅 화면 이동 | API 없음 | 없음 | 없음 | 불필요 | `/chat?q=...`로 이동 |

### `/search` 영화 탐색

| 화면        | 기능/영역    | 사용자 액션 | 필요한 API  | Method/Path 초안                                                                  | 요청값                                  | 응답 필드                                               | 인증  | 비고                           |
| --------- | -------- | ------ | -------- | ------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------- | --- | ---------------------------- |
| `/search` | 영화 검색 결과 | 검색어 입력 | 영화 검색    | `GET /api/movies`                                                               | `q`, `page`, `size` | `movies: MovieCard[]`, `totalCount`, `page`, `size` | 선택  | 현재는 `allMovies`를 제목 기준으로 클라이언트에서 필터링 |
| `/search` | 영화 찜     | 하트 클릭                | 찜 추가/삭제  | `PUT /api/me/liked-movies/{movieId}` 또는 `DELETE /api/me/liked-movies/{movieId}` | `movieId`                            | `movieId`, `isLiked`                                | 필요  | `MovieCard` 내부 상태로만 처리 중     |

### `/movie/[id]` 영화 상세

| 화면 | 기능/영역 | 사용자 액션 | 필요한 API | Method/Path 초안 | 요청값 | 응답 필드 | 인증 | 비고 |
|---|---|---|---|---|---|---|---|---|
| `/movie/[id]` | 영화 상세 정보 | 화면 진입 | 영화 상세 조회 | `GET /api/movies/{movieId}` | `movieId` | `id`, `title`, `originalTitle`, `year`, `rating`, `genres`, `runtime`, `originalLanguage`, `countries`, `director`, `cast`, `synopsis`, `posterUrl`, `backdropUrl`, `trailerUrl`, `isLiked`, `reviewCount` | 선택 | `movieId`는 TMDB movie id. `countries`는 TMDB `production_countries` 기준 |
| `/movie/[id]` | 찜하기 | 찜하기 클릭 | 찜 추가/삭제 | `PUT /api/me/liked-movies/{movieId}` 또는 `DELETE /api/me/liked-movies/{movieId}` | `movieId` | `movieId`, `isLiked` | 필요 | 현재 `isLiked` 로컬 상태 |
| `/movie/[id]` | 사용자 리뷰 목록 | 화면 진입 | 영화 리뷰 목록 조회 | `GET /api/movies/{movieId}/reviews` | `movieId`, `page`, `size`, `sort` | `reviews: Review[]`, `totalCount` | 선택 | 현재 상세 데이터 안에 reviews 포함 |
| `/movie/[id]` | 리뷰 작성 | 평점 선택 후 리뷰 등록 | 리뷰 생성 | `POST /api/movies/{movieId}/reviews` | `movieId`, `rating`, `content` | `reviewId`, `rating`, `content`, `date` | 필요 | 등록 후 리뷰 목록과 평균 평점 갱신 필요. 같은 사용자가 이미 해당 영화에 리뷰를 작성했다면 `409 Conflict` |
| `/movie/[id]` | 리뷰 좋아요 | 리뷰 좋아요 클릭 | 리뷰 좋아요 추가/삭제 | `PUT /api/reviews/{reviewId}/like` 또는 `DELETE /api/reviews/{reviewId}/like` | `reviewId` | `reviewId`, `likes`, `isLiked` | 필요 | 현재 버튼은 카운트만 표시 |
| `/movie/[id]` | 비슷한 영화 | 화면 진입 | 유사 영화 조회 | `GET /api/movies/{movieId}/similar` | `movieId`, `limit=4` | `movies: { id, title, posterUrl }[]` | 선택 | 현재 `similarMovies` 하드코딩 |

### `/chat` AI 영화 추천

| 화면 | 기능/영역 | 사용자 액션 | 필요한 API | Method/Path 초안 | 요청값 | 응답 필드 | 인증 | 비고 |
|---|---|---|---|---|---|---|---|---|
| `/chat` | 추천 질문 목록 | 화면 진입 | 추천 질문 목록 조회 | `GET /api/chat/suggested-questions` | `type=movie-recommendation` | `questions: string[]` | 불필요 | 현재 `suggestedQuestions` 하드코딩 |
| `/chat` | 대화 메시지 전송 | 질문 입력/추천 질문 클릭 | AI 영화 추천 대화 | `POST /api/chat/recommendations` | `message`, `conversationId?` | `conversationId`, `answer`, `movies: MovieRecommendation[]` | 필요 | 비로그인 사용자는 추천 채팅 사용 불가 |
| `/chat` | 대화 기록 | 화면 진입 | 내 추천 대화 목록 조회 | `GET /api/me/chat-conversations` | `page`, `size` | `conversations: { id, title, updatedAt }[]` | 필요 | 현재 사이드바 제목만 존재 |
| `/chat` | 대화 상세 | 대화 선택 | 추천 대화 메시지 조회 | `GET /api/me/chat-conversations/{conversationId}` | `conversationId` | `messages: { id, role, content, movies?, createdAt }[]` | 필요 | 대화 저장을 지원할 경우 필요 |
| `/chat` | 새 대화 | 새 대화 클릭 | 추천 대화 생성 | `POST /api/me/chat-conversations` | 없음 또는 `initialMessage?` | `conversationId` | 필요 | 비로그인 사용자는 추천 채팅 사용 불가 |

`MovieRecommendation` 필드: `id`, `title`, `year`, `rating`, `genres`, `reason`, `posterUrl`.

### `/recommend` 맞춤 추천

| 화면           | 기능/영역           | 사용자 액션 | 필요한 API          | Method/Path 초안                                                                  | 요청값                         | 응답 필드                               | 인증  | 비고                                                                                   |
| ------------ | --------------- | ------ | ---------------- | ------------------------------------------------------------------------------- | --------------------------- | ----------------------------------- | --- | ------------------------------------------------------------------------------------ |
| `/recommend` | 온보딩 영화 기반 추천 섹션 | 화면 진입  | Item CF 추천 섹션 조회 | `GET /api/me/recommendations/item-cf`                                           | `seedLimit`, `limitPerSeed` | `sections: RecommendationSection[]` | 필요  | 온보딩에서 선택한 영화 5개 중 `seedLimit`개를 기준으로 섹션 생성. Python 추천 서버의 MovieLens 기반 Item CF 결과 사용 |
| `/recommend` | 추천 영화 찜         | 하트 클릭  | 찜 추가/삭제          | `PUT /api/me/liked-movies/{movieId}` 또는 `DELETE /api/me/liked-movies/{movieId}` | `movieId`                   | `movieId`, `isLiked`                | 필요  | 현재 카드 내부 로컬 상태                                                                       |

`RecommendedMovie` 필드: `id`, `title`, `year`, `rating`, `genres`, `posterUrl`, `reason`, `isLiked`.

`RecommendationSection` 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `seedMovie` | object | 섹션 기준이 되는 온보딩 선택 영화 |
| `title` | string | 섹션 제목. 예: `{영화 제목}을 좋아한 사람들이 함께 좋아한 영화` |
| `movies` | RecommendedMovie[] | 해당 seed 영화 기준 추천 영화 목록 |

`seedMovie` 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | TMDB movie id |
| `title` | string | 영화 제목 |
| `year` | number | 개봉 연도 |
| `posterUrl` | string | 포스터 이미지 URL |

`seedLimit`은 온보딩에서 선택한 영화 5개 중 추천 섹션을 만들 기준 영화를 몇 개 사용할지 의미한다. 기본값은 3이다.

`limitPerSeed`는 각 seed 영화 섹션마다 추천 영화를 몇 개 반환할지 의미한다. 기본값은 10이다.

백엔드는 `/recommend` 요청을 처리할 때 Python 추천 서버에 다음 값으로 Item CF 추천을 요청한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `seedMovieIds` | number[] | 온보딩에서 선택한 영화 중 `seedLimit`개. 기본은 `position`이 빠른 3개 |
| `limitPerSeed` | number | 각 seed 영화별 추천 개수 |
| `excludeMovieIds` | number[] | 최종 추천 결과에서 제외할 영화 ID 목록 |

`excludeMovieIds`에는 온보딩에서 선택한 영화, 이미 찜한 영화, 이미 리뷰한 영화를 포함한다. 추천 결과가 부족하면 `excludeMovieIds`를 제외한 평점 높은 영화로 보충한다.

Python 추천 서버 응답은 seed 영화별 추천 movie id와 score만 포함하고, 백엔드가 영화 상세 필드, 장르, `isLiked`, `reason`을 조립한다.

### `/character-chat` 캐릭터 대화

| 화면 | 기능/영역 | 사용자 액션 | 필요한 API | Method/Path 초안 | 요청값 | 응답 필드 | 인증 | 비고 |
|---|---|---|---|---|---|---|---|---|
| `/character-chat` | 캐릭터 대화 가능 영화 목록 | 화면 진입 | 캐릭터 포함 영화 목록 조회 | `GET /api/character-chat/movies` | 없음 또는 `page`, `size` | `movies: CharacterMovie[]` | 필요 | 캐릭터 채팅 전체를 로그인 뒤 기능으로 잠금 |
| `/character-chat` | 영화별 캐릭터 목록 | 영화 선택 | 영화 캐릭터 목록 조회 | `GET /api/movies/{movieId}/characters` | `movieId` | `characters: Character[]` | 필요 | 목록 API에 포함해도 됨 |
| `/character-chat` | 캐릭터 대화 시작 | 캐릭터 선택 | 캐릭터 대화 세션 생성 | `POST /api/character-chat/conversations` | `movieId`, `characterId` | `conversationId`, `initialMessage` | 필요 | 현재는 캐릭터 greeting으로 로컬 생성 |
| `/character-chat` | 캐릭터 메시지 전송 | 메시지 입력/추천 질문 클릭 | 캐릭터 응답 생성 | `POST /api/character-chat/conversations/{conversationId}/messages` | `conversationId`, `message` | `messageId`, `reply`, `createdAt` | 필요 | 현재 `generateCharacterReply` mock |
| `/character-chat` | 배우 기반 추천 | 배우 추천 버튼 클릭 | 채팅 화면 이동 | API 없음 | 없음 | 없음 | 불필요 | 실제 추천 응답은 `/chat` API가 처리 |

`CharacterMovie` 필드: `id`, `title`, `genres`, `posterUrl`, `description`, `actors`, `characters`.

`Character` 필드: `id`, `name`, `description`, `greeting`, `suggestedQuestions`, `avatarColor`.

### `/mypage` 마이페이지

| 화면 | 기능/영역 | 사용자 액션 | 필요한 API | Method/Path 초안 | 요청값 | 응답 필드 | 인증 | 비고 |
|---|---|---|---|---|---|---|---|---|
| `/mypage` | 프로필 헤더 | 화면 진입 | 내 프로필 조회 | `GET /api/me` | 없음 | `authenticated`, `user` | 필요 | `user` 안의 `likedMovieCount`, `reviewCount` 사용. `user=null`이면 로그인 화면으로 이동 |
| `/mypage` | 찜한 영화 탭 | 탭 진입 | 내 찜 영화 목록 조회 | `GET /api/me/liked-movies` | `page`, `size` | `movies: { id, title, year, posterUrl }[]`, `totalCount` | 필요 | 현재 `likedMovies` 하드코딩 |
| `/mypage` | 내 리뷰 탭 | 탭 진입 | 내가 작성한 리뷰 목록 조회 | `GET /api/me/reviews` | `page`, `size` | `reviews: MyReview[]`, `totalCount` | 필요 | 현재 `myReviews` 하드코딩 |
| `/mypage` | 프로필 수정 | 프로필 수정 클릭 | 프로필 수정 화면 또는 API | `PATCH /api/me` | `name`, `profileImageUrl?` | `id`, `name`, `profileImageUrl` | 필요 | 현재 버튼만 있음. 수정 화면은 미구현 |
| `/mypage` | 설정 | 설정 클릭 | API 보류 | API 없음 | 없음 | 없음 | 필요 | DB에 설정 테이블/컬럼이 없으므로 현재 범위에서 제외 |

`MyReview` 필드: `id`, `movieId`, `movieTitle`, `posterUrl`, `rating`, `content`, `date`, `likes`.

### `/login` 로그인

| 화면 | 기능/영역 | 사용자 액션 | 필요한 API | Method/Path 초안 | 요청값 | 응답 필드 | 인증 | 비고 |
|---|---|---|---|---|---|---|---|---|
| `/login` | Google 로그인 | Google로 계속하기 클릭 | Supabase Google OAuth 시작 | API 없음 | `provider=google`, `redirectTo?` | Supabase OAuth redirect | 불필요 | 백엔드 REST API가 아니라 Supabase `signInWithOAuth` 사용 |
| `/login` | Kakao 로그인 | 카카오로 계속하기 클릭 | Supabase Kakao OAuth 시작 | API 없음 | `provider=kakao`, `redirectTo?` | Supabase OAuth redirect | 불필요 | 백엔드 REST API가 아니라 Supabase `signInWithOAuth` 사용 |

### `/onboarding` 선호 영화 선택

| 화면 | 기능/영역 | 사용자 액션 | 필요한 API | Method/Path 초안 | 요청값 | 응답 필드 | 인증 | 비고 |
|---|---|---|---|---|---|---|---|---|
| `/onboarding` | 인기 영화 선택지 | 화면 진입 | 온보딩 인기 영화 후보 조회 | `GET /api/movies` | `sort=popular`, `limit` | `movies: MovieCard[]` | 필요 | 온보딩 후보는 MovieLens 매핑이 있는 인기 영화로 한정한다. 검색은 제공하지 않는다 |
| `/onboarding` | 선호 영화 저장 | 영화 5개 선택 후 시작하기 클릭 | 내 선호 영화 저장 | `PUT /api/me/preferences/movies` | `movieIds: number[]` | `movieIds`, `onboardingCompleted` | 필요 | 정확히 5개를 선택해야 저장 가능. 저장 후 `profiles.onboarding_completed = true` |

## 통합 API 후보 목록

화면별 요구사항을 중복 제거하면 백엔드가 우선 제공해야 할 API는 다음과 같다.

### 인증/사용자

| Method | Path | 목적 | 인증 |
|---|---|---|---|
| `GET` | `/api/me` | 현재 로그인 상태 및 내 정보 조회 | 선택 |
| `PATCH` | `/api/me` | 프로필 수정 | 필요 |

### 영화/장르

| Method | Path | 목적 | 인증 |
|---|---|---|---|
| `GET` | `/api/movies` | 영화 목록, 검색, 정렬 | 선택 |
| `GET` | `/api/movies/{movieId}` | 영화 상세 조회 | 선택 |
| `GET` | `/api/movies/{movieId}/similar` | 유사 영화 조회 | 선택 |
| `GET` | `/api/genres` | 장르 목록 조회 | 불필요 |

### 온보딩/선호 영화

| Method | Path | 목적 | 인증 |
|---|---|---|---|
| `GET` | `/api/me/preferences/movies` | 내 온보딩 선호 영화 조회 | 필요 |
| `PUT` | `/api/me/preferences/movies` | 온보딩 선호 영화 5개 저장 | 필요 |

### 찜/리뷰

| Method | Path | 목적 | 인증 |
|---|---|---|---|
| `GET` | `/api/me/liked-movies` | 내 찜 영화 목록 | 필요 |
| `PUT` | `/api/me/liked-movies/{movieId}` | 영화 찜 추가 | 필요 |
| `DELETE` | `/api/me/liked-movies/{movieId}` | 영화 찜 삭제 | 필요 |
| `GET` | `/api/movies/{movieId}/reviews` | 영화 리뷰 목록 | 선택 |
| `POST` | `/api/movies/{movieId}/reviews` | 리뷰 작성 | 필요 |
| `GET` | `/api/me/reviews` | 내가 작성한 리뷰 목록 | 필요 |
| `PUT` | `/api/reviews/{reviewId}/like` | 리뷰 좋아요 추가 | 필요 |
| `DELETE` | `/api/reviews/{reviewId}/like` | 리뷰 좋아요 삭제 | 필요 |

### 추천/채팅

| Method | Path | 목적 | 인증 |
|---|---|---|---|
| `GET` | `/api/me/recommendations/item-cf` | 온보딩 영화 기반 Item CF 추천 섹션 조회 | 필요 |
| `GET` | `/api/chat/suggested-questions` | 추천 질문 목록 조회 | 불필요 |
| `POST` | `/api/chat/recommendations` | AI 영화 추천 대화 | 필요 |
| `GET` | `/api/me/chat-conversations` | 내 추천 대화 목록 | 필요 |
| `POST` | `/api/me/chat-conversations` | 새 추천 대화 생성 | 필요 |
| `GET` | `/api/me/chat-conversations/{conversationId}` | 추천 대화 상세 조회 | 필요 |

### 캐릭터 대화

| Method | Path | 목적 | 인증 |
|---|---|---|---|
| `GET` | `/api/character-chat/movies` | 캐릭터 대화 가능 영화 목록 | 필요 |
| `GET` | `/api/movies/{movieId}/characters` | 영화별 캐릭터 목록 | 필요 |
| `POST` | `/api/character-chat/conversations` | 캐릭터 대화 세션 생성 | 필요 |
| `POST` | `/api/character-chat/conversations/{conversationId}/messages` | 캐릭터 메시지 전송 | 필요 |

## 우선순위 제안

| 우선순위 | API 묶음 | 이유 |
|---|---|---|
| 1 | `GET /api/movies`, `GET /api/movies/{movieId}`, `GET /api/genres` | 홈, 검색, 상세 화면의 기본 데이터 기반 |
| 2 | 리뷰 조회/작성, 찜 추가/삭제 | 사용자 상호작용이 있는 핵심 기능 |
| 3 | 로그인, `GET /api/me`, 마이페이지 | 개인화와 사용자 데이터의 전제 |
| 4 | `PUT /api/me/preferences/movies`, `/api/me/recommendations/item-cf`, `/api/chat/recommendations` | 온보딩 기반 개인화와 서비스 차별화 기능 |
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
