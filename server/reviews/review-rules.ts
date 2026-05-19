export const DEFAULT_REVIEW_PAGE = 1
export const DEFAULT_REVIEW_PAGE_SIZE = 20
export const MAX_REVIEW_PAGE_SIZE = 50

export type NormalizedReviewPagination = {
  page: number
  size: number
  offset: number
}

export function normalizeReviewPagination(input: { page?: number; size?: number }): NormalizedReviewPagination {
  const page = input.page ?? DEFAULT_REVIEW_PAGE
  const size = Math.min(input.size ?? DEFAULT_REVIEW_PAGE_SIZE, MAX_REVIEW_PAGE_SIZE)

  return {
    page,
    size,
    offset: (page - 1) * size,
  }
}

export function validateReviewRating(rating: number) {
  return Number.isFinite(rating) && rating >= 0.5 && rating <= 5 && Number.isInteger(rating * 2)
}

export function normalizeReviewContent(content: string) {
  return content.trim()
}
