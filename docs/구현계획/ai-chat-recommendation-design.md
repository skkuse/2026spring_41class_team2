# AI 추천 대화 구현 설계

이 문서는 `/chat` AI 영화 추천 대화를 구현하는 방식을 정리한다.

## 목표

사용자가 자연어로 영화 취향이나 상황을 입력하면, Cinemate DB에 있는 영화 중 조건에 맞는 영화를 추천한다.

예:

```text
비 오는 날 보기 좋은 잔잔한 영화 추천해줘
우울하지만 마지막에는 희망적인 SF 영화 보고 싶어
가족이랑 볼 수 있는데 너무 유치하지 않은 영화 추천해줘
```

LLM이 바로 영화 제목을 지어내게 하지 않고, MovieLens Tag 점수를 Cinemate DB에 미리 적재해 둔 뒤 실제 DB에 있는 영화 후보를 찾고, LLM이 추천 이유를 설명한다.

## 전체 흐름

```d2
shape: sequence_diagram

user: 사용자
backend: "Cinemate Backend"
llm: LLM
db: "Cinemate DB"

user -> backend: "자연어 추천 요청"
backend -> db: "사용자 메시지 저장"
backend -> llm: "자연어에서 MovieLens Tag 추출 요청"
llm -> backend: "Tag 조건 JSON 반환"
backend -> db: "Tag 점수 기반 후보 영화 조회"
db -> backend: "추천 후보 영화 목록 반환"
backend -> backend: "평점, 평점 수, 제외 영화 기준으로 최종 추천 영화 결정 (후보 최종 선별)"
backend -> llm: "추천 영화들과 Tag 전달"
llm -> backend: "추천 이유를 포함한 답변 JSON 반환"
backend -> db: "추천 답변과 추천 영화 저장"
backend -> user: "추천 결과 + 영화 카드 반환"
```

### AI 추천 대화용 MovieLens 테이블 전처리

이 전처리를 하기 전에 먼저 MovieLens Subset이 생성되어 있어야 한다. [MovieLens Subset 관련 문서](./movielens-subset-db-plan.md) 참고.
이 문서에서 추출한 3,000개 영화를 기준으로 `movielens_tags`, `movie_stats`, `movielens_tag_scores` 세 테이블을 Cinemate DB에 seed로 생성한다.

### `movielens_tags`

```sql
CREATE TABLE movielens_tags (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
```

`id`는 MovieLens 원본 `tagId`를 그대로 사용한다. 이 테이블은 `genome-tags.csv`에서 필요한 Tag 사전을 저장한다.

### `movielens_tag_scores`

```sql
CREATE TABLE movielens_tag_scores (
  tmdb_id INTEGER NOT NULL REFERENCES movie_stats(tmdb_id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES movielens_tags(id) ON DELETE CASCADE,
  score REAL NOT NULL,
  PRIMARY KEY (tmdb_id, tag_id)
);
```

이 테이블은 `genome-scores.csv`에서 선택된 3,000개 영화의 score 상위 50개 Tag만 저장한다. 원본 `genome-scores.csv`의 `movieId`는 전처리 단계에서 `links.csv`를 통해 `tmdb_id`로 변환한다.

### `movie_stats`

```sql
CREATE TABLE movie_stats (
  tmdb_id INTEGER PRIMARY KEY,
  movie_lens_id INTEGER NOT NULL UNIQUE,
  rating_count INTEGER NOT NULL,
  average_rating REAL NOT NULL,
  user_tag_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`tmdb_id`는 Cinemate movie id와 동일하므로 primary key로 사용한다. `movie_lens_id`는 원본 MovieLens CSV와의 추적용 키이고, 추천 결과와 서비스 API에서는 `tmdb_id`를 기준으로 사용한다.

이 테이블은 MovieLens 기준 초기값을 seed로 채운 뒤, 서비스에서 리뷰와 반응이 쌓일 때마다 `rating_count`, `average_rating`, `user_tag_count`를 갱신하는 운영용 집계 테이블이다. 

`movie_lens_id`와 `tmdb_id`는 MovieLens의 `links.csv`를 이용해 채우고, `rating_count`와 `average_rating`은 `ratings.csv`를 집계해서 넣으며, `user_tag_count`는 `tags.csv`를 집계해서 넣는다. 

추천 후보 조회 시 빠르게 필터링할 수 있도록 영화별 품질 지표를 저장한다.

### 인덱스

```sql
CREATE INDEX idx_movielens_tag_scores_tag_score
ON movielens_tag_scores (tag_id, score DESC);

CREATE INDEX idx_movie_stats_rating
ON movie_stats (rating_count DESC, average_rating DESC);
```

AI 추천 대화는 `tag_id`에서 관련 영화 후보를 찾는 방식이므로 `tag_id, score` 인덱스를 둔다. `idx_movie_stats_rating`은 fallback이나 평점 기반 후보 조회에 사용할 수 있다.

### 생성할 중간 파일

```text
movielens_tags_subset.csv
movie_stats_subset.csv
movielens_tag_scores_subset.csv
```


### 전처리 구현 순서

1. `ratings.csv`, `tags.csv`, `links.csv`, `genome-tags.csv`, `genome-scores.csv`를 읽는다.
2. `ratings.csv`에서 `movieId`별 `rating_count`, `average_rating`을 계산한다.
3. `tags.csv`에서 `movieId`별 `user_tag_count`를 계산한다.
4. `links.csv`로 `movieId -> tmdb_id` 매핑을 만든다.
5. `genome-tags.csv`를 기준으로 `movielens_tags` 사전을 만든다.
6. `movielens-subset-db-plan.md` 기준으로 최종 3,000개 영화를 확정한다.
7. 확정된 3,000개 영화만 `movie_stats`에 적재한다.
8. `genome-scores.csv`에서 확정 영화만 추려 `movielens_tag_scores`를 만든다.
9. 영화당 score 상위 50개 Tag만 남긴다.
10. `movielens_*` seed CSV를 생성한다.
11. seed CSV를 Cinemate DB에 적재한다.
12. 인덱스를 생성하고 row 수, 중복 `tmdb_id`, 누락 값, 기본 조회 성능을 검증한다.


## 1. 자연어에서 MovieLens Tag 추출

사용자 메시지를 바로 영화 추천으로 보내지 않고, 먼저 MovieLens Tag 조건으로 변환한다.

LLM은 `movielens_tags` 전체 사전을 보고, 사용자 문맥에 맞는 MovieLens Tag를 직접 고른다.
백엔드는 LLM이 반환한 Tag가 실제 `movielens_tags`에 존재하는지만 검증하고, 필요하면 소문자화나 공백 정리 같은 최소 정규화만 수행한다.

권장 방식은 다음과 같다.

1. `movielens_tags` 전체 사전은 백엔드가 메모리나 캐시에 고정 보관한다.
2. 요청 메시지와 대화 요약, 그리고 전체 Tag 사전을 함께 LLM에 전달한다.
3. LLM은 전체 Tag 목록 중에서 문맥에 맞는 MovieLens Tag를 직접 선택한다.
4. 백엔드는 LLM 출력이 실제 Tag 사전에 존재하는지 검증하고, 존재하지 않으면 제거하거나 fallback 로직으로 넘긴다.

즉, Tag 후보를 백엔드가 먼저 좁히지 않고, LLM이 전체 Tag 목록을 보고 직접 고르게 한다. 이 방식은 후보 누락 위험이 적고, Tag 의미 해석을 LLM에 맡길 수 있다는 점이 장점이다.

권장 포맷은 JSON only다. 텍스트 설명은 최소화하고, 백엔드가 파싱 가능한 구조만 받는다.

입력 예시:

```json
{
  "message": "비 오는 날 보기 좋은 잔잔한 영화 추천해줘",
  "conversationSummary": "이전 대화 없음",
  "count": 5,
  "excludeMovieIds": [1, 3, 5],
  "availableTags": ["atmospheric", "emotional", "quiet", "hopeful", "violent", "gloomy"]
}
```

출력 예시:

```json
{
  "positiveTags": [
    { "tag": "atmospheric", "weight": 3 },
    { "tag": "emotional", "weight": 2 },
    { "tag": "quiet", "weight": 2 }
  ],
  "negativeTags": [
    { "tag": "violent", "weight": 2 }
  ],
  "needsClarification": false,
  "clarificationQuestion": null,
  "confidence": 0.88
}
```

#### 입출력 필드

입력 필드:

| 필드 | 설명 |
| --- | --- |
| `message` | 사용자가 방금 입력한 자연어 요청이다. |
| `conversationSummary` | 이전 대화 맥락을 짧게 요약한 값이다. 없으면 `이전 대화 없음` 같은 기본값을 넣는다. |
| `count` | 최종 추천 개수다. Tag 해석 단계에서도 답변 길이와 후보 폭을 맞추는 힌트로 쓴다. |
| `excludeMovieIds` | 이미 보여줬거나 제외해야 하는 영화 ID 목록이다. |
| `availableTags` | LLM이 직접 선택할 수 있는 전체 MovieLens Tag 목록이다. `movielens_tags`의 `name` 목록을 전달한다. |

출력 필드:

| 필드 | 설명 |
| --- | --- |
| `positiveTags` | 사용자의 선호를 나타내는 Tag와 가중치 목록이다. |
| `negativeTags` | 피해야 할 분위기나 요소를 나타내는 Tag와 가중치 목록이다. |
| `needsClarification` | 요청이 너무 모호해서 추가 질문이 필요한지 여부다. |
| `clarificationQuestion` | 추가 질문이 필요할 때 사용자에게 보낼 질문이다. |
| `confidence` | Tag 변환 결과에 대한 LLM의 확신도다. |

백엔드는 LLM이 반환한 Tag가 `movielens_tags`에 실제로 존재하는지만 확인하고, 필요하면 소문자화나 공백 정리 정도의 최소 정규화만 한다. Tag 의미 해석과 선택은 LLM이 담당한다.

### Fallback

LLM이 요청을 Tag 조건으로 충분히 바꾸지 못하면 fallback을 쓴다. 예를 들면 `아무거나 추천해줘`, `요즘 볼만한 거`, `기분이 이상해` 같은 요청이다.

다음 경우 fallback으로 전환한다.

- `positiveTags`가 비었거나 너무 적다
- Tag 기반 검색 결과가 최종 `count`를 채우지 못한다
- 요청 자체가 너무 모호해서 Tag를 신뢰하기 어렵다

Fallback은 `movie_stats`에서 `rating_count`, `average_rating`, `user_tag_count`가 높은 영화 중심으로 후보를 만든다. 이때도 `excludeMovieIds`, liked/reviewed 여부, 최종 `count`는 동일하게 적용한다.




## 2. 후보 검색

후보 검색은 Tag 점수 집계로 1차 후보를 넓게 뽑는 단계다. 백엔드는 이 결과에 대해 `excludeMovieIds`, `liked_movies`, `reviews`를 추가로 제외하고 `후보 최종 선별`을 수행한다.

#### 후보 검색 입출력 필드

입력 필드:

| 필드 | 설명 |
| --- | --- |
| `positiveTags` | `[{ "tag": string, "weight": number }]` 형태의 선호 Tag 목록이다. |
| `negativeTags` | `[{ "tag": string, "weight": number }]` 형태의 제외 Tag 목록이다. |
| `candidateLimit` | DB에서 넉넉하게 가져올 후보 수다. |
| `excludeMovieIds` | SQL 이후 서버 후처리에서 제외할 영화 ID 목록이다. |

출력 필드:

| 필드 | 설명 |
| --- | --- |
| `tmdb_id` | Cinemate 영화 ID다. |
| `tag_match_score` | Tag 조건만으로 계산한 후보 점수다. |
| `rating_count` | 평점 개수다. |
| `average_rating` | 평균 평점이다. |
| `user_tag_count` | 사용자 Tag 수다. |
| `poster_path` | 화면에 보여줄 포스터 경로다. |
| `overview` | 화면과 LLM 답변 생성에 쓸 줄거리다. |
| `final_score` | Tag 점수와 품질 보정값을 합친 정렬 점수다. |

### 후보 검색 SQL 예시

LLM이 다음 Tag 조건을 반환한다고 가정한다.

```json
{
  "positiveTags": [
    { "tag": "atmospheric", "weight": 3 },
    { "tag": "emotional", "weight": 2 },
    { "tag": "sci-fi", "weight": 1 }
  ],
  "negativeTags": [
    { "tag": "violent", "weight": 2 }
  ]
}
```

`candidateLimit`는 최종 `count`를 기준으로 서버에서 계산한다.

```text
candidateLimit = clamp(count * 30, 50, 200)
```

후보 검색 SQL:

```sql
WITH positive_tag_weights(tag_name, weight) AS (
  VALUES
    ('atmospheric', 3),
    ('emotional', 2),
    ('sci-fi', 1)
),
negative_tag_weights(tag_name, weight) AS (
  VALUES
    ('violent', 2)
),
candidate_scores AS (
  SELECT
    s.tmdb_id,
    SUM(
      CASE
        WHEN pt.tag_name IS NOT NULL THEN s.score * pt.weight
        WHEN nt.tag_name IS NOT NULL THEN -s.score * nt.weight * 0.7
        ELSE 0
      END
    ) AS tag_match_score,
    MAX(m.rating_count) AS rating_count,
    MAX(m.average_rating) AS average_rating,
    MAX(m.user_tag_count) AS user_tag_count,
    MAX(movie.poster_path) AS poster_path,
    MAX(movie.overview) AS overview
  FROM movielens_tag_scores s
  JOIN movielens_tags t ON t.id = s.tag_id
  LEFT JOIN positive_tag_weights pt ON pt.tag_name = t.name
  LEFT JOIN negative_tag_weights nt ON nt.tag_name = t.name
  JOIN movie_stats m ON m.tmdb_id = s.tmdb_id
  JOIN movies movie ON movie.id = s.tmdb_id
  WHERE movie.poster_path IS NOT NULL
    AND movie.overview IS NOT NULL
  GROUP BY s.tmdb_id
)
SELECT
  tmdb_id,
  tag_match_score,
  rating_count,
  average_rating,
  user_tag_count,
  poster_path,
  overview,
  tag_match_score
    + ln(rating_count + 1) * 0.05
    + average_rating * 0.1
    + ln(user_tag_count + 1) * 0.03 AS final_score
FROM candidate_scores
WHERE tag_match_score > 0
ORDER BY final_score DESC
LIMIT :candidate_limit;
```

`positiveTags.weight`와 `negativeTags.weight`는 LLM이 Tag 중요도를 표현한 값이고, SQL에서는 이를 `movielens_tag_scores.score`에 곱해 반영한다. `0.7`은 부정 Tag 감점 강도의 튜닝 계수다.

### 후보 최종 선별

후보 검색에서 얻은 `final_score` 상위 후보를 기준으로, 사용자 제외 조건과 노출 중복을 반영해 최종 추천 목록을 확정한다.

- 평점이 높은 영화 가산
- 평점 수가 너무 적은 영화 감점
- `excludeMovieIds`에 포함된 영화 제외
- 결과가 부족하면 평점 높은 영화로 보충

## 3. LLM이 추천 이유를 포함한 답변 생성

백엔드가 고른 후보 영화 목록만 보고 답변을 만들어야 한다.
이 단계의 목적은 LLM이 영화를 다시 고르거나 새로 만들어내지 않게 해서, 백엔드가 확정한 후보와 추천 이유가 정확히 일치하도록 하는 데 있다.
즉, LLM은 이미 확정된 후보를 사용자에게 자연스럽게 설명하는 역할을 맡는다.


입력 예시:

```json
{
  "message": "비 오는 날 보기 좋은 잔잔한 영화 추천해줘",
  "selectedMovies": [
    {
      "id": 38,
      "title": "Eternal Sunshine of the Spotless Mind",
      "year": 2004,
      "genre": "Drama",
      "rating": 4.2,
      "overview": "A couple undergoes a procedure to erase memories of each other.",
      "tagSummary": ["atmospheric", "emotional", "quiet"]
    }
  ],
  "style": {
    "language": "ko",
    "tone": "friendly",
    "maxMovies": 5
  }
}
```

출력 예시:

```json
{
  "answer": "비 오는 날에는 이런 분위기의 영화가 잘 맞아요. 조용하고 감정선이 선명한 작품 위주로 골라봤어요.",
  "movies": [
    {
      "id": 38,
      "reason": "감정의 결이 섬세하고 분위기가 잔잔해서 요청과 잘 맞아요."
    }
  ],
  "needsClarification": false,
  "clarificationQuestion": null
}
```

`needsClarification=true`면 여기서도 추천 답변을 만들지 않고 `clarificationQuestion`만 반환한다. 이 경우에는 후보 영화 목록을 그대로 노출하지 말고, 사용자 후속 답변을 받은 뒤 같은 대화 흐름에서 다시 답변을 생성한다.

#### 추천 이유를 포함한 답변 생성 입출력 필드

입력 필드:

| 필드 | 설명 |
| --- | --- |
| `message` | 사용자의 원문 요청이다. |
| `selectedMovies` | 백엔드가 최종 선별한 영화 목록이다. LLM은 이 목록 밖의 영화를 새로 만들면 안 된다. |
| `selectedMovies[].id` | 영화 ID다. |
| `selectedMovies[].title` | 영화 제목이다. |
| `selectedMovies[].year` | 개봉 연도다. |
| `selectedMovies[].genre` | 대표 장르다. |
| `selectedMovies[].rating` | 노출용 평점이다. |
| `selectedMovies[].overview` | 답변 근거를 만들 때 참고할 줄거리다. |
| `selectedMovies[].tagSummary` | 후보를 뽑은 핵심 Tag 요약이다. |
| `style.language` | 답변 언어다. |
| `style.tone` | 답변 톤이다. |
| `style.maxMovies` | 최종 설명에 포함할 최대 영화 수다. |

출력 필드:

| 필드                      | 설명                     |
| ----------------------- | ---------------------- |
| `answer`                | 사용자에게 보여줄 자연어 추천 답변이다. |
| `movies`                | 영화별 추천 사유 목록이다.        |
| `movies[].id`           | 영화 ID다.                |
| `movies[].reason`       | 해당 영화를 추천한 이유다.        |
| `needsClarification`    | 추천 전에 추가 질문이 필요한지 여부다. |
| `clarificationQuestion` | 추가 질문이 필요할 때 보낼 문장이다.  |

백엔드는 이 결과를 받아 DB의 영화 메타데이터와 합쳐서 최종 응답을 만든다.



## API 설계

기존 화면 요구사항의 API를 유지한다.

```http
POST /api/chat/recommendations
```

요청:

```json
{
  "message": "비 오는 날 보기 좋은 잔잔한 영화 추천해줘",
  "conversationId": "optional-conversation-id"
}
```

응답:

```json
{
  "conversationId": "conversation-id",
  "messageId": "recommendation-message-id",
  "answer": "비 오는 날에는 이런 분위기의 영화가 잘 맞아요.",
  "movies": [
    {
      "id": 38,
      "title": "Eternal Sunshine of the Spotless Mind",
      "year": "2004",
      "genre": "Drama",
      "rating": 4.2,
      "reason": "감성적이고 여운이 남는 분위기가 요청과 잘 맞아요.",
      "posterUrl": "...",
      "isLiked": false
    }
  ]
}
```

#### API 입출력 필드

요청 필드:

| 필드 | 설명 |
| --- | --- |
| `message` | 사용자가 입력한 추천 요청이다. |
| `conversationId` | 기존 대화가 있으면 이어서 쓰는 ID다. 없으면 새 대화를 시작한다. |

응답 필드:

| 필드 | 설명 |
| --- | --- |
| `conversationId` | 저장된 추천 대화 ID다. |
| `messageId` | 이번 추천 응답 메시지의 ID다. |
| `answer` | 화면 상단에 보여줄 추천 문장이다. |
| `movies` | 영화 카드 목록이다. |
| `movies[].id` | 영화 ID다. |
| `movies[].title` | 영화 제목이다. |
| `movies[].year` | 개봉 연도다. |
| `movies[].genre` | 화면에 보여줄 대표 장르다. |
| `movies[].rating` | 화면에 보여줄 평점이다. |
| `movies[].reason` | 카드 아래에 보여줄 추천 사유다. |
| `movies[].posterUrl` | 영화 포스터 URL이다. |
| `movies[].isLiked` | 현재 사용자가 찜한 영화인지 여부다. |

## AI 추천 대화 기록 저장

AI 추천 대화 기록은 추천 요청, 추천 응답, 그리고 응답에 포함된 영화 목록을 분리해서 저장한다.
새 대화로 시작하면 `recommendation_chat_conversations`를 먼저 생성하고, 이후 들어오는 request/response 메시지를 그 대화에 연결한다. 여기서 `request`는 사용자가 보내는 메시지이고, `response`는 AI가 돌려주는 메시지다.


### 추천 채팅 테이블 필드

#### 1. `recommendation_chat_conversations`
- 대화 세션의 소유자, 제목, 생성/수정 시각을 저장한다.
- 대화 요약이나 마지막 메시지 시각이 필요하면 추후 컬럼을 추가한다.

| 필드 | 설명 |
| --- | --- |
| `id` | 대화 ID다. |
| `user_id` | 대화를 소유한 사용자 ID다. |
| `title` | 대화 제목이다. |
| `created_at` | 생성 시각이다. |
| `updated_at` | 수정 시각이다. |

#### 2. `recommendation_chat_messages`
- `request`/`response` 각각의 메시지 본문과 역할, 생성 시각을 저장한다.
- LLM 원본 응답 JSON을 같이 저장해도 된다.

| 필드                | 설명                             |
| ----------------- | ------------------------------ |
| `id`              | 메시지 ID다.                       |
| `conversation_id` | 연결된 대화 ID다.                    |
| `role`            | `request` 또는 `response` 역할이다. |
| `content`         | 메시지 본문이다.                      |
| `created_at`      | 생성 시각이다.                       |

#### 3. `recommendation_chat_message_movies`
- 추천 응답 메시지에 연결된 영화 카드 목록을 저장한다.
- `message_id`는 `role=response`인 추천 응답 메시지만 가리킨다.
- `rank`와 `reason`으로 추천 순서와 추천 사유를 보존한다.

| 필드 | 설명 |
| --- | --- |
| `message_id` | 연결된 추천 응답 메시지 ID다. |
| `movie_id` | 추천된 영화 ID다. |
| `rank` | 추천 순위다. |
| `reason` | 저장 시점의 추천 사유다. |

### 추천 품질 검증

추천 요청에서 최종 추천 `count`를 채울 수 있어야 한다.

검증 기준:

```text
DB에 없는 영화가 추천되지 않는다.
poster와 overview가 없는 영화가 추천되지 않는다.
excludeMovieIds에 포함된 영화가 추천되지 않는다.
최종 추천 개수는 count를 따른다.
count가 없으면 5개를 추천한다.
count가 10보다 크면 10개로 제한한다.
Tag 기반 검색이 부족하면 fallback으로 count를 채운다.
```
