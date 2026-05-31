import type { MovieCardDto } from "@/server/movies/movie-types"

export type SimilarMoviesResponse = {
  movies: MovieCardDto[]
}

export class SimilarMoviesApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly requestId?: string,
  ) {
    super(message)
    this.name = "SimilarMoviesApiError"
  }
}

export async function getSimilarMovies(
  movieId: number,
  input: { limit?: number } = {},
  fetchImpl: typeof fetch = fetch,
): Promise<SimilarMoviesResponse> {
  const params = new URLSearchParams()
  if (input.limit !== undefined) {
    params.set("limit", String(input.limit))
  }

  const query = params.toString()
  const response = await fetchImpl(`/api/movies/${movieId}/similar${query ? `?${query}` : ""}`, {
    cache: "no-store",
  })
  return parseJsonResponse<SimilarMoviesResponse>(response)
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const error = body?.error
    throw new SimilarMoviesApiError(
      typeof error?.message === "string" ? error.message : "요청을 처리하지 못했습니다.",
      response.status,
      typeof error?.code === "string" ? error.code : undefined,
      typeof error?.requestId === "string" ? error.requestId : undefined,
    )
  }

  return body as T
}
