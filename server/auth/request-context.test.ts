import { describe, expect, it, vi } from "vitest"
import { isMissingAuthSessionError } from "./request-context"

vi.mock("server-only", () => ({}))

describe("isMissingAuthSessionError", () => {
  it("treats missing auth sessions as unauthenticated", () => {
    expect(isMissingAuthSessionError({ name: "AuthSessionMissingError" })).toBe(true)
    expect(isMissingAuthSessionError({ status: 401 })).toBe(true)
  })

  it("treats stale refresh tokens as unauthenticated", () => {
    expect(
      isMissingAuthSessionError({
        status: 400,
        code: "refresh_token_not_found",
        message: "Invalid Refresh Token: Refresh Token Not Found",
      }),
    ).toBe(true)
  })

  it("ignores unrelated auth errors", () => {
    expect(isMissingAuthSessionError({ status: 400, code: "unexpected_failure" })).toBe(false)
  })
})
