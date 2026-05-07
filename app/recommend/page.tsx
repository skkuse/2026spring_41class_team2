"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Heart, Users, Film, ChevronRight } from "lucide-react"

interface RecommendedMovie {
  id: string
  title: string
  year: string
  rating: number
  genre: string
  posterUrl: string
  reason: string
}

const tasteMatchMovies: RecommendedMovie[] = [
  {
    id: "1",
    title: "기생충",
    year: "2019",
    rating: 4.8,
    genre: "드라마",
    posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    reason: "",
  },
  {
    id: "2",
    title: "올드보이",
    year: "2003",
    rating: 4.7,
    genre: "스릴러",
    posterUrl: "https://image.tmdb.org/t/p/w500/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg",
    reason: "",
  },
  {
    id: "15",
    title: "다크 나이트",
    year: "2008",
    rating: 4.8,
    genre: "액션",
    posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    reason: "",
  },
  {
    id: "7",
    title: "오펜하이머",
    year: "2023",
    rating: 4.7,
    genre: "전기",
    posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    reason: "",
  },
  {
    id: "13",
    title: "쇼생크 탈출",
    year: "1994",
    rating: 4.9,
    genre: "드라마",
    posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    reason: "",
  },
]

const similarContentMovies: RecommendedMovie[] = [
  {
    id: "3",
    title: "인터스텔라",
    year: "2014",
    rating: 4.9,
    genre: "SF",
    posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    reason: "회원님이 좋아한 기생충과 인간의 본질을 탐구하는 서사가 비슷해요.",
  },
  {
    id: "17",
    title: "펄프 픽션",
    year: "1994",
    rating: 4.7,
    genre: "범죄",
    posterUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    reason: "회원님이 좋아한 올드보이와 비선형 서사 구조가 비슷해요.",
  },
  {
    id: "14",
    title: "대부",
    year: "1972",
    rating: 4.9,
    genre: "범죄",
    posterUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    reason: "회원님이 좋아한 펄프 픽션과 범죄 장르의 깊이가 비슷해요.",
  },
  {
    id: "16",
    title: "반지의 제왕: 왕의 귀환",
    year: "2003",
    rating: 4.8,
    genre: "판타지",
    posterUrl: "https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
    reason: "회원님이 좋아한 인터스텔라와 웅장한 세계관이 비슷해요.",
  },
  {
    id: "18",
    title: "포레스트 검프",
    year: "1994",
    rating: 4.7,
    genre: "드라마",
    posterUrl: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    reason: "회원님이 좋아한 쇼생크 탈출과 삶에 대한 따뜻한 시선이 비슷해요.",
  },
]

function RecommendCard({ movie, hasReason }: { movie: RecommendedMovie; hasReason: boolean }) {
  const [isLiked, setIsLiked] = useState(false)

  return (
    <div className="group relative flex gap-4 rounded-xl bg-card p-4 transition-all duration-200 hover:ring-1 hover:ring-primary/40">
      <Link href={`/movie/${movie.id}`} className="shrink-0">
        <div className="relative h-28 w-20 overflow-hidden rounded-lg bg-muted">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>
      <div className={`flex flex-1 ${hasReason ? "flex-col justify-between" : "flex-col justify-center"}`}>
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link href={`/movie/${movie.id}`}>
              <h3 className="font-semibold leading-tight hover:text-primary transition-colors">{movie.title}</h3>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </Button>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{movie.year}</span>
            <span>|</span>
            <Badge variant="secondary" className="text-xs px-1.5 py-0">{movie.genre}</Badge>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span className="text-sm font-medium text-primary">{movie.rating.toFixed(1)}</span>
          </div>
        </div>
        {hasReason && (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-2">
            {movie.reason}
          </p>
        )}
      </div>
    </div>
  )
}

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export default function RecommendPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>홈</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">맞춤 추천</span>
          </div>
          <h1 className="text-3xl font-bold text-balance">맞춤 추천</h1>
          <p className="mt-2 text-muted-foreground">회원님의 취향을 분석해 엄선한 영화들이에요.</p>
        </div>

        <div className="grid gap-12">
          {/* Section 1: 비슷한 취향 사람들의 추천 */}
          <section>
            <SectionHeader
              icon={<Users className="h-5 w-5" />}
              title="취향이 비슷한 사람들이 좋아한 영화"
              description="나와 비슷한 감상 패턴을 가진 사용자들이 높게 평가한 작품들이에요."
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {tasteMatchMovies.map((movie) => (
                <RecommendCard key={movie.id} movie={movie} hasReason={false} />
              ))}
            </div>
          </section>

          {/* Section 2: 본 영화와 유사한 영화 */}
          <section>
            <SectionHeader
              icon={<Film className="h-5 w-5" />}
              title="이미 본 영화와 유사한 영화"
              description="회원님이 감상한 영화의 내용, 분위기, 장르를 바탕으로 추천한 작품들이에요."
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {similarContentMovies.map((movie) => (
                <RecommendCard key={movie.id} movie={movie} hasReason={true} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
