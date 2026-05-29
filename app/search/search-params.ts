export type SearchPageParams = {
  q?: string | string[]
  sort?: string | string[]
  genreId?: string | string[]
}

export type NormalizedSearchPageParams = {
  q: string
  sort: "popular" | "rating"
  genreId: number | undefined
}

export function normalizeSearchPageParams(params: SearchPageParams): NormalizedSearchPageParams {
  const rawGenreId = getFirstParam(params.genreId)
  const parsedGenreId = rawGenreId !== undefined ? parseInt(rawGenreId, 10) : undefined
  const genreId =
    parsedGenreId !== undefined && Number.isInteger(parsedGenreId) && parsedGenreId > 0
      ? parsedGenreId
      : undefined

  return {
    q: getFirstParam(params.q)?.trim() ?? "",
    sort: getFirstParam(params.sort) === "rating" ? "rating" : "popular",
    genreId,
  }
}

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
