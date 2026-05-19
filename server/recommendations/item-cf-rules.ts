import type {
  RecommendationCandidate,
  RecommendationMovieRepoResult,
  RecommendationSeedMovieRepoResult,
} from "./item-cf-types"

export const DEFAULT_ITEM_CF_SEED_LIMIT = 3
export const MIN_ITEM_CF_SEED_LIMIT = 1
export const MAX_ITEM_CF_SEED_LIMIT = 5
export const DEFAULT_ITEM_CF_LIMIT_PER_SEED = 10
export const MIN_ITEM_CF_LIMIT_PER_SEED = 1
export const MAX_ITEM_CF_LIMIT_PER_SEED = 20
export const MAX_SIMILAR_MOVIES_PER_SOURCE = 50
export const ITEM_CF_CANDIDATE_FETCH_MULTIPLIER = 5

export type NormalizedItemCfInput = {
  seedLimit: number
  limitPerSeed: number
}

export function normalizeItemCfInput(input: { seedLimit?: number; limitPerSeed?: number }): NormalizedItemCfInput {
  return {
    seedLimit: clamp(input.seedLimit ?? DEFAULT_ITEM_CF_SEED_LIMIT, MIN_ITEM_CF_SEED_LIMIT, MAX_ITEM_CF_SEED_LIMIT),
    limitPerSeed: clamp(
      input.limitPerSeed ?? DEFAULT_ITEM_CF_LIMIT_PER_SEED,
      MIN_ITEM_CF_LIMIT_PER_SEED,
      MAX_ITEM_CF_LIMIT_PER_SEED,
    ),
  }
}

export function calculateItemCfCandidateFetchLimit(limitPerSeed: number) {
  return Math.min(MAX_SIMILAR_MOVIES_PER_SOURCE, limitPerSeed * ITEM_CF_CANDIDATE_FETCH_MULTIPLIER)
}

export function calculateFallbackCandidateFetchLimit(seedCount: number, limitPerSeed: number) {
  return Math.max(seedCount * limitPerSeed * ITEM_CF_CANDIDATE_FETCH_MULTIPLIER, limitPerSeed)
}

export function toItemCfCandidates(rows: (RecommendationMovieRepoResult & { score: number; coRatingCount: number })[]) {
  return rows.map((row) => ({
    ...row,
    source: "item_cf" as const,
    score: row.score,
    coRatingCount: row.coRatingCount,
  }))
}

export function toFallbackCandidates(rows: RecommendationMovieRepoResult[]) {
  return rows.map((row) => ({
    ...row,
    source: "fallback" as const,
    score: null,
    coRatingCount: null,
  }))
}

export function pickSectionMovies(params: {
  candidates: RecommendationCandidate[]
  limit: number
  excludedMovieIds: Set<number>
  usedMovieIds: Set<number>
}) {
  const movies: RecommendationCandidate[] = []

  for (const candidate of params.candidates) {
    if (movies.length >= params.limit) {
      break
    }

    if (params.excludedMovieIds.has(candidate.id) || params.usedMovieIds.has(candidate.id)) {
      continue
    }

    movies.push(candidate)
    params.usedMovieIds.add(candidate.id)
  }

  return movies
}

export function buildSectionTitle(seedMovie: RecommendationSeedMovieRepoResult) {
  return `${seedMovie.title}${pickObjectParticle(seedMovie.title)} 좋아한 사람들이 함께 좋아한 영화`
}

export function buildRecommendationReason(seedMovie: RecommendationSeedMovieRepoResult, source: "item_cf" | "fallback") {
  if (source === "fallback") {
    return "많은 사용자가 높게 평가한 영화"
  }

  return `${seedMovie.title}${pickObjectParticle(seedMovie.title)} 좋아한 사용자들이 함께 높게 평가한 영화`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function pickObjectParticle(text: string) {
  return hasFinalConsonant(text) ? "을" : "를"
}

function hasFinalConsonant(text: string) {
  const lastChar = [...text.trim()].at(-1)
  if (!lastChar) {
    return false
  }

  const codePoint = lastChar.codePointAt(0)
  if (codePoint === undefined || codePoint < 0xac00 || codePoint > 0xd7a3) {
    return true
  }

  return (codePoint - 0xac00) % 28 !== 0
}
