import { describe, expect, it, vi } from "vitest"
import { buildAuthCallbackUrl, signInWithOAuth } from "./auth-client"

describe("buildAuthCallbackUrl", () => {
  it("builds callback URLs with returnTo", () => {
    expect(buildAuthCallbackUrl("https://cinemate.test", "/mypage")).toBe(
      "https://cinemate.test/auth/callback?returnTo=%2Fmypage",
    )
  })
})

describe("signInWithOAuth", () => {
  it("passes provider and redirectTo to Supabase", async () => {
    const signIn = vi.fn().mockResolvedValue({ data: {}, error: null })
    const supabase = { auth: { signInWithOAuth: signIn } } as never

    await signInWithOAuth({
      provider: "google",
      returnTo: "/recommend",
      origin: "https://cinemate.test",
      supabase,
    })

    expect(signIn).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "https://cinemate.test/auth/callback?returnTo=%2Frecommend",
      },
    })
  })
})
