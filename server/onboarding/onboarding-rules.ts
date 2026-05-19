import { InvalidPreferredMoviesError } from "./onboarding-errors"
import type { PreferredMoviePosition } from "./onboarding-types"

export const REQUIRED_PREFERRED_MOVIE_COUNT = 5

export function createPreferredMoviePositions(movieIds: number[]): PreferredMoviePosition[] {
  assertValidPreferredMovieIds(movieIds)
  return movieIds.map((movieId, index) => ({ movieId, position: index + 1 }))
}

export function assertValidPreferredMovieIds(movieIds: number[]) {
  if (movieIds.length !== REQUIRED_PREFERRED_MOVIE_COUNT) {
    throw new InvalidPreferredMoviesError("Exactly 5 preferred movies are required")
  }

  if (new Set(movieIds).size !== movieIds.length) {
    throw new InvalidPreferredMoviesError("Preferred movies must be unique")
  }
}
