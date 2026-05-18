import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  class UnauthorizedBookmarkError extends Error {
    constructor() {
      super("Authentication is required for movie bookmarks")
      this.name = "UnauthorizedBookmarkError"
    }
  }

  return {
    createOptionalRequestContext: vi.fn(),
    createRequestId: vi.fn(),
    UnauthorizedBookmarkError,
    bookmarkService: {
      getBookmarkedMovies: vi.fn(),
    },
  }
})

vi.mock("server-only", () => ({}))

vi.mock("@/server/auth/request-context", () => ({
  createOptionalRequestContext: mocks.createOptionalRequestContext,
  createRequestId: mocks.createRequestId,
}))

vi.mock("@/server/logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock("@/server/bookmarks", () => ({
  BookmarkMovieNotFoundError: class BookmarkMovieNotFoundError extends Error {},
  UnauthorizedBookmarkError: mocks.UnauthorizedBookmarkError,
  bookmarkService: mocks.bookmarkService,
}))

import { apiErrorCodes } from "@/server/error"
import { GET } from "./route"

describe("GET /api/me/bookmarked-movies", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.createOptionalRequestContext.mockResolvedValue({
      requestId: "request-1",
      user: { id: "user-1", email: "user@example.com" },
    })
    mocks.bookmarkService.getBookmarkedMovies.mockResolvedValue({ movies: [], totalCount: 0 })
  })

  it("returns 400 when query is invalid", async () => {
    const response = await GET(new Request("http://localhost/api/me/bookmarked-movies?page=0"))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidQuery, requestId: "request-1" } },
    })
    expect(mocks.createOptionalRequestContext).not.toHaveBeenCalled()
    expect(mocks.bookmarkService.getBookmarkedMovies).not.toHaveBeenCalled()
  })

  it("returns 401 when bookmarks require authentication", async () => {
    mocks.bookmarkService.getBookmarkedMovies.mockRejectedValue(new mocks.UnauthorizedBookmarkError())

    const response = await GET(new Request("http://localhost/api/me/bookmarked-movies"))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 401,
      body: { error: { code: apiErrorCodes.unauthorized, requestId: "request-1" } },
    })
  })

  it("returns 500 when an unknown error is thrown", async () => {
    mocks.bookmarkService.getBookmarkedMovies.mockRejectedValue(new Error("DB failed"))

    const response = await GET(new Request("http://localhost/api/me/bookmarked-movies"))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 500,
      body: { error: { code: apiErrorCodes.bookmarkedMoviesFailed, requestId: "request-1" } },
    })
  })
})

async function readResponse(response: Response) {
  return {
    status: response.status,
    body: await response.json(),
  }
}
