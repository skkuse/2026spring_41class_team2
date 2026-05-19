import type { RequestContext } from "@/server/auth/auth-types"
import type { GenreDto } from "@/server/movies/movie-types"

// HTTP DTO
export type RecommendationSourceDto = "item_cf" | "fallback"

export type RecommendedMovieDto = {
  id: number
  title: string
  year: number | null
  rating: number
  genres: GenreDto[]
  posterUrl: string | null
  reason: string
  source: RecommendationSourceDto
  score: number | null
  coRatingCount: number | null
  isBookmarked: boolean
}

export type RecommendationSeedMovieDto = {
  id: number
  title: string
  year: number | null
  posterUrl: string | null
}

export type RecommendationSectionDto = {
  seedMovie: RecommendationSeedMovieDto
  title: string
  movies: RecommendedMovieDto[]
}

export type ItemCfRecommendationsResponseDto = {
  sections: RecommendationSectionDto[]
}

// Service input
export type GetItemCfRecommendationsInput = {
  seedLimit?: number
  limitPerSeed?: number
}

// Domain
export type RecommendationSource = RecommendationSourceDto

export type RecommendationCandidate = RecommendationMovieRepoResult & {
  source: RecommendationSource
  score: number | null
  coRatingCount: number | null
}

// Repository params
export type ListRecommendationSeedMoviesRepoParams = {
  userId: string
  limit: number
}

export type ListItemCfCandidatesRepoParams = {
  sourceMovieId: number
  limit: number
}

export type ListFallbackCandidatesRepoParams = {
  excludedMovieIds: number[]
  limit: number
}

export type FindExcludedMovieIdsRepoParams = {
  userId: string
}

// Repository results
export type RecommendationRatingStatsRepoResult = {
  movielensAvgRating: string | number
  movielensRatingCount: number
  cinemateRatingSum: string | number
  cinemateReviewCount: number
}

export type RecommendationMovieRepoResult = RecommendationRatingStatsRepoResult & {
  id: number
  title: string
  releaseYear: number | null
  posterPath: string | null
  genres: GenreDto[]
  isBookmarked: boolean
}

export type RecommendationSeedMovieRepoResult = RecommendationMovieRepoResult & {
  position: number
}

export type ItemCfCandidateRepoResult = RecommendationMovieRepoResult & {
  score: number
  coRatingCount: number
}

// Repository port
export type ItemCfRecommendationRepository = {
  listSeedMovies(params: ListRecommendationSeedMoviesRepoParams): Promise<RecommendationSeedMovieRepoResult[]>
  findExcludedMovieIds(params: FindExcludedMovieIdsRepoParams): Promise<Set<number>>
  listItemCfCandidates(params: ListItemCfCandidatesRepoParams): Promise<ItemCfCandidateRepoResult[]>
  listFallbackCandidates(params: ListFallbackCandidatesRepoParams): Promise<RecommendationMovieRepoResult[]>
}

export type ItemCfRecommendationService = {
  getItemCfRecommendations(
    context: RequestContext,
    input: GetItemCfRecommendationsInput,
  ): Promise<ItemCfRecommendationsResponseDto>
}
