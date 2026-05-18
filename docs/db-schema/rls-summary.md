# 데이터 접근 권한 요약

| 테이블 | 읽기 | 쓰기 |
|---|---|---|
| `profiles` | 본인 | 본인 |
| `user_onboarding_movies` | 본인 | 본인 |
| `movies` | 전체 공개 | 일반 사용자 불가 |
| `genres` | 전체 공개 | 일반 사용자 불가 |
| `movie_genres` | 전체 공개 | 일반 사용자 불가 |
| `people` | 전체 공개 | 일반 사용자 불가 |
| `movie_casts` | 전체 공개 | 일반 사용자 불가 |
| `movie_crew` | 전체 공개 | 일반 사용자 불가 |
| `movie_bookmarks` | 서버에서 본인만 허용 | 서버에서 본인만 허용 |
| `reviews` | 전체 공개 | 로그인 사용자 본인 작성 |
| `review_likes` | 전체 공개 또는 집계 공개 | 로그인 사용자 본인 생성/삭제 |
| `movie_stats` | 전체 공개 | 일반 사용자 불가 |
| `movie_similarities` | 전체 공개 | 일반 사용자 불가 |
| `movie_tags` | 전체 공개 | 일반 사용자 불가 |
| `movie_tag_relevances` | 전체 공개 | 일반 사용자 불가 |
| `recommendation_chat_conversations` | 본인 | 본인 |
| `recommendation_chat_conversation_messages` | 본인 | 본인 |
| `recommendation_chat_conversation_message_movies` | 본인 | 일반 사용자 불가 |
| `characters` | 로그인 사용자 | 일반 사용자 불가 |
| `character_chat_events` | 로그인 사용자 | 일반 사용자 불가 |
| `character_chat_event_participants` | 로그인 사용자 | 일반 사용자 불가 |
| `character_chat_default_questions` | 로그인 사용자 | 일반 사용자 불가 |
| `character_chat_conversations` | 본인 | 본인 |
| `character_chat_conversation_messages` | 본인 | 본인 |
