export const DEFAULT_BOOKMARK_PAGE = 1
export const DEFAULT_BOOKMARK_PAGE_SIZE = 20
export const MAX_BOOKMARK_PAGE_SIZE = 50

export type NormalizedBookmarkPagination = {
  page: number
  size: number
  offset: number
}

export function normalizeBookmarkPagination(input: { page?: number; size?: number }): NormalizedBookmarkPagination {
  const page = input.page ?? DEFAULT_BOOKMARK_PAGE
  const size = Math.min(input.size ?? DEFAULT_BOOKMARK_PAGE_SIZE, MAX_BOOKMARK_PAGE_SIZE)

  return {
    page,
    size,
    offset: (page - 1) * size,
  }
}
