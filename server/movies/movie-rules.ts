import type { ListMoviesInput, MovieSort, RatingStatsRepoResult } from "./movie-types"

export const DEFAULT_MOVIE_LIST_LIMIT = 50
export const DEFAULT_MOVIE_PAGE = 1
export const DEFAULT_MOVIE_PAGE_SIZE = 20
export const MAX_MOVIE_PAGE_SIZE = 60
export const MIN_RATING_SORT_MOVIELENS_COUNT = 10000
export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

export type TmdbImageSize = "w185" | "w500" | "w780"

export function calculateMovieRating(stats: RatingStatsRepoResult) {
  const movielensAvgRating = Number(stats.movielensAvgRating)
  const cinemateRatingSum = Number(stats.cinemateRatingSum)
  const denominator = stats.movielensRatingCount + stats.cinemateReviewCount

  if (denominator <= 0) {
    return 0
  }

  return roundRating((movielensAvgRating * stats.movielensRatingCount + cinemateRatingSum) / denominator)
}

export function buildTmdbImageUrl(path: string | null, size: TmdbImageSize) {
  if (!path) {
    return null
  }

  return `${TMDB_IMAGE_BASE_URL}/${size}${path.startsWith("/") ? path : `/${path}`}`
}

export function normalizeMovieListInput(input: ListMoviesInput) {
  const q = input.q?.trim()
  const sort: MovieSort = input.sort ?? "popular"
  const page = input.page ?? DEFAULT_MOVIE_PAGE
  const size = Math.min(input.size ?? DEFAULT_MOVIE_PAGE_SIZE, MAX_MOVIE_PAGE_SIZE)

  return {
    ...(q ? { q } : {}),
    sort,
    page,
    size,
    offset: (page - 1) * size,
  }
}

export function normalizeCountries(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === "string")
}

function roundRating(value: number) {
  return Math.round(value * 100) / 100
}
