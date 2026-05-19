import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  class UnauthorizedOnboardingError extends Error {}
  class InvalidPreferredMoviesError extends Error {}

  return {
    createOptionalRequestContext: vi.fn(),
    createRequestId: vi.fn(),
    UnauthorizedOnboardingError,
    InvalidPreferredMoviesError,
    onboardingService: {
      listPreferredMovies: vi.fn(),
      savePreferredMovies: vi.fn(),
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

vi.mock("@/server/onboarding", () => ({
  InvalidPreferredMoviesError: mocks.InvalidPreferredMoviesError,
  UnauthorizedOnboardingError: mocks.UnauthorizedOnboardingError,
  onboardingService: mocks.onboardingService,
}))

import { apiErrorCodes } from "@/server/error"
import { GET, PUT } from "./route"

describe("/api/me/preferences/movies", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.createOptionalRequestContext.mockResolvedValue({
      requestId: "request-1",
      user: { id: "user-1", email: "user@example.com" },
    })
    mocks.onboardingService.listPreferredMovies.mockResolvedValue({ movies: [] })
    mocks.onboardingService.savePreferredMovies.mockResolvedValue({
      movieIds: [1, 2, 3, 4, 5],
      onboardingCompleted: true,
    })
  })

  it("returns preferred movies", async () => {
    const response = await GET()

    await expect(readResponse(response)).resolves.toEqual({ status: 200, body: { movies: [] } })
    expect(mocks.onboardingService.listPreferredMovies).toHaveBeenCalledWith({
      requestId: "request-1",
      user: { id: "user-1", email: "user@example.com" },
    })
  })

  it("returns 401 when GET requires authentication", async () => {
    mocks.onboardingService.listPreferredMovies.mockRejectedValue(new mocks.UnauthorizedOnboardingError())

    const response = await GET()

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 401,
      body: { error: { code: apiErrorCodes.unauthorized, requestId: "request-1" } },
    })
  })

  it("returns 400 when PUT body is invalid", async () => {
    const response = await PUT(jsonRequest({ movieIds: [1, 2, 3, 4] }))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidBody, requestId: "request-1" } },
    })
    expect(mocks.createOptionalRequestContext).not.toHaveBeenCalled()
    expect(mocks.onboardingService.savePreferredMovies).not.toHaveBeenCalled()
  })

  it("saves preferred movies", async () => {
    const response = await PUT(jsonRequest({ movieIds: [1, 2, 3, 4, 5] }))

    await expect(readResponse(response)).resolves.toEqual({
      status: 200,
      body: { movieIds: [1, 2, 3, 4, 5], onboardingCompleted: true },
    })
    expect(mocks.onboardingService.savePreferredMovies).toHaveBeenCalledWith(
      { requestId: "request-1", user: { id: "user-1", email: "user@example.com" } },
      { movieIds: [1, 2, 3, 4, 5] },
    )
  })

  it("returns 401 when PUT requires authentication", async () => {
    mocks.onboardingService.savePreferredMovies.mockRejectedValue(new mocks.UnauthorizedOnboardingError())

    const response = await PUT(jsonRequest({ movieIds: [1, 2, 3, 4, 5] }))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 401,
      body: { error: { code: apiErrorCodes.unauthorized, requestId: "request-1" } },
    })
  })

  it("returns 400 for invalid preferred movies", async () => {
    mocks.onboardingService.savePreferredMovies.mockRejectedValue(new mocks.InvalidPreferredMoviesError())

    const response = await PUT(jsonRequest({ movieIds: [1, 2, 3, 4, 5] }))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidBody, requestId: "request-1" } },
    })
  })
})

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/me/preferences/movies", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  })
}

async function readResponse(response: Response) {
  return {
    status: response.status,
    body: await response.json(),
  }
}
