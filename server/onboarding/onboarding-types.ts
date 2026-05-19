import type { RequestContext } from "@/server/auth/auth-types"
import type { MovieCardDto } from "@/server/movies/movie-types"

// HTTP DTO
export type PreferredMoviesResponseDto = {
  movies: MovieCardDto[]
}

export type SavePreferredMoviesResponseDto = {
  movieIds: number[]
  onboardingCompleted: true
}

// Service input
export type SavePreferredMoviesInput = {
  movieIds: number[]
}

// Domain
export type PreferredMoviePosition = {
  movieId: number
  position: number
}

// Repository params
export type FindOnboardingCandidateMoviesRepoParams = {
  movieIds: number[]
}

export type ReplacePreferredMoviesRepoParams = {
  userId: string
  movies: PreferredMoviePosition[]
  updatedAt: Date
}

// Repository results
export type OnboardingMovieRepoResult = {
  id: number
  title: string
  releaseYear: number | null
  posterPath: string | null
  movielensId: number | null
  movielensAvgRating: string | number
  movielensRatingCount: number
  cinemateRatingSum: string | number
  cinemateReviewCount: number
  isBookmarked: boolean
  genres: {
    id: number
    name: string
  }[]
}

// Repository port
export type OnboardingRepository = {
  listPreferredMovies(userId: string): Promise<OnboardingMovieRepoResult[]>
  findOnboardingCandidateMovies(params: FindOnboardingCandidateMoviesRepoParams): Promise<OnboardingMovieRepoResult[]>
  replacePreferredMovies(params: ReplacePreferredMoviesRepoParams): Promise<void>
}

export type OnboardingService = {
  listPreferredMovies(context: RequestContext): Promise<PreferredMoviesResponseDto>
  savePreferredMovies(
    context: RequestContext,
    input: SavePreferredMoviesInput,
  ): Promise<SavePreferredMoviesResponseDto>
}
