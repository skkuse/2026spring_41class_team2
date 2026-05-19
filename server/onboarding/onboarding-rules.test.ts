import { describe, expect, it } from "vitest"
import { InvalidPreferredMoviesError } from "./onboarding-errors"
import { createPreferredMoviePositions } from "./onboarding-rules"

describe("createPreferredMoviePositions", () => {
  it("assigns positions from request order", () => {
    expect(createPreferredMoviePositions([10, 20, 30, 40, 50])).toEqual([
      { movieId: 10, position: 1 },
      { movieId: 20, position: 2 },
      { movieId: 30, position: 3 },
      { movieId: 40, position: 4 },
      { movieId: 50, position: 5 },
    ])
  })

  it("keeps different order as different positions", () => {
    expect(createPreferredMoviePositions([50, 40, 30, 20, 10]).map((movie) => movie.position)).toEqual([1, 2, 3, 4, 5])
    expect(createPreferredMoviePositions([50, 40, 30, 20, 10]).map((movie) => movie.movieId)).toEqual([50, 40, 30, 20, 10])
  })

  it("rejects counts other than 5", () => {
    expect(() => createPreferredMoviePositions([1, 2, 3, 4])).toThrow(InvalidPreferredMoviesError)
    expect(() => createPreferredMoviePositions([1, 2, 3, 4, 5, 6])).toThrow(InvalidPreferredMoviesError)
  })

  it("rejects duplicate movie ids", () => {
    expect(() => createPreferredMoviePositions([1, 2, 3, 4, 4])).toThrow(InvalidPreferredMoviesError)
  })
})
