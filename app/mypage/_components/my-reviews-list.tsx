"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Pencil, Star, Trash2, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { ReviewsApiError, deleteReview, getMyReviews, updateReview, type MyReview } from "@/lib/reviews/reviews-client"

const PAGE_SIZE = 20

export function MyReviewsList() {
  const [reviews, setReviews] = useState<MyReview[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRating, setEditRating] = useState(0)
  const [editContent, setEditContent] = useState("")
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

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

  const handleEditStart = (review: MyReview) => {
    setEditingId(review.id)
    setEditRating(review.rating)
    setEditContent(review.content)
    setEditError(null)
  }

  const handleEditSave = async (reviewId: string) => {
    if (editSubmitting || editRating <= 0 || editContent.trim().length === 0) return
    setEditError(null)
    setEditSubmitting(true)
    try {
      const result = await updateReview(reviewId, { rating: editRating, content: editContent })
      setReviews((current) =>
        current.map((r) => r.id === reviewId ? { ...r, rating: result.rating, content: result.content } : r),
      )
      setEditingId(null)
    } catch (err) {
      setEditError(err instanceof ReviewsApiError ? err.message : "리뷰를 수정하지 못했습니다.")
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDeleteConfirm = async (reviewId: string) => {
    if (deleteSubmitting) return
    setDeleteSubmitting(true)
    try {
      await deleteReview(reviewId)
      setReviews((current) => current.filter((r) => r.id !== reviewId))
      setTotalCount((c) => (c !== null ? c - 1 : c))
      setConfirmDeleteId(null)
    } catch (err) {
      if (err instanceof ReviewsApiError && err.isUnauthorized) {
        window.location.href = `/login?returnTo=${encodeURIComponent("/mypage")}`
      }
    } finally {
      setDeleteSubmitting(false)
    }
  }

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

      {reviews.map((review) => {
        const isEditing = editingId === review.id
        const isConfirmingDelete = confirmDeleteId === review.id

        return (
          <Card key={review.id} className="transition-colors hover:bg-secondary/30">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Link href={`/movie/${review.movieId}`} className="flex h-24 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                  {review.posterUrl ? (
                    <Image src={review.posterUrl} alt={review.movieTitle} width={64} height={96} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-semibold text-muted-foreground">{review.movieTitle.charAt(0)}</span>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/movie/${review.movieId}`} className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold hover:underline">{review.movieTitle}</h3>
                      {!isEditing && (
                        <div className="mt-1 flex items-center gap-1">
                          {[...Array(5)].map((_, index) => (
                            <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                          ))}
                        </div>
                      )}
                    </Link>
                    {!isEditing && !isConfirmingDelete && (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditStart(review)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setConfirmDeleteId(review.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => setEditRating(star)}>
                            <Star className={`h-5 w-5 transition-colors ${star <= editRating ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"}`} />
                          </button>
                        ))}
                      </div>
                      <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-20 text-sm" />
                      {editError && <p className="text-xs text-destructive">{editError}</p>}
                      <div className="flex gap-2">
                        <Button size="sm" disabled={editSubmitting || editRating <= 0 || editContent.trim().length === 0} onClick={() => void handleEditSave(review.id)}>
                          <Check className="mr-1 h-3.5 w-3.5" />
                          {editSubmitting ? "저장 중" : "저장"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="mr-1 h-3.5 w-3.5" />취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{review.content}</p>
                  )}

                  {isConfirmingDelete && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-sm">
                      <span className="flex-1 text-destructive text-xs">리뷰를 삭제할까요?</span>
                      <Button size="sm" variant="destructive" disabled={deleteSubmitting} onClick={() => void handleDeleteConfirm(review.id)}>
                        {deleteSubmitting ? "삭제 중" : "삭제"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>취소</Button>
                    </div>
                  )}

                  {!isEditing && !isConfirmingDelete && (
                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatDate(review.date)}</span>
                      <span>좋아요 {review.likes}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

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
