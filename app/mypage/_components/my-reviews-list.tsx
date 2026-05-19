"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { ReviewsApiError, getMyReviews, type MyReview } from "@/lib/reviews/reviews-client"

const PAGE_SIZE = 20

export function MyReviewsList() {
  const [reviews, setReviews] = useState<MyReview[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const hasMore = totalCount === null || reviews.length < totalCount

  const loadInitialReviews = useCallback(async (cancelled?: () => boolean) => {
    setLoading(true)
    setError(null)

    try {
      const response = await getMyReviews({ page: 1, size: PAGE_SIZE })
      if (!cancelled?.()) {
        setReviews(response.reviews)
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
      const response = await getMyReviews({ page: nextPage, size: PAGE_SIZE })
      setReviews((current) => [...current, ...response.reviews])
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
    void loadInitialReviews(() => cancelled)

    return () => {
      cancelled = true
    }
  }, [loadInitialReviews])

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

  if (reviews.length === 0 && !error) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        아직 작성한 리뷰가 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void (reviews.length === 0 ? loadInitialReviews() : loadNextPage())}>
            다시 시도
          </Button>
        </div>
      )}

      {reviews.map((review) => (
        <Link key={review.id} href={`/movie/${review.movieId}`}>
          <Card className="transition-colors hover:bg-secondary/30">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex h-24 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                  {review.posterUrl ? (
                    <Image src={review.posterUrl} alt={review.movieTitle} width={64} height={96} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-semibold text-muted-foreground">{review.movieTitle.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{review.movieTitle}</h3>
                      <div className="mt-1 flex items-center gap-1">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            className={`h-4 w-4 ${index < review.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{review.content}</p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatDate(review.date)}</span>
                    <span>좋아요 {review.likes}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}

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
  if (error instanceof ReviewsApiError && error.isUnauthorized) {
    window.location.href = `/login?returnTo=${encodeURIComponent("/mypage")}`
    return
  }

  setError("내 리뷰 목록을 불러오지 못했습니다.")
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value))
}
