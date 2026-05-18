import "server-only"

export class MovieNotFoundError extends Error {
  constructor(movieId: number) {
    super(`Movie not found: ${movieId}`)
    this.name = "MovieNotFoundError"
  }
}
