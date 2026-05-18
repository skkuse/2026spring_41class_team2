"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MovieCard } from "@/components/movie-card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  BookmarkedMoviesApiError,
  getBookmarkedMovies,
  type BookmarkMovieCard,
} from "@/lib/bookmarks/bookmarked-movies-client"
import { mapMovieCardToView } from "@/lib/movies/movie-view"

const PAGE_SIZE = 20

export function BookmarkedMoviesList() {
  const [movies, setMovies] = useState<BookmarkMovieCard[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const hasMore = totalCount === null || movies.length < totalCount

  const loadInitialMovies = useCallback(async (cancelled?: () => boolean) => {
    setLoading(true)
    setError(null)

    try {
      const response = await getBookmarkedMovies({ page: 1, size: PAGE_SIZE })
      if (!cancelled?.()) {
        setMovies(response.movies)
        setTotalCount(response.totalCount)
        setPage(1)
      }
    } catch (loadError) {
      if (!cancelled?.()) {
        handleListError(loadError, setError)
      }
    } finally {
      if (!cancelled?.()) {
        setLoading(false)
      }
    }
  }, [])

  const loadNextPage = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return
    }

    setLoadingMore(true)
    setError(null)

    try {
      const nextPage = page + 1
      const response = await getBookmarkedMovies({ page: nextPage, size: PAGE_SIZE })
      setMovies((current) => [...current, ...response.movies])
      setTotalCount(response.totalCount)
      setPage(nextPage)
    } catch (loadError) {
      handleListError(loadError, setError)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, page])

  useEffect(() => {
    let cancelled = false
    void loadInitialMovies(() => cancelled)

    return () => {
      cancelled = true
    }
  }, [loadInitialMovies])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || loading || loadingMore || !hasMore) {
      return
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void loadNextPage()
      }
    })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadNextPage, loading, loadingMore])

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (movies.length === 0 && !error) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        아직 찜한 영화가 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void (movies.length === 0 ? loadInitialMovies() : loadNextPage())}>
            다시 시도
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {movies.map((movie) => {
          const view = mapMovieCardToView(movie)
          return (
            <MovieCard
              key={movie.id}
              {...view}
              compact
              onBookmarkChange={(isBookmarked) => {
                if (!isBookmarked) {
                  setMovies((current) => current.filter((item) => item.id !== movie.id))
                  setTotalCount((current) => (current === null ? current : Math.max(0, current - 1)))
                }
              }}
            />
          )
        })}
      </div>

      {hasMore && <div ref={sentinelRef} className="h-8" aria-hidden="true" />}
      {loadingMore && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}
    </div>
  )
}

function handleListError(error: unknown, setError: (message: string) => void) {
  if (error instanceof BookmarkedMoviesApiError && error.isUnauthorized) {
    window.location.href = `/login?returnTo=${encodeURIComponent("/mypage")}`
    return
  }

  setError("찜한 영화 목록을 불러오지 못했습니다.")
}
