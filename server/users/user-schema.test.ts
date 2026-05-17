import { describe, expect, it } from "vitest"
import { meResponseSchema } from "./user-schema"

describe("meResponseSchema", () => {
  it("accepts unauthenticated responses", () => {
    expect(meResponseSchema.parse({ authenticated: false, user: null })).toEqual({
      authenticated: false,
      user: null,
    })
  })

  it("accepts authenticated responses", () => {
    expect(() =>
      meResponseSchema.parse({
        authenticated: true,
        user: {
          id: "user-1",
          name: "사용자",
          email: "user@example.com",
          profileImageUrl: null,
          onboardingCompleted: false,
          bookmarkedMovieCount: 0,
          reviewCount: 0,
        },
      }),
    ).not.toThrow()
  })

  it("rejects negative counts", () => {
    expect(() =>
      meResponseSchema.parse({
        authenticated: true,
        user: {
          id: "user-1",
          name: "사용자",
          email: "user@example.com",
          profileImageUrl: null,
          onboardingCompleted: false,
          bookmarkedMovieCount: -1,
          reviewCount: 0,
        },
      }),
    ).toThrow()
  })
})

