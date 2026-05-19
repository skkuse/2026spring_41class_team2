export type ItemCfGenre = {
  id: number
  name: string
}

export type ItemCfRecommendedMovie = {
  id: number
  title: string
  year: number | null
  rating: number
  genres: ItemCfGenre[]
  posterUrl: string | null
  reason: string
  source: "item_cf" | "fallback"
  score: number | null
  coRatingCount: number | null
  isBookmarked: boolean
}

export type ItemCfRecommendationSection = {
  seedMovie: {
    id: number
    title: string
    year: number | null
    posterUrl: string | null
  }
  title: string
  movies: ItemCfRecommendedMovie[]
}

export type ItemCfRecommendationsResponse = {
  sections: ItemCfRecommendationSection[]
}

export class ItemCfRecommendationsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly requestId?: string,
  ) {
    super(message)
    this.name = "ItemCfRecommendationsApiError"
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isOnboardingRequired() {
    return this.status === 409 && this.code === "onboarding_required"
  }
}

export async function getItemCfRecommendations(
  input: { seedLimit?: number; limitPerSeed?: number } = {},
  fetchImpl: typeof fetch = fetch,
): Promise<ItemCfRecommendationsResponse> {
  const params = new URLSearchParams()
  if (input.seedLimit !== undefined) {
    params.set("seedLimit", String(input.seedLimit))
  }
  if (input.limitPerSeed !== undefined) {
    params.set("limitPerSeed", String(input.limitPerSeed))
  }

  const query = params.toString()
  const response = await fetchImpl(`/api/me/recommendations/item-cf${query ? `?${query}` : ""}`, {
    cache: "no-store",
  })
  return parseJsonResponse<ItemCfRecommendationsResponse>(response)
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const error = body?.error
    throw new ItemCfRecommendationsApiError(
      typeof error?.message === "string" ? error.message : "요청을 처리하지 못했습니다.",
      response.status,
      typeof error?.code === "string" ? error.code : undefined,
      typeof error?.requestId === "string" ? error.requestId : undefined,
    )
  }

  return body as T
}
