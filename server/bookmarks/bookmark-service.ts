import "server-only"

import type { RequestContext } from "@/server/auth/auth-types"
import { buildTmdbImageUrl, calculateMovieRating } from "@/server/movies/movie-rules"
import { createBookmarkRepository } from "./bookmark-repository"
import { normalizeBookmarkPagination } from "./bookmark-rules"
import type {
  BookmarkMovieInput,
  BookmarkRepository,
  BookmarkService,
  BookmarkedMoviesResponseDto,
  BookmarkMutationResponseDto,
  GetBookmarkedMoviesInput,
} from "./bookmark-types"

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

export type BookmarkServiceDeps = {
  repository: BookmarkRepository
}

export function createBookmarkService(deps: BookmarkServiceDeps): BookmarkService {
  return {
    async addBookmark(context: RequestContext, input: BookmarkMovieInput): Promise<BookmarkMutationResponseDto> {
      const userId = requireUserId(context)
      await ensureMovieExists(deps.repository, input.movieId)
      await deps.repository.addBookmark({ userId, movieId: input.movieId })

      return {
        movieId: input.movieId,
        isBookmarked: true,
      }
    },

    async removeBookmark(context: RequestContext, input: BookmarkMovieInput): Promise<BookmarkMutationResponseDto> {
      const userId = requireUserId(context)
      await ensureMovieExists(deps.repository, input.movieId)
      await deps.repository.removeBookmark({ userId, movieId: input.movieId })

      return {
        movieId: input.movieId,
        isBookmarked: false,
      }
    },

    async getBookmarkedMovies(
      context: RequestContext,
      input: GetBookmarkedMoviesInput,
    ): Promise<BookmarkedMoviesResponseDto> {
      const userId = requireUserId(context)
      const pagination = normalizeBookmarkPagination(input)
      const result = await deps.repository.listBookmarkedMovies({
        userId,
        limit: pagination.size,
        offset: pagination.offset,
      })

      return {
        movies: result.movies.map((movie) => ({
          id: movie.id,
          title: movie.title,
          year: movie.releaseYear,
          rating: calculateMovieRating(movie),
          genres: movie.genres,
          posterUrl: buildTmdbImageUrl(movie.posterPath, "w500"),
          isBookmarked: true,
        })),
        totalCount: result.totalCount,
      }
    },
  }
}

async function ensureMovieExists(repository: BookmarkRepository, movieId: number) {
  if (!(await repository.movieExists(movieId))) {
    throw new BookmarkMovieNotFoundError(movieId)
  }
}

function requireUserId(context: RequestContext) {
  if (!context.user) {
    throw new UnauthorizedBookmarkError()
  }

  return context.user.id
}

export const bookmarkService = createBookmarkService({
  repository: createBookmarkRepository(),
})
