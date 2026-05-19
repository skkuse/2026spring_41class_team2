import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  class UnauthorizedRecommendationError extends Error {}
  class OnboardingRequiredRecommendationError extends Error {}

  return {
    createOptionalRequestContext: vi.fn(),
    createRequestId: vi.fn(),
    UnauthorizedRecommendationError,
    OnboardingRequiredRecommendationError,
    itemCfRecommendationService: {
      getItemCfRecommendations: vi.fn(),
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

vi.mock("@/server/recommendations", () => ({
  OnboardingRequiredRecommendationError: mocks.OnboardingRequiredRecommendationError,
  UnauthorizedRecommendationError: mocks.UnauthorizedRecommendationError,
  itemCfRecommendationService: mocks.itemCfRecommendationService,
}))

import { apiErrorCodes } from "@/server/error"
import { GET } from "./route"

describe("GET /api/me/recommendations/item-cf", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.createOptionalRequestContext.mockResolvedValue({
      requestId: "request-1",
      user: { id: "user-1", email: "user@example.com" },
    })
    mocks.itemCfRecommendationService.getItemCfRecommendations.mockResolvedValue({ sections: [] })
  })

  it("returns 400 when query is invalid", async () => {
    const response = await GET(new Request("http://localhost/api/me/recommendations/item-cf?seedLimit=6"))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 400,
      body: { error: { code: apiErrorCodes.invalidQuery, requestId: "request-1" } },
    })
    expect(mocks.createOptionalRequestContext).not.toHaveBeenCalled()
  })

  it("passes parsed query to the service", async () => {
    const response = await GET(
      new Request("http://localhost/api/me/recommendations/item-cf?seedLimit=2&limitPerSeed=12"),
    )

    await expect(readResponse(response)).resolves.toEqual({ status: 200, body: { sections: [] } })
    expect(mocks.itemCfRecommendationService.getItemCfRecommendations).toHaveBeenCalledWith(
      { requestId: "request-1", user: { id: "user-1", email: "user@example.com" } },
      { seedLimit: 2, limitPerSeed: 12 },
    )
  })

  it("returns 401 when authentication is required", async () => {
    mocks.itemCfRecommendationService.getItemCfRecommendations.mockRejectedValue(
      new mocks.UnauthorizedRecommendationError(),
    )

    const response = await GET(new Request("http://localhost/api/me/recommendations/item-cf"))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 401,
      body: { error: { code: apiErrorCodes.unauthorized, requestId: "request-1" } },
    })
  })

  it("returns onboarding required when the user has not completed onboarding", async () => {
    mocks.itemCfRecommendationService.getItemCfRecommendations.mockRejectedValue(
      new mocks.OnboardingRequiredRecommendationError(),
    )

    const response = await GET(new Request("http://localhost/api/me/recommendations/item-cf"))

    await expect(readResponse(response)).resolves.toMatchObject({
      status: 409,
      body: { error: { code: apiErrorCodes.onboardingRequired, requestId: "request-1" } },
    })
  })
})

async function readResponse(response: Response) {
  return {
    status: response.status,
    body: await response.json(),
  }
}
