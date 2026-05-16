# MovieLens 데이터셋 설명

이 문서는 Cinemate에서 사용하는 MovieLens 데이터셋의 주요 파일과 역할을 설명한다.

## Tag Genome

Tag Genome은 영화마다 태그 점수 벡터를 제공하는 MovieLens 데이터다.

```text
The Matrix = {
  sci-fi: 0.95
  cyberpunk: 0.91
  action: 0.72
  romance: 0.12
}
```

즉 영화가 `sci-fi`, `emotional`, `atmospheric` 같은 태그와 얼마나 잘 맞는지를 숫자로 표현한다. Cinemate는 이 점수를 사용해 사용자의 자연어 요청과 분위기, 장르, 감성이 비슷한 영화 후보를 찾는다.

Tag Genome은 이 설계에서 주로 두 파일로 사용된다.

```text
genome-tags.csv   = 태그 사전
genome-scores.csv = 영화별 태그 점수
```

## 주요 파일

| 파일 | 용량 | 역할 |
|---|---:|---|
| `genome-tags.csv` | 약 18KB | 추천에 사용할 태그 목록 |
| `genome-scores.csv` | 약 522MB | 영화별 태그 관련도 점수 |
| `links.csv` | 약 1.9MB | MovieLens 영화 ID와 TMDB 영화 ID 연결 |
| `ratings.csv` | 약 934MB | 영화별 평점 수와 평균 평점 계산 |
| `tags.csv` | 약 85MB | 영화별 사용자 태그 수 계산 |

## `genome-tags.csv`

Tag Genome에서 사용하는 태그 사전이다.

예를 들어 `sci-fi`, `cyberpunk`, `action`, `romance` 같은 태그가 있고, 각 태그에는 `tagId`가 있다. LLM이 사용자 요청을 태그 이름으로 변환하면, 서버는 이 파일을 기준으로 태그 이름을 `tagId`로 바꿔 추천 검색에 사용한다.

```csv
tagId,tag
1,sci-fi
2,cyberpunk
3,action
4,romance
```

## `genome-scores.csv`

영화별로 각 Tag Genome 태그와 얼마나 관련 있는지 나타내는 점수 데이터다.

예를 들어 The Matrix가 `sci-fi` 태그와 0.95만큼 관련 있고, `cyberpunk` 태그와 0.91만큼 관련 있다는 식의 점수를 제공한다. AI 추천 대화에서는 이 점수를 사용해 사용자 요청과 잘 맞는 영화 후보를 찾는다.

```csv
movieId,tagId,relevance
100,1,0.95
100,2,0.91
100,3,0.72
100,4,0.12
```

## `links.csv`

MovieLens의 `movieId`와 TMDB의 `tmdbId`를 연결하는 파일이다.

Cinemate의 movie id는 TMDB id를 사용한다. 따라서 MovieLens에서 찾은 추천 후보를 Cinemate의 영화 데이터와 연결하려면 `links.csv`가 필요하다.

`imdbId`도 포함되어 있지만, 이 설계에서는 사용하지 않는다.

```csv
movieId,imdbId,tmdbId
100,0133093,603
```

## `ratings.csv`

사용자 평점 데이터다.

`rating`은 사용자가 남긴 별점이다. 0.5가 최소값이고 0.5 단위로 증가하며, 5.0이 최대값이다.

```csv
userId,movieId,rating,timestamp
1,100,5.0,1225734739
2,100,4.5,1225865086
```

이 파일은 다음 용도로 사용한다.

```text
movieId별 rating_count 계산
movieId별 average_rating 계산
선택된 영화 간 Item CF 유사도 계산
```

## `tags.csv`

사용자가 영화에 직접 입력한 자유 텍스트 태그 기록이다.

`genome-tags.csv`와 이름이 비슷하지만 역할은 다르다. `genome-tags.csv`는 MovieLens가 Tag Genome용으로 정리한 공식 태그 사전이고, `tags.csv`는 MovieLens 사용자들이 실제로 남긴 자유 태그들이다.

즉 `genome-tags.csv`는 추천 검색에 쓰기 좋은 정리된 태그 목록이고, `tags.csv`는 사용자가 직접 입력한 원본 기록에 가깝다.

이 설계에서는 `tags.csv`를 추천 검색에 직접 사용하지 않는다. 추후에는 영화별 상위 사용자 태그를 정제해 LLM 추천 이유 생성에 보조 정보로 사용할 수 있다.

```csv
userId,movieId,tag,timestamp
10,100,cyberpunk,1430666558
11,100,mind bending,1430666505
```

