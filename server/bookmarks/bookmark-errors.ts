import "server-only"

export class UnauthorizedBookmarkError extends Error {
  constructor() {
    super("Authentication is required for movie bookmarks")
    this.name = "UnauthorizedBookmarkError"
  }
}

export class BookmarkMovieNotFoundError extends Error {
  constructor(movieId: number) {
    super(`Movie not found: ${movieId}`)
    this.name = "BookmarkMovieNotFoundError"
  }
}
