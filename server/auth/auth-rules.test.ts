import { describe, expect, it } from "vitest"
import { normalizeReturnTo, resolvePostLoginRedirect } from "./auth-rules"

describe("normalizeReturnTo", () => {
  it("allows internal relative paths", () => {
    expect(normalizeReturnTo("/mypage")).toBe("/mypage")
    expect(normalizeReturnTo("/recommend?tab=mine")).toBe("/recommend?tab=mine")
    expect(normalizeReturnTo("/movie/123#reviews")).toBe("/movie/123#reviews")
  })

  it("rejects external or malformed redirect targets", () => {
    expect(normalizeReturnTo("https://evil.com")).toBeNull()
    expect(normalizeReturnTo("//evil.com")).toBeNull()
    expect(normalizeReturnTo("javascript:alert(1)")).toBeNull()
    expect(normalizeReturnTo("%68%74%74%70%73%3A%2F%2Fevil.com")).toBeNull()
    expect(normalizeReturnTo("/\\evil")).toBeNull()
    expect(normalizeReturnTo("")).toBeNull()
    expect(normalizeReturnTo("   ")).toBeNull()
  })
})

describe("resolvePostLoginRedirect", () => {
  it("sends onboarding-incomplete users to onboarding before returnTo", () => {
    expect(resolvePostLoginRedirect({ returnTo: "/mypage", onboardingCompleted: false })).toBe("/onboarding")
  })

  it("sends onboarding-complete users to safe returnTo", () => {
    expect(resolvePostLoginRedirect({ returnTo: "/mypage", onboardingCompleted: true })).toBe("/mypage")
  })

  it("falls back home for complete users without a safe returnTo", () => {
    expect(resolvePostLoginRedirect({ returnTo: "https://evil.com", onboardingCompleted: true })).toBe("/")
    expect(resolvePostLoginRedirect({ onboardingCompleted: true })).toBe("/")
  })
})

