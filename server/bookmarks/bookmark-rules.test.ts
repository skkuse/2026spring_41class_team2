import { describe, expect, it } from "vitest"
import { normalizeBookmarkPagination } from "./bookmark-rules"

describe("normalizeBookmarkPagination", () => {
  it("uses page 1 and size 20 by default", () => {
    expect(normalizeBookmarkPagination({})).toEqual({ page: 1, size: 20, offset: 0 })
  })

  it("caps size at 50 and calculates offset", () => {
    expect(normalizeBookmarkPagination({ page: 3, size: 100 })).toEqual({ page: 3, size: 50, offset: 100 })
  })
})
