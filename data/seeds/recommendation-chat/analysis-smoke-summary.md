# Recommendation Chat Analysis Smoke Summary

Generated: 2026-05-21T06:27:11.304Z
Model: gpt-4.1-mini
Embedding model: text-embedding-3-small
Result: 28 / 30 passed

| # | Result | Message | Intent | Genres | User Tags | Excluded |
|---:|---|---|---|---|---|---|
| 1 | PASS | 잔잔하고 여운 남는 일본 로맨스 영화 추천해줘 | new_recommendation | Romance | 잔잔한, 여운 남는 | - |
| 2 | PASS | 좀비가 등장하는 숨 막히는 공포 영화 추천해줘 | new_recommendation | Horror | 좀비, 숨 막히는 | - |
| 3 | PASS | 어두운 범죄 스릴러 중에 분위기 묵직한 거 추천해줘 | new_recommendation | Crime, Thriller | 어두운, 묵직한 분위기 | - |
| 4 | PASS | 우주 배경의 SF 모험 영화 찾아줘 | new_recommendation | Adventure, Science Fiction | 우주 배경 | - |
| 5 | PASS | 가볍고 웃긴 코미디 영화 추천해줘 | new_recommendation | Comedy | 가볍고, 웃긴 | - |
| 6 | FAIL | 눈물 나는 감동적인 드라마 보고 싶어 | new_recommendation | Drama | 감동적인 | - |
| 7 | PASS | 빠른 전개에 액션 많은 영화 추천해줘 | new_recommendation | - | 빠른 전개, 액션 많은 | - |
| 8 | PASS | 기괴하고 초현실적인 분위기의 영화 추천해줘 | new_recommendation | - | 기괴한, 초현실적인 | - |
| 9 | PASS | 따뜻하고 힐링되는 가족 영화 보고 싶어 | new_recommendation | Drama | 따뜻한, 힐링되는 | 가족 |
| 10 | PASS | 잔혹하고 피 튀기는 공포 영화 추천해줘 | new_recommendation | Horror | 잔혹한, 피 튀기는 | - |
| 11 | PASS | 비극적이고 암울한 결말의 영화 찾아줘 | new_recommendation | - | 비극적, 암울한 결말 | - |
| 12 | PASS | 두뇌 싸움이 있는 반전 스릴러 추천해줘 | new_recommendation | Thriller | 두뇌 싸움, 반전 | - |
| 13 | PASS | 복수극 느낌 나는 거친 액션 영화 추천해줘 | new_recommendation | Thriller | 복수극, 거친 | - |
| 14 | PASS | 성장 서사가 있는 청춘 드라마 추천해줘 | new_recommendation | Drama | 성장 서사, 청춘 | - |
| 15 | PASS | 몽환적이고 아름다운 영상미 있는 영화 추천해줘 | new_recommendation | - | 몽환적, 아름다운 영상미 | - |
| 16 | PASS | 친구랑 보기 좋은 좀비 영화 추천해줘 | new_recommendation | Horror | 좀비 | 친구랑 |
| 17 | PASS | 저녁에 볼 잔잔한 영화 추천해줘 | new_recommendation | - | 잔잔한 | 저녁에 |
| 18 | PASS | OTT에서 볼만한 우주 배경 영화 추천해줘 | new_recommendation | Science Fiction | 우주 배경 | OTT에서 |
| 19 | PASS | 심심할 때 볼 가볍고 웃긴 코미디 추천해줘 | new_recommendation | Comedy | 가볍고 웃긴 | 심심할 때 |
| 20 | PASS | 주말에 가족이랑 볼 따뜻한 애니메이션 추천해줘 | new_recommendation | Animation | 따뜻한 | 주말에, 가족이랑 |
| 21 | PASS | 혼자 심야에 보기 좋은 오싹한 공포 영화 추천해줘 | new_recommendation | Horror | 오싹한 | 혼자, 심야 |
| 22 | PASS | 밥 먹으면서 볼 편안한 로맨스 영화 추천해줘 | new_recommendation | Romance | 편안한 | 밥 먹으면서 |
| 23 | PASS | 넷플릭스에 있을 법한 어두운 범죄 영화 추천해줘 | new_recommendation | Crime | 어두운 | 넷플릭스 |
| 24 | PASS | 데이트할 때 볼 달달한 로맨스 영화 추천해줘 | new_recommendation | Romance | 달달한 | 데이트할 때 |
| 25 | FAIL | 출근길에 짧게 볼 수 있는 빠른 전개의 영화 추천해줘 | unsupported | - | - | 출근길 |
| 26 | PASS | 재밌는 영화 하나만 골라줘 | unsupported | - | - | - |
| 27 | PASS | 친구들이랑 같이 볼 영화 추천해줘 | unsupported | - | - | 친구들이랑, 같이 |
| 28 | PASS | 심심할 때 볼 거 추천해줘 | unsupported | - | - | 심심할 때 |
| 29 | PASS | OTT에서 볼 거 추천해줘 | unsupported | - | - | OTT |
| 30 | PASS | 내 스타일 영화 추천해줘 | unsupported | - | - | - |

## 1. PASS - 잔잔하고 여운 남는 일본 로맨스 영화 추천해줘

- intent: `new_recommendation`
- genres: `Romance`
- countryCodes: `["JP"]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 잔잔한 | 잔잔한, 차분한, 평화로운, 조용한, 부드러운, 잔잔하게, 잔잔함 |
| 여운 남는 | 여운 남는, 감동적인, 기억에 남는, 마음에 남는, 잔상 있는, 감성적인, 오래가는 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 잔잔한 | 잔잔한 차분한 평화로운 조용한 부드러운 잔잔하게 잔잔함 | 1. light (603) `0.536` · 2. feel-good (388) `0.532` · 3. understated (1055) `0.509` |
| 여운 남는 | 여운 남는 감동적인 기억에 남는 마음에 남는 잔상 있는 감성적인 오래가는 | 1. sentimental (900) `0.593` · 2. touching (1035) `0.562` · 3. sad but good (872) `0.545` |

## 2. PASS - 좀비가 등장하는 숨 막히는 공포 영화 추천해줘

- intent: `new_recommendation`
- genres: `Horror`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 좀비 | 좀비, 언데드, 감염자, 시체, 좀비떼, 좀비아포칼립스, 좀비바이러스 |
| 숨 막히는 | 숨 막히는, 긴장감 있는, 몰입감 있는, 짜릿한, 긴박한, 스릴 넘치는, 압도적인 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 좀비 | 좀비 언데드 감염자 시체 좀비떼 좀비아포칼립스 좀비바이러스 | 1. zombie (1127) `0.564` · 2. zombies (1128) `0.526` · 3. virus (1088) `0.429` |
| 숨 막히는 | 숨 막히는 긴장감 있는 몰입감 있는 짜릿한 긴박한 스릴 넘치는 압도적인 | 1. intense (553) `0.556` · 2. frightening (413) `0.503` · 3. tense (1020) `0.497` |

## 3. PASS - 어두운 범죄 스릴러 중에 분위기 묵직한 거 추천해줘

- intent: `new_recommendation`
- genres: `Crime, Thriller`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 어두운 | 어두운, 침침한, 암울한, 우울한, 음침한, 그늘진, 어둑한 |
| 묵직한 분위기 | 묵직한 분위기, 무거운 분위기, 진중한 분위기, 중후한 분위기, 엄숙한 분위기, 진지한 분위기, 무게감 있는 분위기 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 어두운 | 어두운 침침한 암울한 우울한 음침한 그늘진 어둑한 | 1. dark (285) `0.531` · 2. bleak (143) `0.475` · 3. downbeat (319) `0.464` |
| 묵직한 분위기 | 묵직한 분위기 무거운 분위기 진중한 분위기 중후한 분위기 엄숙한 분위기 진지한 분위기 무게감 있는 분위기 | 1. understated (1055) `0.525` · 2. atmospheric (86) `0.518` · 3. feel-good (388) `0.506` |

## 4. PASS - 우주 배경의 SF 모험 영화 찾아줘

- intent: `new_recommendation`
- genres: `Adventure, Science Fiction`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 우주 배경 | 우주 배경, 우주 공간, 우주 여행, 우주 탐험, 우주선, 우주 정거장, 우주 미션 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 우주 배경 | 우주 배경 우주 공간 우주 여행 우주 탐험 우주선 우주 정거장 우주 미션 | 1. space travel (945) `0.518` · 2. australia (87) `0.469` · 3. space program (944) `0.446` |

## 5. PASS - 가볍고 웃긴 코미디 영화 추천해줘

- intent: `new_recommendation`
- genres: `Comedy`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 가볍고 | 가볍고, 경쾌한, 밝은, 산뜻한, 편안한, 유쾌한, 가벼운 |
| 웃긴 | 웃긴, 유머러스한, 코믹한, 재미있는, 익살스러운, 즐거운, 개그 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 가볍고 | 가볍고 경쾌한 밝은 산뜻한 편안한 유쾌한 가벼운 | 1. light (603) `0.572` · 2. sad but good (872) `0.476` · 3. good (445) `0.436` |
| 웃긴 | 웃긴 유머러스한 코믹한 재미있는 익살스러운 즐거운 개그 | 1. humorous (529) `0.595` · 2. gross-out (476) `0.591` · 3. funny (417) `0.571` |

## 6. FAIL - 눈물 나는 감동적인 드라마 보고 싶어

- intent: `new_recommendation`
- genres: `Drama`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

Failures:

- missing expected userTag containing "눈물"

User tags:

| userTag | embeddingTerms |
|---|---|
| 감동적인 | 감동적인, 감격적인, 가슴뭉클한, 눈물나는, 감성적인, 따뜻한, 진심어린 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 감동적인 | 감동적인 감격적인 가슴뭉클한 눈물나는 감성적인 따뜻한 진심어린 | 1. touching (1035) `0.677` · 2. sentimental (900) `0.636` · 3. emotional (348) `0.627` |

## 7. PASS - 빠른 전개에 액션 많은 영화 추천해줘

- intent: `new_recommendation`
- genres: `-`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 빠른 전개 | 빠른 전개, 빠르게 진행, 속도감, 전개 속도, 빠른 흐름, 빠른 스토리, 빠른 진행 |
| 액션 많은 | 액션 많은, 액션 풍부, 액션 가득, 액션 위주, 액션 중심, 액션 활발, 액션 다수 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 빠른 전개 | 빠른 전개 빠르게 진행 속도감 전개 속도 빠른 흐름 빠른 스토리 빠른 진행 | 1. fast paced (382) `0.517` · 2. slow paced (930) `0.486` · 3. nonlinear (715) `0.435` |
| 액션 많은 | 액션 많은 액션 풍부 액션 가득 액션 위주 액션 중심 액션 활발 액션 다수 | 1. realistic action (841) `0.457` · 2. guns (482) `0.440` · 3. action packed (20) `0.438` |

## 8. PASS - 기괴하고 초현실적인 분위기의 영화 추천해줘

- intent: `new_recommendation`
- genres: `-`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 기괴한 | 기괴한, 이상한, 괴상한, 기이한, 기묘한, 기이한분위기, 초자연적 |
| 초현실적인 | 초현실적인, 비현실적인, 환상적인, 몽환적인, 비현실감, 꿈같은, 비현실적분위기 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 기괴한 | 기괴한 이상한 괴상한 기이한 기묘한 기이한분위기 초자연적 | 1. weird (1104) `0.470` · 2. strange (974) `0.465` · 3. quirky (829) `0.462` |
| 초현실적인 | 초현실적인 비현실적인 환상적인 몽환적인 비현실감 꿈같은 비현실적분위기 | 1. dreamlike (325) `0.700` · 2. surreal (995) `0.677` · 3. hallucinatory (487) `0.625` |

## 9. PASS - 따뜻하고 힐링되는 가족 영화 보고 싶어

- intent: `new_recommendation`
- genres: `Drama`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `["가족"]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 따뜻한 | 따뜻한, 포근한, 온화한, 감동적인, 정감있는, 편안한, 따스한 |
| 힐링되는 | 힐링되는, 치유하는, 마음이편안한, 회복되는, 위로가되는, 평화로운, 안정적인 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 따뜻한 | 따뜻한 포근한 온화한 감동적인 정감있는 편안한 따스한 | 1. emotional (348) `0.583` · 2. touching (1035) `0.561` · 3. passionate (771) `0.537` |
| 힐링되는 | 힐링되는 치유하는 마음이편안한 회복되는 위로가되는 평화로운 안정적인 | 1. feel-good (388) `0.560` · 2. reflective (845) `0.496` · 3. emotional (348) `0.468` |

## 10. PASS - 잔혹하고 피 튀기는 공포 영화 추천해줘

- intent: `new_recommendation`
- genres: `Horror`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 잔혹한 | 잔혹한, 잔인한, 피비린내 나는, 무자비한, 잔인무도한, 잔혹성, 피 튀기는 |
| 피 튀기는 | 피 튀기는, 피비린내 나는, 잔혹한, 잔인한, 피 흘리는, 피가 나는, 피범벅 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 잔혹한 | 잔혹한 잔인한 피비린내 나는 무자비한 잔인무도한 잔혹성 피 튀기는 | 1. sad but good (872) `0.389` · 2. dumb (332) `0.379` · 3. bloody (146) `0.379` |
| 피 튀기는 | 피 튀기는 피비린내 나는 잔혹한 잔인한 피 흘리는 피가 나는 피범벅 | 1. gory (458) `0.399` · 2. bloody (146) `0.385` · 3. sad but good (872) `0.364` |

## 11. PASS - 비극적이고 암울한 결말의 영화 찾아줘

- intent: `new_recommendation`
- genres: `-`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 비극적 | 비극적, 비극, 비참한, 절망적인, 슬픈, 비운의, 비애 |
| 암울한 결말 | 암울한 결말, 어두운 결말, 비관적인 결말, 절망적인 결말, 슬픈 결말, 비극적 결말, 불행한 결말 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 비극적 | 비극적 비극 비참한 절망적인 슬픈 비운의 비애 | 1. tragedy (1037) `0.563` · 2. heartbreaking (496) `0.533` · 3. melancholic (640) `0.519` |
| 암울한 결말 | 암울한 결말 어두운 결말 비관적인 결말 절망적인 결말 슬픈 결말 비극적 결말 불행한 결말 | 1. bad ending (99) `0.599` · 2. tragedy (1037) `0.569` · 3. bleak (143) `0.559` |

## 12. PASS - 두뇌 싸움이 있는 반전 스릴러 추천해줘

- intent: `new_recommendation`
- genres: `Thriller`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 두뇌 싸움 | 두뇌 싸움, 지능 대결, 심리전, 전략 싸움, 두뇌 게임, 심리 싸움, 두뇌 경쟁 |
| 반전 | 반전, 예상 밖, 반전 스토리, 반전 결말, 깜짝 전개, 예상 뒤집기, 반전 요소 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 두뇌 싸움 | 두뇌 싸움 지능 대결 심리전 전략 싸움 두뇌 게임 심리 싸움 두뇌 경쟁 | 1. chess (199) `0.621` · 2. intelligent (551) `0.584` · 3. fighting (390) `0.516` |
| 반전 | 반전 예상 밖 반전 스토리 반전 결말 깜짝 전개 예상 뒤집기 반전 요소 | 1. better than expected (129) `0.515` · 2. twist ending (1050) `0.493` · 3. tricky (1045) `0.492` |

## 13. PASS - 복수극 느낌 나는 거친 액션 영화 추천해줘

- intent: `new_recommendation`
- genres: `Thriller`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 복수극 | 복수극, 복수, 원한, 복수심, 복수 이야기, 복수 드라마, 복수 플롯 |
| 거친 | 거친, 거칠고, 거친 분위기, 거친 감성, 거친 스타일, 거친 액션, 거친 전개 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 복수극 | 복수극 복수 원한 복수심 복수 이야기 복수 드라마 복수 플롯 | 1. multiple storylines (679) `0.534` · 2. true story (1047) `0.475` · 3. script (895) `0.471` |
| 거친 | 거친 거칠고 거친 분위기 거친 감성 거친 스타일 거친 액션 거친 전개 | 1. sexy (911) `0.515` · 2. moody (666) `0.504` · 3. unique (1059) `0.459` |

## 14. PASS - 성장 서사가 있는 청춘 드라마 추천해줘

- intent: `new_recommendation`
- genres: `Drama`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 성장 서사 | 성장 서사, 성장 이야기, 성장 과정, 성장 드라마, 성장 테마, 성장 플롯, 성장 요소 |
| 청춘 | 청춘, 젊음, 청년, 청소년, 청춘 이야기, 청춘 드라마, 청춘 테마 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 성장 서사 | 성장 서사 성장 이야기 성장 과정 성장 드라마 성장 테마 성장 플롯 성장 요소 | 1. biographical (133) `0.527` · 2. drama (323) `0.470` · 3. women (1116) `0.462` |
| 청춘 | 청춘 젊음 청년 청소년 청춘 이야기 청춘 드라마 청춘 테마 | 1. high school (503) `0.517` · 2. skinhead (924) `0.433` · 3. coming-of-age (236) `0.431` |

## 15. PASS - 몽환적이고 아름다운 영상미 있는 영화 추천해줘

- intent: `new_recommendation`
- genres: `-`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 몽환적 | 몽환적, 환상적인, 꿈같은, 신비로운, 초현실적인, 환상미, 환상풍 |
| 아름다운 영상미 | 아름다운 영상미, 화려한 영상미, 예쁜 영상미, 감각적인 영상미, 미려한 영상미, 빛나는 영상미, 화사한 영상미 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 몽환적 | 몽환적 환상적인 꿈같은 신비로운 초현실적인 환상미 환상풍 | 1. dreamlike (325) `0.652` · 2. surreal (995) `0.623` · 3. weird (1104) `0.523` |
| 아름다운 영상미 | 아름다운 영상미 화려한 영상미 예쁜 영상미 감각적인 영상미 미려한 영상미 빛나는 영상미 화사한 영상미 | 1. beautifully filmed (122) `0.610` · 2. amazing photography (55) `0.593` · 3. amazing cinematography (54) `0.521` |

## 16. PASS - 친구랑 보기 좋은 좀비 영화 추천해줘

- intent: `new_recommendation`
- genres: `Horror`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `["친구랑"]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 좀비 | 좀비, 언데드, 감염자, 좀비떼, 좀비아포칼립스, 좀비생존, 좀비공포 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 좀비 | 좀비 언데드 감염자 좀비떼 좀비아포칼립스 좀비생존 좀비공포 | 1. zombie (1127) `0.598` · 2. zombies (1128) `0.576` · 3. survival (998) `0.441` |

## 17. PASS - 저녁에 볼 잔잔한 영화 추천해줘

- intent: `new_recommendation`
- genres: `-`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `["저녁에"]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 잔잔한 | 잔잔한, 평화로운, 조용한, 차분한, 부드러운, 편안한, 온화한 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 잔잔한 | 잔잔한 평화로운 조용한 차분한 부드러운 편안한 온화한 | 1. feel-good (388) `0.545` · 2. understated (1055) `0.538` · 3. light (603) `0.524` |

## 18. PASS - OTT에서 볼만한 우주 배경 영화 추천해줘

- intent: `new_recommendation`
- genres: `Science Fiction`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `["OTT에서"]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 우주 배경 | 우주 배경, 우주 공간, 우주 여행, 우주선, 우주 탐험, 우주 과학, 우주 환경 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 우주 배경 | 우주 배경 우주 공간 우주 여행 우주선 우주 탐험 우주 과학 우주 환경 | 1. space travel (945) `0.527` · 2. space (942) `0.505` · 3. space program (944) `0.496` |

## 19. PASS - 심심할 때 볼 가볍고 웃긴 코미디 추천해줘

- intent: `new_recommendation`
- genres: `Comedy`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `["심심할 때"]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 가볍고 웃긴 | 가볍고 웃긴, 유머러스한, 경쾌한, 코믹한, 즐거운, 명랑한, 재미있는 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 가볍고 웃긴 | 가볍고 웃긴 유머러스한 경쾌한 코믹한 즐거운 명랑한 재미있는 | 1. humorous (529) `0.650` · 2. fun (414) `0.611` · 3. comic (231) `0.554` |

## 20. PASS - 주말에 가족이랑 볼 따뜻한 애니메이션 추천해줘

- intent: `new_recommendation`
- genres: `Animation`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `["주말에","가족이랑"]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 따뜻한 | 따뜻한, 훈훈한, 감동적인, 포근한, 온화한, 정감있는, 따스한 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 따뜻한 | 따뜻한 훈훈한 감동적인 포근한 온화한 정감있는 따스한 | 1. heartwarming (497) `0.590` · 2. affectionate (30) `0.581` · 3. touching (1035) `0.537` |

## 21. PASS - 혼자 심야에 보기 좋은 오싹한 공포 영화 추천해줘

- intent: `new_recommendation`
- genres: `Horror`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `["혼자","심야"]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 오싹한 | 오싹한, 무서운, 소름끼치는, 섬뜩한, 긴장감 있는, 공포스러운, 으스스한 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 오싹한 | 오싹한 무서운 소름끼치는 섬뜩한 긴장감 있는 공포스러운 으스스한 | 1. scary (882) `0.604` · 2. frightening (413) `0.602` · 3. eerie (344) `0.569` |

## 22. PASS - 밥 먹으면서 볼 편안한 로맨스 영화 추천해줘

- intent: `new_recommendation`
- genres: `Romance`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `["밥 먹으면서"]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 편안한 | 편안한, 부드러운, 안락한, 평화로운, 차분한, 포근한, 편안함 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 편안한 | 편안한 부드러운 안락한 평화로운 차분한 포근한 편안함 | 1. light (603) `0.589` · 2. feel-good (388) `0.578` · 3. understated (1055) `0.552` |

## 23. PASS - 넷플릭스에 있을 법한 어두운 범죄 영화 추천해줘

- intent: `new_recommendation`
- genres: `Crime`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `["넷플릭스"]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 어두운 | 어두운, 침울한, 암울한, 우울한, 음침한, 어둑한, 그늘진 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 어두운 | 어두운 침울한 암울한 우울한 음침한 어둑한 그늘진 | 1. dark (285) `0.507` · 2. downbeat (319) `0.500` · 3. bleak (143) `0.466` |

## 24. PASS - 데이트할 때 볼 달달한 로맨스 영화 추천해줘

- intent: `new_recommendation`
- genres: `Romance`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `["데이트할 때"]`

User tags:

| userTag | embeddingTerms |
|---|---|
| 달달한 | 달달한, 달콤한, 사랑스러운, 로맨틱한, 감미로운, 포근한, 따뜻한 |

Vector matches:

| userTag | embeddingInput | top matches |
|---|---|---|
| 달달한 | 달달한 달콤한 사랑스러운 로맨틱한 감미로운 포근한 따뜻한 | 1. romantic (864) `0.631` · 2. sweet (1003) `0.579` · 3. girlie movie (439) `0.517` |

## 25. FAIL - 출근길에 짧게 볼 수 있는 빠른 전개의 영화 추천해줘

- intent: `unsupported`
- genres: `-`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `["출근길"]`

Failures:

- intent expected=new_recommendation actual=unsupported
- missing expected userTag containing "빠른 전개"

User tags: -


## 26. PASS - 재밌는 영화 하나만 골라줘

- intent: `unsupported`
- genres: `-`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

User tags: -


## 27. PASS - 친구들이랑 같이 볼 영화 추천해줘

- intent: `unsupported`
- genres: `-`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `["친구들이랑","같이"]`

User tags: -


## 28. PASS - 심심할 때 볼 거 추천해줘

- intent: `unsupported`
- genres: `-`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `["심심할 때"]`

User tags: -


## 29. PASS - OTT에서 볼 거 추천해줘

- intent: `unsupported`
- genres: `-`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `["OTT"]`

User tags: -


## 30. PASS - 내 스타일 영화 추천해줘

- intent: `unsupported`
- genres: `-`
- countryCodes: `[]`
- languageCodes: `[]`
- yearRange: `null`
- runtimeRange: `null`
- excludedTerms: `[]`

User tags: -

