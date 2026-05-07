import { Header } from "@/components/header"
import { MovieSection } from "@/components/movie-section"
import { ChatPreview } from "@/components/chat-preview"
import { Button } from "@/components/ui/button"
import { Search, TrendingUp, Star, Clock } from "lucide-react"
import Link from "next/link"

const popularMovies = [
  { id: "1", title: "기생충", year: "2019", rating: 4.8, genre: "드라마", posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg" },
  { id: "2", title: "올드보이", year: "2003", rating: 4.7, genre: "스릴러", posterUrl: "https://image.tmdb.org/t/p/w500/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg" },
  { id: "3", title: "인터스텔라", year: "2014", rating: 4.9, genre: "SF", posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
  { id: "4", title: "어벤져스: 엔드게임", year: "2019", rating: 4.6, genre: "액션", posterUrl: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg" },
  { id: "5", title: "라라랜드", year: "2016", rating: 4.5, genre: "로맨스", posterUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg" },
  { id: "6", title: "듄", year: "2021", rating: 4.4, genre: "SF", posterUrl: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg" },
]

const recentMovies = [
  { id: "7", title: "오펜하이머", year: "2023", rating: 4.7, genre: "전기", posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" },
  { id: "8", title: "더 배트맨", year: "2022", rating: 4.3, genre: "액션", posterUrl: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fvez61z2GElSvjIz.jpg" },
  { id: "9", title: "탑건: 매버릭", year: "2022", rating: 4.6, genre: "액션", posterUrl: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg" },
  { id: "10", title: "스파이더맨: 노 웨이 홈", year: "2021", rating: 4.5, genre: "액션", posterUrl: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg" },
  { id: "11", title: "에브리씽 에브리웨어 올 앳 원스", year: "2022", rating: 4.4, genre: "SF", posterUrl: "https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg" },
  { id: "12", title: "범죄도시 3", year: "2023", rating: 4.2, genre: "액션", posterUrl: "https://image.tmdb.org/t/p/w500/lW6IHrtaATxDKYVYoQGU5sh0OVm.jpg" },
]

const topRatedMovies = [
  { id: "13", title: "쇼생크 탈출", year: "1994", rating: 4.9, genre: "드라마", posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg" },
  { id: "14", title: "대부", year: "1972", rating: 4.9, genre: "범죄", posterUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg" },
  { id: "15", title: "다크 나이트", year: "2008", rating: 4.8, genre: "액션", posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
  { id: "16", title: "반지의 제왕: 왕의 귀환", year: "2003", rating: 4.8, genre: "판타지", posterUrl: "https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg" },
  { id: "17", title: "펄프 픽션", year: "1994", rating: 4.7, genre: "범죄", posterUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg" },
  { id: "18", title: "포레스트 검프", year: "1994", rating: 4.7, genre: "드라마", posterUrl: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
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
          movies={popularMovies}
          href="/search?sort=popular"
        />

        <ChatPreview />

        <MovieSection
          title="최신 영화"
          description="새로 개봉한 작품들"
          movies={recentMovies}
          href="/search?sort=recent"
        />

        <MovieSection
          title="최고 평점"
          description="역대 최고의 평가를 받은 명작들"
          movies={topRatedMovies}
          href="/search?sort=rating"
        />
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-xl font-bold">씨네메이트</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            </nav>
            <p className="text-sm text-muted-foreground">
              2024 씨네메이트. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
