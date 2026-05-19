import { describe, expect, it, vi } from "vitest"
import { getItemCfRecommendations, ItemCfRecommendationsApiError } from "./item-cf-client"

describe("getItemCfRecommendations", () => {
  it("requests Item CF recommendations with query params", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ sections: [] }))

    await expect(getItemCfRecommendations({ seedLimit: 2, limitPerSeed: 12 }, fetchImpl)).resolves.toEqual({
      sections: [],
    })
    expect(fetchImpl).toHaveBeenCalledWith("/api/me/recommendations/item-cf?seedLimit=2&limitPerSeed=12", {
      cache: "no-store",
    })
  })

  it("marks onboarding required errors", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        { error: { code: "onboarding_required", message: "온보딩이 필요합니다.", requestId: "request-1" } },
        { status: 409 },
      ),
    )

    await expect(getItemCfRecommendations({}, fetchImpl)).rejects.toMatchObject({
      status: 409,
      code: "onboarding_required",
      requestId: "request-1",
      isOnboardingRequired: true,
    } satisfies Partial<ItemCfRecommendationsApiError>)
  })
})

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json" },
  })
}
