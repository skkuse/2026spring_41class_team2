import type { RequestContext } from "@/server/auth/auth-types"

// HTTP DTO
export type UserSummaryDto = {
  id: string
  name: string
  profileImageUrl: string | null
}

export type ReviewDto = {
  id: string
  user: UserSummaryDto
  rating: number
  content: string
  date: string
  likes: number
  isLiked: boolean
}

export type MovieReviewsResponseDto = {
  reviews: ReviewDto[]
  totalCount: number
}

export type CreateReviewResponseDto = {
  reviewId: string
  rating: number
  content: string
  date: string
}

export type ReviewLikeResponseDto = {
  reviewId: string
  likes: number
  isLiked: boolean
}

export type MyReviewDto = {
  id: string
  movieId: number
  movieTitle: string
  posterUrl: string | null
  rating: number
  content: string
  date: string
  likes: number
}

export type MyReviewsResponseDto = {
  reviews: MyReviewDto[]
  totalCount: number
}

// Service input
export type ReviewSort = "latest" | "likes"

export type ListMovieReviewsInput = {
  movieId: number
  page?: number
  size?: number
  sort?: ReviewSort
}

export type CreateReviewInput = {
  movieId: number
  rating: number
  content: string
}

export type SetReviewLikeInput = {
  reviewId: string
  liked: boolean
}

export type ListMyReviewsInput = {
  page?: number
  size?: number
}

// Repository params
export type ListMovieReviewsRepoParams = {
  movieId: number
  currentUserId: string | null
  limit: number
  offset: number
  sort: ReviewSort
}

export type CreateReviewRepoParams = {
  userId: string
  movieId: number
  rating: number
  content: string
}

export type ReviewLikeRepoParams = {
  reviewId: string
  userId: string
}

export type ListReviewsByUserRepoParams = {
  userId: string
  limit: number
  offset: number
}

// Repository results
export type ReviewRepoResult = {
  id: string
  user: UserSummaryDto
  rating: string | number
  content: string
  date: Date
  likes: number
  isLiked: boolean
}

export type MovieReviewsRepoResult = {
  reviews: ReviewRepoResult[]
  totalCount: number
}

export type CreatedReviewRepoResult = {
  id: string
  rating: string | number
  content: string
  date: Date
}

export type MyReviewRepoResult = {
  id: string
  movieId: number
  movieTitle: string
  posterPath: string | null
  rating: string | number
  content: string
  date: Date
  likes: number
}

export type MyReviewsRepoResult = {
  reviews: MyReviewRepoResult[]
  totalCount: number
}

// Repository port
export type ReviewRepository = {
  movieExists(movieId: number): Promise<boolean>
  reviewExists(reviewId: string): Promise<boolean>
  findReviewByUserAndMovie(userId: string, movieId: number): Promise<{ id: string } | null>
  listMovieReviews(params: ListMovieReviewsRepoParams): Promise<MovieReviewsRepoResult>
  createReviewWithStats(params: CreateReviewRepoParams): Promise<CreatedReviewRepoResult>
  likeReview(params: ReviewLikeRepoParams): Promise<void>
  unlikeReview(params: ReviewLikeRepoParams): Promise<void>
  countReviewLikes(reviewId: string): Promise<number>
  listReviewsByUser(params: ListReviewsByUserRepoParams): Promise<MyReviewsRepoResult>
}

export type ReviewService = {
  listMovieReviews(context: RequestContext, input: ListMovieReviewsInput): Promise<MovieReviewsResponseDto>
  createReview(context: RequestContext, input: CreateReviewInput): Promise<CreateReviewResponseDto>
  setReviewLike(context: RequestContext, input: SetReviewLikeInput): Promise<ReviewLikeResponseDto>
  listMyReviews(context: RequestContext, input: ListMyReviewsInput): Promise<MyReviewsResponseDto>
}
