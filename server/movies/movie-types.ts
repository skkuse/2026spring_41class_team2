import type { RequestContext } from "@/server/auth/auth-types"

// HTTP DTO
export type GenreDto = {
  id: number
  name: string
}

export type MovieCardDto = {
  id: number
  title: string
  year: number | null
  rating: number
  genres: GenreDto[]
  posterUrl: string | null
  isBookmarked: boolean
}

export type MovieListResponseDto = {
  movies: MovieCardDto[]
  page: number
  size: number
  totalCount: number
}

export type MovieCastMemberDto = {
  id: number
  name: string
  characterName: string | null
  profileUrl: string | null
}

export type MovieDetailDto = {
  id: number
  title: string
  originalTitle: string | null
  year: number | null
  rating: number
  genres: GenreDto[]
  runtime: number | null
  originalLanguage: string | null
  countries: string[]
  director: string | null
  cast: MovieCastMemberDto[]
  synopsis: string | null
  posterUrl: string | null
  backdropUrl: string | null
  trailerUrl: string | null
  isBookmarked: boolean
  reviewCount: number
}

export type MovieDetailResponseDto = {
  movie: MovieDetailDto
}

export type GenreListResponseDto = {
  genres: GenreDto[]
}

// Service input
export type MovieSort = "popular" | "rating"

export type ListMoviesInput = {
  q?: string
  sort?: MovieSort
  page?: number
  size?: number
  genreId?: number
}

// Repository params
export type ListMoviesRepoParams = {
  q?: string
  sort: MovieSort
  limit: number
  offset: number
  minMovielensRatingCount?: number
  genreId?: number
}

export type MovieListRepoResult = {
  movies: MovieListItemRepoResult[]
  totalCount: number
}

export type FindBookmarkedMovieIdsRepoParams = {
  userId: string
  movieIds: number[]
}

export type IsMovieBookmarkedRepoParams = {
  userId: string
  movieId: number
}

// Repository results
export type RatingStatsRepoResult = {
  movielensAvgRating: string | number
  movielensRatingCount: number
  cinemateRatingSum: string | number
  cinemateReviewCount: number
}

export type MovieListItemRepoResult = RatingStatsRepoResult & {
  id: number
  title: string
  releaseYear: number | null
  posterPath: string | null
  genres: GenreDto[]
}

export type MovieDetailRepoResult = RatingStatsRepoResult & {
  id: number
  title: string
  originalTitle: string | null
  releaseYear: number | null
  runtime: number | null
  originalLanguage: string | null
  productionCountries: unknown
  overview: string | null
  posterPath: string | null
  backdropPath: string | null
  trailerUrl: string | null
  genres: GenreDto[]
  director: string | null
  cast: MovieCastMemberRepoResult[]
  reviewCount: number
}

export type MovieCastMemberRepoResult = {
  id: number
  name: string
  characterName: string | null
  profilePath: string | null
}

// Repository port
export type MovieRepository = {
  listMovies(params: ListMoviesRepoParams): Promise<MovieListRepoResult>
  getMovieDetail(movieId: number): Promise<MovieDetailRepoResult | null>
  listGenres(): Promise<GenreDto[]>
  findBookmarkedMovieIds(params: FindBookmarkedMovieIdsRepoParams): Promise<Set<number>>
  isMovieBookmarked(params: IsMovieBookmarkedRepoParams): Promise<boolean>
}

export type MovieService = {
  listMovies(context: RequestContext, input: ListMoviesInput): Promise<MovieListResponseDto>
  getMovieDetail(context: RequestContext, movieId: number): Promise<MovieDetailDto>
  listGenres(): Promise<GenreListResponseDto>
}
