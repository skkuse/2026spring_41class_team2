import { calculateMovieRating } from "@/server/movies/movie-rules"
import type {
  RecommendationChatCandidate,
  RecommendationChatMappedTag,
  RecommendationChatSelectedMovie,
  RecommendationChatTagMappingRepoResult,
} from "./recommendation-chat-types"

export const MAX_USER_TAGS = 3
export const USER_TAG_MAPPING_LIMIT = 3
export const MIN_USER_TAG_MAPPING_SIMILARITY = 0.45
export const FINAL_RECOMMENDATION_LIMIT = 5

export function buildUnsupportedRecommendationChatAnswer() {
  return "저는 영화 추천을 위한 질문에만 답변할 수 있어요. 장르, 국가, 언어, 개봉 시기, 러닝타임, 분위기나 소재를 담아 다시 물어봐 주세요."
}

export function buildNoRecommendationChatCandidatesAnswer() {
  return "조건에 맞는 영화를 찾지 못했어요. 조건을 조금 바꾸거나 더 넓게 표현해서 다시 요청해 주세요."
}

export function buildRecommendationChatAnswer() {
  return "요청하신 조건에 맞는 영화를 골라봤어요."
}

export function calculateUserTagScore(params: {
  mappedTags: { tagId: number; relevance: number }[]
  movieTagRelevances: Map<number, number>
}) {
  const denominator = params.mappedTags.reduce((sum, tag) => sum + tag.relevance, 0)

  if (denominator <= 0) {
    return 0
  }

  const numerator = params.mappedTags.reduce(
    (sum, tag) => sum + tag.relevance * (params.movieTagRelevances.get(tag.tagId) ?? 0),
    0,
  )

  return numerator / denominator
}

export function calculateFinalTagScore(userTagScores: number[]) {
  if (userTagScores.length === 0) {
    return 0
  }

  const average = userTagScores.reduce((sum, score) => sum + score, 0) / userTagScores.length
  const minimum = Math.min(...userTagScores)
  return 0.7 * average + 0.3 * minimum
}

export function selectMappedTags(params: {
  userTags: string[]
  mappingResults: RecommendationChatTagMappingRepoResult[][]
}) {
  const result: RecommendationChatMappedTag[] = []
  const userTags = params.userTags.slice(0, MAX_USER_TAGS)

  for (const [index, userTag] of userTags.entries()) {
    const rows = params.mappingResults[index] ?? []
    if ((rows[0]?.relevance ?? 0) < MIN_USER_TAG_MAPPING_SIMILARITY) {
      continue
    }

    for (const row of rows.slice(0, USER_TAG_MAPPING_LIMIT)) {
      result.push({ userTag, tagId: row.tagId, relevance: row.relevance })
    }
  }

  return result
}

export function selectRecommendationMovies(params: {
  candidates: RecommendationChatCandidate[]
  mappedTagsByUserTag?: Map<string, RecommendationChatMappedTag[]>
  limit?: number
}): RecommendationChatSelectedMovie[] {
  const limit = params.limit ?? FINAL_RECOMMENDATION_LIMIT

  if (!params.mappedTagsByUserTag || params.mappedTagsByUserTag.size === 0) {
    return [...params.candidates]
      .sort((a, b) => {
        const ratingDiff = calculateMovieRating(b) - calculateMovieRating(a)
        if (ratingDiff !== 0) {
          return ratingDiff
        }
        const countDiff = b.movielensRatingCount - a.movielensRatingCount
        return countDiff === 0 ? a.id - b.id : countDiff
      })
      .slice(0, limit)
      .map((movie) => ({ ...movie, matchedUserTags: [] }))
  }

  return params.candidates
    .map((movie) => {
      const scores = [...params.mappedTagsByUserTag!.values()].map((mappedTags) =>
        calculateUserTagScore({ mappedTags, movieTagRelevances: movie.tagRelevances }),
      )
      return {
        movie,
        finalTagScore: calculateFinalTagScore(scores),
        matchedUserTags: [...params.mappedTagsByUserTag!.keys()].filter((userTag, index) => scores[index] > 0),
      }
    })
    .sort((a, b) => {
      const scoreDiff = b.finalTagScore - a.finalTagScore
      return scoreDiff === 0 ? a.movie.id - b.movie.id : scoreDiff
    })
    .slice(0, limit)
    .map(({ movie, matchedUserTags }) => ({ ...movie, matchedUserTags }))
}
