export type BookmarkMovieCard = {
  id: number
  title: string
  year: number | null
  rating: number
  genres: { id: number; name: string }[]
  posterUrl: string | null
  isBookmarked: boolean
}

export type BookmarkedMoviesResponse = {
  movies: BookmarkMovieCard[]
  totalCount: number
}

export type BookmarkMutationResponse = {
  movieId: number
  isBookmarked: boolean
}

export class BookmarkedMoviesApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly requestId?: string,
  ) {
    super(message)
    this.name = "BookmarkedMoviesApiError"
  }

  get isUnauthorized() {
    return this.status === 401
  }
}

export async function getBookmarkedMovies(
  input: { page: number; size: number },
  fetchImpl: typeof fetch = fetch,
): Promise<BookmarkedMoviesResponse> {
  const params = new URLSearchParams({ page: String(input.page), size: String(input.size) })
  const response = await fetchImpl(`/api/me/bookmarked-movies?${params}`, { cache: "no-store" })
  return parseJsonResponse<BookmarkedMoviesResponse>(response)
}

export async function toggleMovieBookmark(
  movieId: number,
  nextBookmarked: boolean,
  fetchImpl: typeof fetch = fetch,
): Promise<BookmarkMutationResponse> {
  const response = await fetchImpl(`/api/me/bookmarked-movies/${movieId}`, {
    method: nextBookmarked ? "PUT" : "DELETE",
  })
  return parseJsonResponse<BookmarkMutationResponse>(response)
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const error = body?.error
    throw new BookmarkedMoviesApiError(
      typeof error?.message === "string" ? error.message : "요청을 처리하지 못했습니다.",
      response.status,
      typeof error?.code === "string" ? error.code : undefined,
      typeof error?.requestId === "string" ? error.requestId : undefined,
    )
  }

  return body as T
}
