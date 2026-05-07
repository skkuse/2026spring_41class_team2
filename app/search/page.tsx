"use client"

import { Header } from "@/components/header"
import { MovieCard } from "@/components/movie-card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState } from "react"

const allMovies = [
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
  { id: "15", title: "다크 나이트", year: "2008", rating: 4.8, genre: "액션", posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
  { id: "16", title: "반지의 제왕: 왕의 귀환", year: "2003", rating: 4.8, genre: "판타지", posterUrl: "https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg" },
  { id: "17", title: "펄프 픽션", year: "1994", rating: 4.7, genre: "범죄", posterUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg" },
  { id: "18", title: "포레스트 검프", year: "1994", rating: 4.7, genre: "드라마", posterUrl: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg" },
]

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMovies = allMovies.filter((movie) => {
    return movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">영화 탐색</h1>
          <p className="mt-2 text-muted-foreground">원하는 영화를 검색하세요</p>
        </div>

        {/* Search Bar */}
        <div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="영화 제목 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Results */}
        <div className="mt-8">
          <p className="mb-4 text-sm text-muted-foreground">
            {filteredMovies.length}개의 영화
          </p>
          {filteredMovies.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredMovies.map((movie) => (
                <MovieCard key={movie.id} {...movie} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-card p-12 text-center">
              <p className="text-lg font-medium">검색 결과가 없습니다</p>
              <p className="mt-2 text-muted-foreground">다른 검색어를 시도해보세요</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
