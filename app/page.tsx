import { Header } from "@/components/header"
import { MovieSection } from "@/components/movie-section"
import { ChatPreview } from "@/components/chat-preview"
import { Button } from "@/components/ui/button"
import { Search, TrendingUp, Star, Clock, Film } from "lucide-react"
import Link from "next/link"
import { createOptionalRequestContext } from "@/server/auth/request-context"
import { movieService } from "@/server/movies"
import { mapMovieCardToView } from "@/lib/movies/movie-view"

export default async function HomePage() {
  const context = await createOptionalRequestContext()
  const [popularMovies, topRatedMovies] = await Promise.all([
    movieService.listMovies(context, { sort: "popular", page: 1, size: 6 }),
    movieService.listMovies(context, { sort: "rating", page: 1, size: 6 }),
  ])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-background" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              당신만의 영화를
              <br />
              <span className="text-primary">발견하세요</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              AI 기반 개인화 추천과 대화형 검색으로 
              취향에 꼭 맞는 영화를 찾아보세요.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/chat" className="w-full sm:w-auto">
                <Button size="lg" className="w-full">
                  AI와 대화하기
                </Button>
              </Link>
              <Link href="/search" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  영화 탐색
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-start gap-4 rounded-xl bg-card p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">리뷰 기반 개인화</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  평점과 리뷰를 분석해 정교한 맞춤 추천을 제공합니다.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl bg-card p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">대화형 검색</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  자연어로 질문하고 AI가 원하는 영화를 찾아드립니다.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl bg-card p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">연속 대화 탐색</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  대화를 이어가며 조건을 좁혀 원하는 영화를 발견하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4">
        <MovieSection
          title="인기 영화"
          description="지금 가장 많이 찾는 영화들"
          movies={popularMovies.movies.map(mapMovieCardToView)}
          href="/search?sort=popular"
        />

        <ChatPreview />

        <MovieSection
          title="최고 평점"
          description="역대 최고의 평가를 받은 명작들"
          movies={topRatedMovies.movies.map(mapMovieCardToView)}
          href="/search?sort=rating"
        />
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                {/*<span className="text-sm font-bold text-primary-foreground">S</span>*/}
                <Film className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">씨네메이트</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            </nav>
            <p className="text-sm text-muted-foreground">
              2026 씨네메이트. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
