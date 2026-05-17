"use client"

import { Header } from "@/components/header"
import { ProtectedPage } from "@/components/auth/protected-page"
import { Button } from "@/components/ui/button"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Heart, Edit, ChevronRight } from "lucide-react"
import Link from "next/link"


const likedMovies = [
  { id: "3", title: "인터스텔라", year: "2014", posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
  { id: "13", title: "쇼생크 탈출", year: "1994", posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg" },
  { id: "6", title: "듄", year: "2021", posterUrl: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg" },
]

const myReviews = [
  { id: "r1", movieId: "1", movieTitle: "기생충", posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", rating: 5, content: "봉준호 감독의 천재적인 연출력이 돋보이는 작품. 사회적 메시지와 오락성을 모두 잡은 걸작입니다.", date: "2024-01-15", likes: 45 },
  { id: "r2", movieId: "3", movieTitle: "인터스텔라", posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", rating: 5, content: "우주와 시간, 그리고 사랑에 대한 깊은 이야기. 한스 짐머의 음악이 영화를 더욱 빛나게 합니다.", date: "2024-01-10", likes: 32 },
  { id: "r3", movieId: "15", movieTitle: "다크 나이트", posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", rating: 4, content: "히스 레저의 조커 연기가 압도적. 슈퍼히어로 영화의 새로운 기준을 제시했습니다.", date: "2024-01-05", likes: 28 },
]


export default function MyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ProtectedPage>
      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
            U
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold">사용자님</h1>
            <p className="mt-1 text-muted-foreground">user@example.com</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 md:justify-start">
              <div className="text-center">
                <p className="text-2xl font-bold">{likedMovies.length}</p>
                <p className="text-sm text-muted-foreground">찜한 영화</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{myReviews.length}</p>
                <p className="text-sm text-muted-foreground">작성한 리뷰</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="mr-1 h-4 w-4" />
              프로필 수정
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="liked" className="mt-8">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="liked" className="gap-2">
              <Heart className="h-4 w-4" />
              찜한 영화
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <Star className="h-4 w-4" />
              내 리뷰
            </TabsTrigger>
          </TabsList>

          <TabsContent value="liked" className="mt-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {likedMovies.map((movie) => (
                <Link key={movie.id} href={`/movie/${movie.id}`} className="group">
                  <div className="relative overflow-hidden rounded-xl">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="aspect-[2/3] w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute right-2 top-2">
                      <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                    </div>
                  </div>
                  <h3 className="mt-2 font-medium line-clamp-1">{movie.title}</h3>
                  <p className="text-sm text-muted-foreground">{movie.year}</p>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-4">
              {myReviews.map((review) => (
                <Link key={review.id} href={`/movie/${review.movieId}`}>
                  <Card className="transition-colors hover:bg-secondary/30">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Poster */}
                        <div className="flex-shrink-0">
                          <img
                            src={review.posterUrl}
                            alt={review.movieTitle}
                            className="h-24 w-16 rounded-lg object-cover"
                          />
                        </div>
                        {/* Review Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{review.movieTitle}</h3>
                              <div className="mt-1 flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{review.content}</p>
                          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{review.date}</span>
                            <span>좋아요 {review.likes}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      </ProtectedPage>
    </div>
  )
}
