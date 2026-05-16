# 인물, 출연진, 제작진

## people

TMDB 인물 정보. 배우, 감독, 제작진을 모두 포함한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | bigint | PK | TMDB person id |
| `name` | text | not null | 표시 이름 |
| `profile_path` | text | nullable | TMDB profile path |
| `known_for_department` | text | nullable | 주요 분야 |
| `popularity` | numeric | nullable | TMDB 인물 popularity |
| `created_at` | timestamptz | not null, default now() | 생성 시각 |
| `updated_at` | timestamptz | not null, default now() | 수정 시각 |

예시:

```json
{
  "id": 31,
  "name": "Tom Hanks",
  "profile_path": "/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg",
  "known_for_department": "Acting",
  "popularity": 82.989
}
```

주요 컬럼 설명:

- `name`은 화면에 표시할 인물 이름이다.
- `profile_path`는 완성 URL이 아니라 TMDB 이미지 path다. 화면에서는 TMDB 이미지 base URL과 size를 조합해 사용한다.
- `known_for_department`는 해당 인물이 TMDB에서 주로 알려진 분야다.
- `popularity`는 TMDB 내부 기준의 인물 인기 점수다. 평점이 아니라 정렬/노출 참고용 점수로 사용한다.

`known_for_department` enum 후보:

- TMDB API 스펙에는 `known_for_department`의 enum 목록이 명시되어 있지 않다.
- TMDB 지원 답변 기준으로는 `/configuration/jobs`의 department 목록을 기반으로 보되, `Actors` department는 person 응답에서 `Acting`으로 들어온다.
- 추후 enum 전환 시 후보 값은 `Acting`, `Production`, `Costume & Make-Up`, `Lighting`, `Crew`, `Directing`, `Writing`, `Editing`, `Sound`, `Visual Effects`, `Camera`, `Art`로 둔다.

RLS:

- 모든 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

## movie_casts

영화 출연진 정보. TMDB credits 응답의 `cast`에 해당한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `movie_id` | bigint | PK, FK `movies(id)` | 영화 ID |
| `person_id` | bigint | PK, FK `people(id)` | 배우 ID |
| `character_name` | text | PK | 배역명 |
| `cast_order` | int | nullable | 출연 순서 |

제약/메모:

- 같은 배우가 한 영화에서 여러 배역을 맡을 수 있으므로 `character_name`을 PK에 포함한다.
- 화면 표시 기본값은 `cast_order` 오름차순 상위 출연진이다.

RLS:

- 모든 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

## movie_crew

영화 제작진 정보. TMDB credits 응답의 `crew`에 해당한다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `movie_id` | bigint | PK, FK `movies(id)` | 영화 ID |
| `person_id` | bigint | PK, FK `people(id)` | 인물 ID |
| `department` | text | PK | 부서 |
| `job` | text | PK | 역할 |

제약/메모:

- 감독은 `job = 'Director'`로 조회한다.
- 출연진과 제작진은 분리해서 관리한다.

RLS:

- 모든 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.
