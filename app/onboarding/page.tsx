"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MovieCard } from "@/components/movie-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Sparkles, CheckCircle2 } from "lucide-react"

const REQUIRED_SELECTION_COUNT = 5
const ONBOARDING_MOVIE_PAGE_SIZE = 24

type OnboardingMovie = {
  id: string
  title: string
  year: string
  rating: number
  genre: string
  posterUrl: string | null
}

type MovieCardApi = {
  id: number
  title: string
  year: number | null
  rating: number
  genres: { name: string }[]
  posterUrl: string | null
}

type MoviesResponse = {
  movies: MovieCardApi[]
  page: number
  size: number
  totalCount: number
}

type MeResponse =
  | { authenticated: false; user: null }
  | { authenticated: true; user: { onboardingCompleted: boolean } }

export default function OnboardingPage() {
  const router = useRouter()
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([])
  const [popularMovies, setPopularMovies] = useState<OnboardingMovie[]>([])
  const [allowed, setAllowed] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const hasMore = popularMovies.length < totalCount

  const fetchMoviesPage = useCallback(async (pageToLoad: number, options: { replace?: boolean } = {}) => {
    if (options.replace) {
      setLoadingInitial(true)
    } else {
      setLoadingMore(true)
    }

    try {
      setErrorMessage(null)
      const response = await fetch(
        `/api/movies?sort=popular&page=${pageToLoad}&size=${ONBOARDING_MOVIE_PAGE_SIZE}`,
        { cache: "no-store" },
      )
      if (!response.ok) {
        throw new Error("Failed to load movies")
      }

      const data = (await response.json()) as MoviesResponse
      setPage(data.page)
      setTotalCount(data.totalCount)
      setPopularMovies((prev) => {
        const nextMovies = data.movies.map(mapMovieCardResponse)
        if (options.replace) {
          return nextMovies
        }

        const existingIds = new Set(prev.map((movie) => movie.id))
        return [...prev, ...nextMovies.filter((movie) => !existingIds.has(movie.id))]
      })
    } catch {
      setErrorMessage("영화 목록을 불러오지 못했습니다.")
    } finally {
      setLoadingInitial(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" })
        const me = (await response.json()) as MeResponse

        if (cancelled) {
          return
        }

        if (!response.ok || !me.authenticated) {
          router.replace("/login?returnTo=%2Fonboarding")
          return
        }

        if (me.user.onboardingCompleted) {
          router.replace("/recommend")
          return
        }

        setAllowed(true)
        await fetchMoviesPage(1, { replace: true })
      } catch {
        if (!cancelled) {
          router.replace("/login?returnTo=%2Fonboarding")
        }
      }
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  }, [fetchMoviesPage, router])

  useEffect(() => {
    if (!allowed || loadingInitial || loadingMore || !hasMore) {
      return
    }

    const target = loadMoreRef.current
    if (!target) {
      return
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        void fetchMoviesPage(page + 1)
      }
    }, { rootMargin: "320px" })

    observer.observe(target)
    return () => observer.disconnect()
  }, [allowed, fetchMoviesPage, hasMore, loadingInitial, loadingMore, page])

  const selectedMovieSet = useMemo(() => new Set(selectedMovieIds), [selectedMovieIds])
  const selectedCount = selectedMovieIds.length
  const selectionLocked = selectedCount >= REQUIRED_SELECTION_COUNT
  const isReadyToStart = selectedCount === REQUIRED_SELECTION_COUNT

  const toggleMovie = (movieId: string) => {
    setSelectedMovieIds((prev) => {
      if (prev.includes(movieId)) {
        return prev.filter((id) => id !== movieId)
      }

      if (prev.length >= REQUIRED_SELECTION_COUNT) {
        return prev
      }

      return [...prev, movieId]
    })
  }

  const handleStart = async () => {
    if (!isReadyToStart || saving) {
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      const response = await fetch("/api/me/preferences/movies", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ movieIds: selectedMovieIds.map(Number) }),
      })

      if (response.status === 401) {
        router.replace("/login?returnTo=%2Fonboarding")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to save preferred movies")
      }

      router.push("/recommend")
    } catch {
      setErrorMessage("선호 영화를 저장하지 못했습니다.")
    } finally {
      setSaving(false)
    }
  }

  if (!allowed) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            온보딩
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">좋아하는 영화 5개를 선택해주세요</h1>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            선택한 영화들을 바탕으로 맞춤 추천을 준비할게요.
          </p>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">인기 영화 목록에서 마음에 드는 작품을 골라주세요.</p>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
                {selectedCount}/{REQUIRED_SELECTION_COUNT}
              </Badge>
            </div>

            {loadingInitial ? (
              <div className="flex min-h-80 items-center justify-center">
                <Spinner />
              </div>
            ) : popularMovies.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {popularMovies.map((movie) => {
                    const selected = selectedMovieSet.has(movie.id)

                    return (
                      <MovieCard
                        key={movie.id}
                        {...movie}
                        selectable
                        selected={selected}
                        disabled={selectionLocked && !selected}
                        showLikeButton={false}
                        onClick={() => toggleMovie(movie.id)}
                      />
                    )
                  })}
                </div>
                <div ref={loadMoreRef} className="flex h-20 items-center justify-center">
                  {loadingMore && <Spinner />}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                <p className="text-lg font-medium">선택 가능한 영화가 없습니다</p>
                <p className="mt-2 text-sm text-muted-foreground">잠시 후 다시 시도해주세요.</p>
              </div>
            )}
          </section>

          <aside className="h-fit lg:sticky lg:top-8">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">선택 현황</h2>
                  <p className="text-sm text-muted-foreground">{selectedCount}개 선택됨</p>
                </div>
              </div>

              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">선택 개수</span>
                  <span className="font-medium text-foreground">
                    {selectedCount}/{REQUIRED_SELECTION_COUNT}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(selectedCount / REQUIRED_SELECTION_COUNT) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mb-5 min-h-24 rounded-lg border border-dashed border-border bg-background/60 p-4">
                {selectedMovieIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedMovieIds.map((movieId) => {
                      const movie = popularMovies.find((item) => item.id === movieId)
                      if (!movie) {
                        return null
                      }

                      return (
                        <button
                          key={movie.id}
                          type="button"
                          onClick={() => toggleMovie(movie.id)}
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          <span className="max-w-[10rem] truncate">{movie.title}</span>
                          <span className="opacity-70">×</span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex h-24 items-center justify-center text-center text-sm text-muted-foreground">
                    5개를 선택하면 시작할 수 있어요.
                  </div>
                )}
              </div>

              <Button className="w-full" size="lg" disabled={!isReadyToStart || saving} onClick={handleStart}>
                {saving ? "저장 중" : isReadyToStart ? "시작하기" : "5개를 선택해주세요"}
              </Button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                정확히 5개를 선택해야 다음 화면으로 이동할 수 있어요.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function mapMovieCardResponse(movie: MovieCardApi): OnboardingMovie {
  return {
    id: String(movie.id),
    title: movie.title,
    year: movie.year?.toString() ?? "연도 미상",
    rating: movie.rating,
    genre: movie.genres.map((genre) => genre.name).join(", ") || "장르 미상",
    posterUrl: movie.posterUrl,
  }
}
