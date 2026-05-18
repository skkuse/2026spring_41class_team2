import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  class BookmarkMovieNotFoundError extends Error {
    constructor(movieId: number) {
      super(`Movie not found: ${movieId}`)
      this.name = "BookmarkMovieNotFoundError"
    }
  }

  class UnauthorizedBookmarkError extends Error {
    constructor() {
      super("Authentication is required for movie bookmarks")
      this.name = "UnauthorizedBookmarkError"
    }
  }

  return {
    createOptionalRequestContext: vi.fn(),
    createRequestId: vi.fn(),
    BookmarkMovieNotFoundError,
    UnauthorizedBookmarkError,
    bookmarkService: {
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
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
  BookmarkMovieNotFoundError: mocks.BookmarkMovieNotFoundError,
  UnauthorizedBookmarkError: mocks.UnauthorizedBookmarkError,
  bookmarkService: mocks.bookmarkService,
}))

import { apiErrorCodes } from "@/server/error"
import { DELETE, PUT } from "./route"

describe("/api/me/bookmarked-movies/{movieId}", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.createOptionalRequestContext.mockResolvedValue({
      requestId: "request-1",
      user: { id: "user-1", email: "user@example.com" },
    })
    mocks.bookmarkService.addBookmark.mockResolvedValue({ movieId: 550, isBookmarked: true })
    mocks.bookmarkService.removeBookmark.mockResolvedValue({ movieId: 550, isBookmarked: false })
  })

  it("returns 400 when movieId is invalid", async () => {
    const response = await PUT(new Request("http://localhost/api/me/bookmarked-movies/abc"), {
      params: Promise.resolve({ movieId: "abc" }),
    })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidMovieId, requestId: "request-1" } },
    })
    expect(mocks.createOptionalRequestContext).not.toHaveBeenCalled()
    expect(mocks.bookmarkService.addBookmark).not.toHaveBeenCalled()
  })

  it("returns 401 when bookmark mutation requires authentication", async () => {
    mocks.bookmarkService.addBookmark.mockRejectedValue(new mocks.UnauthorizedBookmarkError())

    const response = await PUT(new Request("http://localhost/api/me/bookmarked-movies/550"), {
      params: Promise.resolve({ movieId: "550" }),
    })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 401,
      body: { error: { code: apiErrorCodes.unauthorized, requestId: "request-1" } },
    })
  })

  it("returns 404 when bookmark movie is not found", async () => {
    mocks.bookmarkService.addBookmark.mockRejectedValue(new mocks.BookmarkMovieNotFoundError(404))

    const response = await PUT(new Request("http://localhost/api/me/bookmarked-movies/404"), {
      params: Promise.resolve({ movieId: "404" }),
    })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 404,
      body: { error: { code: apiErrorCodes.movieNotFound, requestId: "request-1" } },
    })
  })

  it("returns 500 when an unknown mutation error is thrown", async () => {
    mocks.bookmarkService.removeBookmark.mockRejectedValue(new Error("DB failed"))

    const response = await DELETE(new Request("http://localhost/api/me/bookmarked-movies/550"), {
      params: Promise.resolve({ movieId: "550" }),
    })

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 500,
      body: { error: { code: apiErrorCodes.bookmarkMutationFailed, requestId: "request-1" } },
    })
  })
})

async function readResponse(response: Response) {
  return {
    status: response.status,
    body: await response.json(),
  }
}
