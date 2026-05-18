import type { RequestContext } from "@/server/auth/auth-types"
import type { MovieCardDto } from "@/server/movies/movie-types"

// HTTP DTO
export type BookmarkMutationResponseDto = {
  movieId: number
  isBookmarked: boolean
}

export type BookmarkedMoviesResponseDto = {
  movies: MovieCardDto[]
  totalCount: number
}

// Service input
export type BookmarkMovieInput = {
  movieId: number
}

export type GetBookmarkedMoviesInput = {
  page?: number
  size?: number
}

// Repository params
export type BookmarkMovieRepoParams = {
  userId: string
  movieId: number
}

export type ListBookmarkedMoviesRepoParams = {
  userId: string
  limit: number
  offset: number
}

// Repository results
export type BookmarkedMovieRepoResult = {
  id: number
  title: string
  releaseYear: number | null
  posterPath: string | null
  movielensAvgRating: string | number
  movielensRatingCount: number
  cinemateRatingSum: string | number
  cinemateReviewCount: number
  genres: {
    id: number
    name: string
  }[]
}

export type BookmarkedMovieListRepoResult = {
  movies: BookmarkedMovieRepoResult[]
  totalCount: number
}

// Repository port
export type BookmarkRepository = {
  movieExists(movieId: number): Promise<boolean>
  addBookmark(params: BookmarkMovieRepoParams): Promise<void>
  removeBookmark(params: BookmarkMovieRepoParams): Promise<void>
  listBookmarkedMovies(params: ListBookmarkedMoviesRepoParams): Promise<BookmarkedMovieListRepoResult>
}

export type BookmarkService = {
  addBookmark(context: RequestContext, input: BookmarkMovieInput): Promise<BookmarkMutationResponseDto>
  removeBookmark(context: RequestContext, input: BookmarkMovieInput): Promise<BookmarkMutationResponseDto>
  getBookmarkedMovies(context: RequestContext, input: GetBookmarkedMoviesInput): Promise<BookmarkedMoviesResponseDto>
}
