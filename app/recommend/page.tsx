"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { MovieCard } from "@/components/movie-card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles } from "lucide-react"

const ONBOARDING_COMPLETE_KEY = "cinemate:onboardingCompleted"

interface RecommendationMovie {
  id: string
  title: string
  year: string
  rating: number
  genre: string
  posterUrl: string
  reason: string
}

interface RecommendationSection {
  title: string
  seedTitle: string
  movies: RecommendationMovie[]
}

const recommendationSections: RecommendationSection[] = [
  {
    seedTitle: "매트릭스",
    title: "매트릭스를 좋아한 사람들이 함께 좋아한 영화",
    movies: [
      {
        id: "3",
        title: "인터스텔라",
        year: "2014",
        rating: 4.9,
        genre: "SF",
        posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        reason: "매트릭스를 좋아한 사람들이 함께 높게 평가했어요.",
      },
      {
        id: "15",
        title: "다크 나이트",
        year: "2008",
        rating: 4.8,
        genre: "액션",
        posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        reason: "매트릭스를 좋아한 사람들이 함께 높게 평가했어요.",
      },
      {
        id: "16",
        title: "반지의 제왕: 왕의 귀환",
        year: "2003",
        rating: 4.8,
        genre: "판타지",
        posterUrl: "https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
        reason: "매트릭스를 좋아한 사람들이 함께 높게 평가했어요.",
      },
      {
        id: "9",
        title: "탑건: 매버릭",
        year: "2022",
        rating: 4.6,
        genre: "액션",
        posterUrl: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
        reason: "매트릭스를 좋아한 사람들이 함께 높게 평가했어요.",
      },
    ],
  },
  {
    seedTitle: "기생충",
    title: "기생충을 좋아한 사람들이 함께 좋아한 영화",
    movies: [
      {
        id: "13",
        title: "쇼생크 탈출",
        year: "1994",
        rating: 4.9,
        genre: "드라마",
        posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
        reason: "기생충을 좋아한 사람들이 함께 높게 평가했어요.",
      },
      {
        id: "14",
        title: "대부",
        year: "1972",
        rating: 4.9,
        genre: "범죄",
        posterUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
        reason: "기생충을 좋아한 사람들이 함께 높게 평가했어요.",
      },
      {
        id: "17",
        title: "펄프 픽션",
        year: "1994",
        rating: 4.7,
        genre: "범죄",
        posterUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
        reason: "기생충을 좋아한 사람들이 함께 높게 평가했어요.",
      },
      {
        id: "18",
        title: "포레스트 검프",
        year: "1994",
        rating: 4.7,
        genre: "드라마",
        posterUrl: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
        reason: "기생충을 좋아한 사람들이 함께 높게 평가했어요.",
      },
    ],
  },
  {
    seedTitle: "인터스텔라",
    title: "인터스텔라를 좋아한 사람들이 함께 좋아한 영화",
    movies: [
      {
        id: "1",
        title: "기생충",
        year: "2019",
        rating: 4.8,
        genre: "드라마",
        posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
        reason: "인터스텔라를 좋아한 사람들이 함께 높게 평가했어요.",
      },
      {
        id: "4",
        title: "어벤져스: 엔드게임",
        year: "2019",
        rating: 4.6,
        genre: "액션",
        posterUrl: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
        reason: "인터스텔라를 좋아한 사람들이 함께 높게 평가했어요.",
      },
      {
        id: "5",
        title: "라라랜드",
        year: "2016",
        rating: 4.5,
        genre: "로맨스",
        posterUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
        reason: "인터스텔라를 좋아한 사람들이 함께 높게 평가했어요.",
      },
      {
        id: "6",
        title: "듄",
        year: "2021",
        rating: 4.4,
        genre: "SF",
        posterUrl: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
        reason: "인터스텔라를 좋아한 사람들이 함께 높게 평가했어요.",
      },
    ],
  },
]

function RecommendationCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-card">
      <Skeleton className="aspect-[2/3] w-full rounded-none" />
      <div className="space-y-2 p-2.5">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-7 w-full" />
      </div>
    </div>
  )
}

export default function RecommendPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    const onboardingCompleted = window.localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true"
    if (!onboardingCompleted) {
      router.replace("/onboarding")
      return
    }

    setIsAllowed(true)
    const timer = window.setTimeout(() => {
      setLoading(false)
    }, 650)

    return () => window.clearTimeout(timer)
  }, [router])

  if (!isAllowed) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-10 max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            맞춤 추천
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">추천 영화</h1>
          <p className="mt-3 text-muted-foreground">
            선택한 영화 취향을 바탕으로 섹션별 추천을 보여드려요.
          </p>
        </div>

        <div className="grid gap-12">
          {recommendationSections.map((section, sectionIndex) => (
            <section key={section.title}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold md:text-2xl">{section.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {section.seedTitle} 기반 추천
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  섹션 {sectionIndex + 1}
                </Badge>
              </div>

              {loading ? (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <RecommendationCardSkeleton key={index} />
                  ))}
                </div>
              ) : section.movies.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
                  {section.movies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      {...movie}
                      reason={movie.reason}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                  <p className="text-base font-medium">추천 결과가 없어요.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    다른 영화 조합으로 다시 확인해보세요.
                  </p>
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
