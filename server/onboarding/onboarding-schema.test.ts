import { describe, expect, it } from "vitest"
import {
  preferredMoviesResponseSchema,
  savePreferredMoviesBodySchema,
  savePreferredMoviesResponseSchema,
} from "./onboarding-schema"

describe("savePreferredMoviesBodySchema", () => {
  it("accepts exactly 5 unique positive integer movie ids", () => {
    expect(savePreferredMoviesBodySchema.parse({ movieIds: [1, 2, 3, 4, 5] })).toEqual({
      movieIds: [1, 2, 3, 4, 5],
    })
  })

  it("rejects invalid movieIds", () => {
    expect(() => savePreferredMoviesBodySchema.parse({})).toThrow()
    expect(() => savePreferredMoviesBodySchema.parse({ movieIds: [1, 2, 3, 4] })).toThrow()
    expect(() => savePreferredMoviesBodySchema.parse({ movieIds: [1, 2, 3, 4, 4] })).toThrow()
    expect(() => savePreferredMoviesBodySchema.parse({ movieIds: [1, 2, 3, 4, 1.5] })).toThrow()
    expect(() => savePreferredMoviesBodySchema.parse({ movieIds: [1, 2, 3, 4, -5] })).toThrow()
  })
})

describe("onboarding response schemas", () => {
  it("validates preferred movies response", () => {
    expect(preferredMoviesResponseSchema.parse({ movies: [] })).toEqual({ movies: [] })
  })

  it("validates save response", () => {
    expect(savePreferredMoviesResponseSchema.parse({ movieIds: [1, 2, 3, 4, 5], onboardingCompleted: true })).toEqual({
      movieIds: [1, 2, 3, 4, 5],
      onboardingCompleted: true,
    })
  })
})
