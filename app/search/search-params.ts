export type SearchPageParams = {
  q?: string | string[]
  sort?: string | string[]
}

export type NormalizedSearchPageParams = {
  q: string
  sort: "popular" | "rating"
}

export function normalizeSearchPageParams(params: SearchPageParams): NormalizedSearchPageParams {
  return {
    q: getFirstParam(params.q)?.trim() ?? "",
    sort: getFirstParam(params.sort) === "rating" ? "rating" : "popular",
  }
}

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
