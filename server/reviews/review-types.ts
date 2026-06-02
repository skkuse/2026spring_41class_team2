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

export type UpdateReviewResponseDto = {
  reviewId: string
  rating: number
  content: string
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

export type UpdateReviewInput = {
  reviewId: string
  rating: number
  content: string
}

export type DeleteReviewInput = {
  reviewId: string
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

export type UpdateReviewRepoParams = {
  reviewId: string
  rating: number
  content: string
  ratingDelta: number
  movieId: number
}

export type DeleteReviewRepoParams = {
  reviewId: string
  oldRating: number
  movieId: number
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

export type FindReviewByIdRepoResult = {
  id: string
  userId: string
  movieId: number
  rating: string | number
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
  findReviewById(reviewId: string): Promise<FindReviewByIdRepoResult | null>
  listMovieReviews(params: ListMovieReviewsRepoParams): Promise<MovieReviewsRepoResult>
  createReviewWithStats(params: CreateReviewRepoParams): Promise<CreatedReviewRepoResult>
  updateReviewWithStats(params: UpdateReviewRepoParams): Promise<void>
  deleteReviewWithStats(params: DeleteReviewRepoParams): Promise<void>
  likeReview(params: ReviewLikeRepoParams): Promise<void>
  unlikeReview(params: ReviewLikeRepoParams): Promise<void>
  countReviewLikes(reviewId: string): Promise<number>
  listReviewsByUser(params: ListReviewsByUserRepoParams): Promise<MyReviewsRepoResult>
}

export type ReviewService = {
  listMovieReviews(context: RequestContext, input: ListMovieReviewsInput): Promise<MovieReviewsResponseDto>
  createReview(context: RequestContext, input: CreateReviewInput): Promise<CreateReviewResponseDto>
  updateReview(context: RequestContext, input: UpdateReviewInput): Promise<UpdateReviewResponseDto>
  deleteReview(context: RequestContext, input: DeleteReviewInput): Promise<void>
  setReviewLike(context: RequestContext, input: SetReviewLikeInput): Promise<ReviewLikeResponseDto>
  listMyReviews(context: RequestContext, input: ListMyReviewsInput): Promise<MyReviewsResponseDto>
}
