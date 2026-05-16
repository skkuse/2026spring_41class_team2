# 영화 카탈로그

## movies

TMDB 기반 영화 카탈로그. `id`는 TMDB movie id다.

| 컬럼                   | 타입        | 제약                    | 설명                          |
| ---------------------- | ----------- | ----------------------- | ----------------------------- |
| `id`                   | bigint      | PK                      | TMDB movie id                 |
| `movielens_id`         | bigint      | unique, not null        | MovieLens movieId             |
| `title`                | text        | not null                | TMDB 요청 언어 기준 표시 제목 |
| `original_title`       | text        | nullable                | 영화 원제                     |
| `overview`             | text        | nullable                | 줄거리                        |
| `release_date`         | date        | nullable                | 개봉일                        |
| `release_year`         | int         | nullable                | 개봉 연도                     |
| `runtime`              | int         | nullable                | 러닝타임                      |
| `original_language`    | text        | nullable                | 영화 원래 언어 코드           |
| `production_countries` | jsonb       | not null, default '[]'  | 제작 국가 코드 목록           |
| `poster_path`          | text        | nullable                | TMDB poster path              |
| `backdrop_path`        | text        | nullable                | TMDB backdrop path            |
| `trailer_url`          | text        | nullable                | 예고편 URL                    |
| `adult`                | boolean     | not null, default false | 성인 콘텐츠 여부              |
| `created_at`           | timestamptz | not null, default now() | 생성 시각                     |
| `updated_at`           | timestamptz | not null, default now() | 수정 시각                     |

예시:

| 영화                   | `title`                | `original_title` | `original_language` | `production_countries` |
| ---------------------- | ---------------------- | ---------------- | ------------------- | ---------------------- |
| 기생충                 | 기생충                 | 기생충           | `ko`                | `KR`                   |
| 센과 치히로의 행방불명 | 센과 치히로의 행방불명 | 千と千尋の神隠し | `ja`                | `JP`                   |
| The Matrix             | 매트릭스               | The Matrix       | `en`                | `US`                   |
| 설국열차               | 설국열차               | Snowpiercer      | `en`                | `KR`, `CZ`             |

주요 컬럼 설명:

- `title`은 TMDB API 요청 언어 기준의 표시 제목이다. 화면의 기본 영화명으로 사용한다.
- `original_title`은 영화의 원래 제목이다. `title`과 다를 때 원제 표시나 검색 보조에 사용한다.
- `original_language`는 영화의 원래 언어 코드다. 예: `en`, `ko`, `ja`.
- `production_countries`는 영화 제작 국가 코드 목록이다. 언어가 아니라 제작 국가를 의미하며, 공동 제작 영화는 여러 국가가 들어갈 수 있다.

식별자:

- `movies.id`에는 TMDB movie id를 저장한다.
- IMDB ID는 저장하지 않는다.

적재 정책:

- TMDB 평점은 사용하지 않는다.
- 영화 데이터는 최초 적재 후 고정한다.
- `production_countries`에는 TMDB 영화 상세 응답의 `production_countries[].iso_3166_1` 값만 배열로 저장한다. 예: `["KR", "US"]`.

이미지 필드:

- `poster_path`는 완성 URL이 아니라 TMDB 이미지 path만 저장한다. 예: `/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg`.
- 화면에 이미지를 표시할 때는 TMDB 이미지 base URL과 크기 값을 앞에 붙여 완성 URL로 만든다. 예: `https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg`.
- `backdrop_path`는 영화 상세 화면이나 추천 카드 배경에 쓰는 가로형 대표 이미지 path다. 포스터처럼 세로형 표지가 아니라, 영화 장면이나 홍보용 스틸컷에 가까운 이미지다.
- `backdrop_path`도 `poster_path`와 동일하게 TMDB 이미지 path만 저장하고, 화면 표시 시 base URL과 조합한다.

RLS:

- 모든 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

## genres

TMDB 장르 기준의 장르 테이블.

| 컬럼      | 타입   | 제약     | 설명             |
| --------- | ------ | -------- | ---------------- |
| `id`      | bigint | PK       | TMDB genre id    |
| `name`    | text   | not null | 장르 이름        |
| `name_ko` | text   | nullable | 한국어 장르 이름 |

제약/메모:

- MovieLens 장르는 서비스 장르 기준으로 사용하지 않는다.
- 화면과 검색의 장르 표시는 TMDB 장르 기준으로 통일한다.
- `name_ko`는 TMDB `ko-KR` 장르명을 우선 사용하고, 없으면 `name`을 사용한다.

RLS:

- 모든 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.

## movie_genres

영화와 장르의 다대다 연결 테이블.

| 컬럼       | 타입   | 제약                | 설명                   |
| ---------- | ------ | ------------------- | ---------------------- |
| `movie_id` | bigint | PK, FK `movies(id)` | 영화 ID, TMDB movie id |
| `genre_id` | bigint | PK, FK `genres(id)` | TMDB 장르 ID           |

RLS:

- 모든 사용자가 읽을 수 있다.
- 일반 사용자는 직접 생성/수정/삭제할 수 없다.
