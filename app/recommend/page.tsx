"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { ProtectedPage } from "@/components/auth/protected-page"
import { MovieCard } from "@/components/movie-card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles } from "lucide-react"
import {
  getItemCfRecommendations,
  ItemCfRecommendationsApiError,
  type ItemCfRecommendationSection,
  type ItemCfRecommendedMovie,
} from "@/lib/recommendations/item-cf-client"

interface RecommendationMovie {
  id: string
  title: string
  year: string
  rating: number
  genre: string
  posterUrl: string | null
  isBookmarked: boolean
}

interface RecommendationSection {
  title: string
  seedTitle: string
  movies: RecommendationMovie[]
}

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
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<RecommendationSection[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadRecommendations() {
      try {
        setErrorMessage(null)
        const response = await getItemCfRecommendations()
        if (!cancelled) {
          setSections(response.sections.map(mapRecommendationSection))
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        if (error instanceof ItemCfRecommendationsApiError) {
          if (error.isUnauthorized) {
            router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`)
            return
          }

          if (error.isOnboardingRequired) {
            router.replace("/onboarding")
            return
          }
        }

        setErrorMessage("추천 영화를 불러오지 못했습니다.")
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadRecommendations()

    return () => {
      cancelled = true
    }
  }, [pathname, router])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ProtectedPage requireOnboardingCompleted>
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

        {errorMessage && (
          <Alert variant="destructive" className="mb-8">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-12">
          {loading ? (
            Array.from({ length: 3 }).map((_, sectionIndex) => (
              <section key={sectionIndex}>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="w-full max-w-xl space-y-2">
                    <Skeleton className="h-7 w-3/4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-7 w-16 rounded-full" />
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
                  {Array.from({ length: 4 }).map((__, index) => (
                    <RecommendationCardSkeleton key={index} />
                  ))}
                </div>
              </section>
            ))
          ) : sections.length > 0 ? (
            sections.map((section, sectionIndex) => (
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

              {section.movies.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
                  {section.movies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      {...movie}
                      isBookmarked={movie.isBookmarked}
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
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-base font-medium">추천 결과가 없어요.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                선호 영화 데이터를 바탕으로 추천을 준비하고 있어요.
              </p>
            </div>
          )}
        </div>
      </main>
      </ProtectedPage>
    </div>
  )
}

function mapRecommendationSection(section: ItemCfRecommendationSection): RecommendationSection {
  return {
    title: section.title,
    seedTitle: section.seedMovie.title,
    movies: section.movies.map(mapRecommendationMovie),
  }
}

function mapRecommendationMovie(movie: ItemCfRecommendedMovie): RecommendationMovie {
  return {
    id: String(movie.id),
    title: movie.title,
    year: movie.year?.toString() ?? "연도 미상",
    rating: movie.rating,
    genre: movie.genres.map((genre) => genre.name).join(", ") || "장르 미상",
    posterUrl: movie.posterUrl,
    isBookmarked: movie.isBookmarked,
  }
}
