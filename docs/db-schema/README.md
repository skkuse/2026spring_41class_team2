# Cinemate DB Schema

이 폴더는 Cinemate DB schema의 기준 문서다.

구현계획 문서는 테이블 정의를 직접 중복 작성하지 않고 이 폴더의 문서를 참조한다. 구현 중 schema 변경이 필요하면 먼저 이 폴더의 문서를 갱신하고, 구현계획 문서에는 변경 이유와 흐름만 남긴다.

## 설계 기준

- 인증은 Supabase Auth를 사용한다.
- Supabase `auth.users`는 인증 사용자 원천으로 사용한다.
- 서비스 사용자 정보는 `profiles` 테이블에서 관리한다.
- 영화 상세 정보 원천은 TMDB다.
- MovieLens는 추천 학습, 랭킹, 초기 평점 집계 원천으로 사용한다.
- IMDB는 사용하지 않는다.
- 영화는 MovieLens에 `tmdbId`가 있는 항목만 적재한다.
- TMDB 전체 영화는 적재하지 않는다.
- 영화 데이터는 최초 적재 후 고정한다.
- `movies.id`는 TMDB movie id다.
- 장르는 TMDB 장르 기준으로 통일한다.
- AI 영화 추천 채팅과 캐릭터 채팅은 분리한다.
- AI 영화 추천 채팅 테이블은 `recommendation_chat_*` 이름을 사용한다.
- 캐릭터 채팅 테이블은 `character_chat_*` 이름을 사용한다.

## 문서 목록

| 문서 | 범위 |
|---|---|
| [users.md](./users.md) | `profiles`, `user_onboarding_movies` |
| [movies.md](./movies.md) | `movies`, `genres`, `movie_genres` |
| [people.md](./people.md) | `people`, `movie_casts`, `movie_crew` |
| [reviews-likes.md](./reviews-likes.md) | `movie_bookmarks`, `reviews`, `review_likes` |
| [item-cf-recommendations.md](./item-cf-recommendations.md) | 영화 통계와 Item CF 추천 테이블 |
| [recommendation-chat.md](./recommendation-chat.md) | AI 추천 채팅 저장 테이블, Tag Genome 후보 조회 테이블 |
| [character-chat.md](./character-chat.md) | 캐릭터 및 캐릭터 채팅 테이블 |
| [rls-summary.md](./rls-summary.md) | RLS 요약 |

## ERD 개요

```text
auth.users
  └─ profiles
      ├─ user_onboarding_movies
      ├─ movie_bookmarks
      ├─ reviews
      ├─ review_likes
      ├─ recommendation_chat_conversations
      └─ character_chat_conversations

movies
  ├─ movie_genres
  ├─ movie_casts
  ├─ movie_crew
  ├─ movie_bookmarks
  ├─ reviews
  ├─ movie_stats
  │   └─ movielens_item_similarities
  ├─ movie_tag_relevances
  ├─ user_onboarding_movies
  ├─ recommendation_chat_conversation_message_movies
  └─ characters

genres
  └─ movie_genres

people
  ├─ movie_casts
  ├─ movie_crew
  └─ characters

movie_tags
  └─ movie_tag_relevances

recommendation_chat_conversations
  └─ recommendation_chat_conversation_messages
      └─ recommendation_chat_conversation_message_movies

characters
  ├─ character_chat_events
  ├─ character_chat_event_participants
  ├─ character_chat_default_questions
  └─ character_chat_conversations
      └─ character_chat_conversation_messages
```
