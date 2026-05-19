export type ReviewUserSummary = {
  id: string
  name: string
  profileImageUrl: string | null
}

export type MovieReview = {
  id: string
  user: ReviewUserSummary
  rating: number
  content: string
  date: string
  likes: number
  isLiked: boolean
}

export type MovieReviewsResponse = {
  reviews: MovieReview[]
  totalCount: number
}

export type CreateReviewResponse = {
  reviewId: string
  rating: number
  content: string
  date: string
}

export type ReviewLikeResponse = {
  reviewId: string
  likes: number
  isLiked: boolean
}

export type MyReview = {
  id: string
  movieId: number
  movieTitle: string
  posterUrl: string | null
  rating: number
  content: string
  date: string
  likes: number
}

export type MyReviewsResponse = {
  reviews: MyReview[]
  totalCount: number
}

export class ReviewsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly requestId?: string,
  ) {
    super(message)
    this.name = "ReviewsApiError"
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isConflict() {
    return this.status === 409
  }
}

export async function getMovieReviews(
  input: { movieId: number; page: number; size: number; sort: "latest" | "likes" },
  fetchImpl: typeof fetch = fetch,
): Promise<MovieReviewsResponse> {
  const params = new URLSearchParams({
    page: String(input.page),
    size: String(input.size),
    sort: input.sort,
  })
  const response = await fetchImpl(`/api/movies/${input.movieId}/reviews?${params}`, { cache: "no-store" })
  return parseJsonResponse<MovieReviewsResponse>(response)
}

export async function createMovieReview(
  movieId: number,
  input: { rating: number; content: string },
  fetchImpl: typeof fetch = fetch,
): Promise<CreateReviewResponse> {
  const response = await fetchImpl(`/api/movies/${movieId}/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })
  return parseJsonResponse<CreateReviewResponse>(response)
}

export async function toggleReviewLike(
  reviewId: string,
  nextLiked: boolean,
  fetchImpl: typeof fetch = fetch,
): Promise<ReviewLikeResponse> {
  const response = await fetchImpl(`/api/reviews/${reviewId}/like`, {
    method: nextLiked ? "PUT" : "DELETE",
  })
  return parseJsonResponse<ReviewLikeResponse>(response)
}

export async function getMyReviews(
  input: { page: number; size: number },
  fetchImpl: typeof fetch = fetch,
): Promise<MyReviewsResponse> {
  const params = new URLSearchParams({ page: String(input.page), size: String(input.size) })
  const response = await fetchImpl(`/api/me/reviews?${params}`, { cache: "no-store" })
  return parseJsonResponse<MyReviewsResponse>(response)
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const error = body?.error
    throw new ReviewsApiError(
      typeof error?.message === "string" ? error.message : "요청을 처리하지 못했습니다.",
      response.status,
      typeof error?.code === "string" ? error.code : undefined,
      typeof error?.requestId === "string" ? error.requestId : undefined,
    )
  }

  return body as T
}
