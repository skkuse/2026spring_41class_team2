# 사용자 및 온보딩

## profiles

서비스 사용자 프로필. Supabase `auth.users`와 1:1로 연결한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK, FK `auth.users(id)` | 사용자 ID |
| `name` | text | not null | 표시 이름 |
| `email` | text | not null | 이메일 |
| `profile_image_url` | text | nullable | 프로필 이미지 URL |
| `onboarding_completed` | boolean | not null, default false | 온보딩 완료 여부 |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |
| `updated_at` | timestamptz | not null, default now() | 수정 시각 |

제약/메모:

- `profiles.id`는 `auth.users.id`를 참조한다.
- 온보딩은 로그인 사용자만 가능하다.
- 온보딩 완료 후에는 온보딩 화면으로 다시 이동하지 않는다.

권한:

- 클라이언트에서 직접 접근하지 않고 서버 API를 통해서만 조회/수정한다.
- 본인 프로필 여부는 route/service 레이어에서 검사한다.
- 서버 접근에 필요한 `service_role` 권한을 사용한다.

## user_onboarding_movies

온보딩에서 사용자가 선택한 선호 영화를 저장한다. 이 데이터는 `/recommend` 화면의 Item CF 추천 seed로 사용한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `user_id` | uuid | PK, FK `profiles(id)` | 사용자 ID |
| `movie_id` | bigint | PK, FK `movies(id)` | 온보딩에서 선택한 영화 ID |
| `position` | int | not null | 사용자가 선택한 순서. 1~5 |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |

제약/메모:

- 온보딩은 인기 영화 목록에서 선호 영화 5개를 정확히 선택해야 완료된다.
- 온보딩 후보 영화는 MovieLens 매핑이 있는 영화로 한정한다.
- `unique (user_id, movie_id)`를 둔다.
- `unique (user_id, position)`을 둔다.
- 사용자당 정확히 5개 저장 규칙은 API 레벨에서 검증한다.
- `position`은 1~5 범위로 제한한다.
- `/recommend`는 `position ASC` 기준 상위 3개를 기본 seed로 사용한다.

권한:

- 클라이언트에서 직접 접근하지 않고 서버 API를 통해서만 조회/수정한다.
- 본인 온보딩 선호 영화 여부는 route/service 레이어에서 검사한다.
- 기능 migration에는 anon/authenticated grant와 RLS policy를 추가하지 않는다.
- 서버 접근에 필요한 `service_role` 권한을 사용한다.
