"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MovieCard } from "@/components/movie-card"
import { Sparkles, CheckCircle2 } from "lucide-react"

const ONBOARDING_COMPLETE_KEY = "cinemate:onboardingCompleted"
const SELECTED_MOVIES_KEY = "cinemate:selectedMovieIds"
const REQUIRED_SELECTION_COUNT = 5

const popularMovies = [
  { id: "1", title: "기생충", year: "2019", rating: 4.8, genre: "드라마", posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg" },
  { id: "2", title: "올드보이", year: "2003", rating: 4.7, genre: "스릴러", posterUrl: "https://image.tmdb.org/t/p/w500/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg" },
  { id: "3", title: "인터스텔라", year: "2014", rating: 4.9, genre: "SF", posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
  { id: "4", title: "어벤져스: 엔드게임", year: "2019", rating: 4.6, genre: "액션", posterUrl: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg" },
  { id: "5", title: "라라랜드", year: "2016", rating: 4.5, genre: "로맨스", posterUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg" },
  { id: "6", title: "듄", year: "2021", rating: 4.4, genre: "SF", posterUrl: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg" },
  { id: "7", title: "오펜하이머", year: "2023", rating: 4.7, genre: "전기", posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" },
  { id: "8", title: "더 배트맨", year: "2022", rating: 4.3, genre: "액션", posterUrl: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fvez61z2GElSvjIz.jpg" },
  { id: "9", title: "탑건: 매버릭", year: "2022", rating: 4.6, genre: "액션", posterUrl: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg" },
  { id: "10", title: "스파이더맨: 노 웨이 홈", year: "2021", rating: 4.5, genre: "액션", posterUrl: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg" },
  { id: "13", title: "쇼생크 탈출", year: "1994", rating: 4.9, genre: "드라마", posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg" },
  { id: "14", title: "대부", year: "1972", rating: 4.9, genre: "범죄", posterUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([])

  useEffect(() => {
    const onboardingCompleted = window.localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true"
    if (onboardingCompleted) {
      router.replace("/recommend")
      return
    }

    const storedSelections = window.localStorage.getItem(SELECTED_MOVIES_KEY)
    if (storedSelections) {
      try {
        const parsed = JSON.parse(storedSelections)
        if (Array.isArray(parsed)) {
          setSelectedMovieIds(parsed.filter((id): id is string => typeof id === "string"))
        }
      } catch {
        window.localStorage.removeItem(SELECTED_MOVIES_KEY)
      }
    }
  }, [router])

  const selectedMovieSet = new Set(selectedMovieIds)
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

  const handleStart = () => {
    if (!isReadyToStart) {
      return
    }

    window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true")
    window.localStorage.setItem(SELECTED_MOVIES_KEY, JSON.stringify(selectedMovieIds))
    router.push("/recommend")
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 left-[-8rem] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-10">
        <div className="mb-8 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            온보딩
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            좋아하는 영화 5개를 선택해주세요
          </h1>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            선택한 영화들을 바탕으로 맞춤 추천을 준비할게요.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                인기 영화 목록에서 마음에 드는 작품을 골라주세요.
              </p>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
                {selectedCount}/{REQUIRED_SELECTION_COUNT}
              </Badge>
            </div>

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
          </section>

          <aside className="lg:sticky lg:top-8 h-fit">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
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

              <div className="mb-5 min-h-24 rounded-xl border border-dashed border-border bg-background/60 p-4">
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

              <Button
                className="w-full"
                size="lg"
                disabled={!isReadyToStart}
                onClick={handleStart}
              >
                {isReadyToStart ? "시작하기" : "5개를 선택해주세요"}
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
