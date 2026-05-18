import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createRequestContextFromAuthUser: vi.fn(),
  createRequestId: vi.fn(),
  isMissingAuthSessionError: vi.fn(),
  mapSupabaseUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  userService: {
    getCurrentUser: vi.fn(),
  },
}))

vi.mock("server-only", () => ({}))

vi.mock("@/server/auth/request-context", () => ({
  createRequestContextFromAuthUser: mocks.createRequestContextFromAuthUser,
  createRequestId: mocks.createRequestId,
  isMissingAuthSessionError: mocks.isMissingAuthSessionError,
  mapSupabaseUser: mocks.mapSupabaseUser,
}))

vi.mock("@/server/auth/supabase-server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}))

vi.mock("@/server/logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock("@/server/users", () => ({
  userService: mocks.userService,
}))

import { apiErrorCodes } from "@/server/error"
import { GET } from "./route"

describe("GET /api/me", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestId.mockReturnValue("request-1")
    mocks.isMissingAuthSessionError.mockReturnValue(false)
    mocks.createRequestContextFromAuthUser.mockReturnValue({ requestId: "request-1", user: null })
    mocks.mapSupabaseUser.mockReturnValue({ id: "user-1", email: "user@example.com", userMetadata: {} })
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    })
    mocks.userService.getCurrentUser.mockResolvedValue({ authenticated: false, user: null })
  })

  it("returns 500 when current user sync fails", async () => {
    mocks.userService.getCurrentUser.mockRejectedValue(new Error("sync failed"))

    const response = await GET()

    await expect(readResponse(response)).resolves.toEqual({
      status: 500,
      body: {
        error: {
          code: apiErrorCodes.profileSyncFailed,
          message: "현재 사용자 정보를 동기화하지 못했습니다.",
          requestId: "request-1",
        },
      },
    })
  })
})

async function readResponse(response: Response) {
  return {
    status: response.status,
    body: await response.json(),
  }
}
