"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Star, Heart, Clock, Calendar, Globe, Play, MessageCircle, ThumbsUp } from "lucide-react"
import Link from "next/link"
import { useState, use } from "react"

const movieData: Record<string, {
  title: string
  originalTitle: string
  year: string
  rating: number
  genre: string[]
  runtime: string
  country: string
  director: string
  cast: string[]
  actors?: { name: string; character: string }[]
  synopsis: string
  posterUrl: string
  reviews: { id: string; user: string; rating: number; content: string; date: string; likes: number }[]
}> = {
  "1": {
    title: "기생충",
    originalTitle: "Parasite",
    year: "2019",
    rating: 4.8,
    genre: ["드라마", "스릴러", "코미디"],
    runtime: "132분",
    country: "한국",
    director: "봉준호",
    cast: ["송강호", "이선균", "조여정", "최우식", "박소담"],
    actors: [
      { name: "송강호", character: "기택" },
      { name: "이선균", character: "박 사장" },
    ],
    synopsis: "전원 백수로 살 길 막막하지만 사이는 좋은 기택 가족. 장남 기우에게 명문대생 친구가 과외 자리를 소개해준다. 고액 과외로 적잖은 수입을 올리게 된 기우는 온 가족의 운명을 바꿀 계획을 세우는데...",
    posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    reviews: [
      { id: "r1", user: "영화광", rating: 5, content: "봉준호 감독의 역작. 계층간의 갈등을 유머와 스릴러로 풀어낸 걸작입니다.", date: "2024-01-15", likes: 234 },
      { id: "r2", user: "시네필", rating: 4.5, content: "사회적 메시지와 오락성을 모두 잡은 완벽한 영화. 칸 황금종려상이 아깝지 않습니다.", date: "2024-01-10", likes: 156 },
      { id: "r3", user: "무비러버", rating: 5, content: "몇 번을 봐도 새로운 디테일을 발견하게 되는 영화. 연기, 연출, 음악 모두 완벽합니다.", date: "2024-01-05", likes: 89 },
    ]
  },
  "2": {
    title: "라라랜드",
    originalTitle: "La La Land",
    year: "2016",
    rating: 4.7,
    genre: ["뮤지컬", "로맨스", "드라마"],
    runtime: "128분",
    country: "미국",
    director: "데이미언 셔젤",
    cast: ["엠마 스톤", "라이언 고슬링", "존 레전드"],
    actors: [
      { name: "엠마 스톤", character: "미아" },
      { name: "라이언 고슬링", character: "세바스찬" },
    ],
    synopsis: "꿈을 쫓는 재즈 뮤지션 세바스찬과 배우 지망생 미아가 LA에서 만나 사랑에 빠지지만, 각자의 꿈을 향해 나아가면서 사랑과 꿈 사이의 갈림길에 서게 된다.",
    posterUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
    reviews: [
      { id: "r6", user: "뮤지컬팬", rating: 5, content: "음악과 영상미가 완벽한 현대판 뮤지컬 걸작. 엠마 스톤의 연기가 압도적입니다.", date: "2024-03-01", likes: 198 },
      { id: "r7", user: "로맨스러버", rating: 4.5, content: "꿈과 사랑 사이의 갈등을 아름답게 그려낸 영화. 결말이 너무 인상적이에요.", date: "2024-02-15", likes: 143 },
    ]
  },
  "3": {
    title: "인터스텔라",
    originalTitle: "Interstellar",
    year: "2014",
    rating: 4.9,
    genre: ["SF", "드라마", "모험"],
    runtime: "169분",
    country: "미국",
    director: "크리스토퍼 놀란",
    cast: ["매튜 맥커너히", "앤 해서웨이", "제시카 차스테인", "마이클 케인"],
    actors: [
      { name: "매튜 맥커너히", character: "쿠퍼" },
      { name: "앤 해서웨이", character: "브랜드 박사" },
    ],
    synopsis: "세계 각국의 정부와 경제가 완전히 붕괴된 미래가 다가온다. 지난 20세기에 범한 잘못이 전 세계적인 식량 부족을 불러왔고, NASA도 해체되었다. 이때 시공간에 불가사의한 틈이 열리고, 남은 자들에게는 이 틈을 탐험해 인류를 구해야 하는 임무가 주어진다.",
    posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    reviews: [
      { id: "r4", user: "SF팬", rating: 5, content: "과학적 고증과 감동적인 스토리의 완벽한 조합. 한스 짐머의 음악이 영화를 더욱 빛나게 합니다.", date: "2024-02-01", likes: 312 },
      { id: "r5", user: "놀란빠", rating: 5, content: "놀란 감독 최고의 작품. 우주의 광활함과 인간의 사랑을 동시에 담아낸 걸작.", date: "2024-01-28", likes: 278 },
    ]
  },
  "4": {
    title: "다크 나이트",
    originalTitle: "The Dark Knight",
    year: "2008",
    rating: 4.9,
    genre: ["액션", "범죄", "드라마"],
    runtime: "152분",
    country: "미국",
    director: "크리스토퍼 놀란",
    cast: ["크리스천 베일", "히스 레저", "아론 에크하트", "마이클 케인"],
    actors: [
      { name: "크리스천 베일", character: "배트맨" },
      { name: "히스 레저", character: "조커" },
    ],
    synopsis: "고담시의 영웅 배트맨은 검사 하비 덴트와 함께 범죄 조직을 소탕하려 하지만, 조커라는 이름의 악당이 나타나 고담을 혼돈으로 몰아넣는다.",
    posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    reviews: [
      { id: "r8", user: "DC팬", rating: 5, content: "히스 레저의 조커는 영화사에 길이 남을 연기. 슈퍼히어로 영화의 새로운 지평을 열었습니다.", date: "2024-03-10", likes: 421 },
      { id: "r9", user: "놀란마니아", rating: 5, content: "선과 악, 혼돈과 질서에 대한 철학적 질문을 던지는 완벽한 영화.", date: "2024-03-05", likes: 287 },
    ]
  },
  "5": {
    title: "쇼생크 탈출",
    originalTitle: "The Shawshank Redemption",
    year: "1994",
    rating: 5.0,
    genre: ["드라마"],
    runtime: "142분",
    country: "미국",
    director: "프랭크 다라본트",
    cast: ["팀 로빈스", "모건 프리먼", "밥 건튼", "윌리엄 새들러"],
    actors: [
      { name: "팀 로빈스", character: "앤디 듀프레인" },
      { name: "모건 프리먼", character: "레드" },
    ],
    synopsis: "억울하게 종신형을 선고받고 쇼생크 교도소에 수감된 앤디 듀프레인이 20여 년에 걸쳐 희망을 잃지 않고 자유를 향해 나아가는 이야기.",
    posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    reviews: [
      { id: "r10", user: "영화마니아", rating: 5, content: "희망과 자유에 대한 가장 아름다운 이야기. 모건 프리먼의 내레이션이 영화를 완성시킵니다.", date: "2024-04-01", likes: 534 },
      { id: "r11", user: "클래식무비", rating: 5, content: "시대를 초월하는 명작. 볼 때마다 새로운 감동을 줍니다.", date: "2024-03-20", likes: 312 },
    ]
  }
}

const defaultMovie = {
  title: "영화 제목",
  originalTitle: "Movie Title",
  year: "2024",
  rating: 4.5,
  genre: ["드라마"],
  runtime: "120분",
  country: "한국",
  director: "감독명",
  cast: ["배우1", "배우2", "배우3"],
  synopsis: "영화 시놉시스가 여기에 표시됩니다.",
  posterUrl: "",
  reviews: []
}

const similarMovies = [
  { id: "2", title: "올드보이", posterUrl: "https://image.tmdb.org/t/p/w500/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg" },
  { id: "13", title: "쇼생크 탈출", posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg" },
  { id: "15", title: "다크 나이트", posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
  { id: "17", title: "펄프 픽션", posterUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg" },
]

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const movie = movieData[id] || defaultMovie
  const [isLiked, setIsLiked] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [reviewText, setReviewText] = useState("")

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section with Poster */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        {movie.posterUrl && (
          <div className="absolute inset-0 opacity-20">
            <img src={movie.posterUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        
        <div className="container relative mx-auto px-4 py-12">
          <div className="flex flex-col gap-8 md:flex-row">
            {/* Poster */}
            <div className="shrink-0">
              <div className="relative w-64 overflow-hidden rounded-xl shadow-2xl md:w-80">
                {movie.posterUrl ? (
                  <img src={movie.posterUrl} alt={movie.title} className="aspect-[2/3] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[2/3] w-full items-center justify-center bg-secondary">
                    <span className="text-6xl font-bold text-muted-foreground">{movie.title.charAt(0)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {movie.genre.map((g) => (
                  <Badge key={g} variant="secondary">{g}</Badge>
                ))}
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">{movie.title}</h1>
              <p className="mt-2 text-lg text-muted-foreground">{movie.originalTitle}</p>
              
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{movie.year}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{movie.runtime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <span>{movie.country}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-8 w-8 fill-primary text-primary" />
                  <div>
                    <span className="text-3xl font-bold">{movie.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground"> / 5</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {movie.reviews.length}개의 리뷰
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg">
                  <Play className="mr-2 h-5 w-5" />
                  예고편 보기
                </Button>
                <Button variant="outline" size="lg" onClick={() => setIsLiked(!isLiked)}>
                  <Heart className={`mr-2 h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                  찜하기
                </Button>
                <Link href={`/chat?q=${encodeURIComponent(`${movie.title}과 비슷한 영화 추천해줘`)}`}>
                  <Button variant="secondary" size="lg">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    비슷한 영화 질문하기
                  </Button>
                </Link>
              </div>

              <div className="mt-8">
                <h2 className="text-lg font-semibold">줄거리</h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">{movie.synopsis}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cast & Crew */}
      <section className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold">감독</h2>
              <p className="mt-2 text-muted-foreground">{movie.director}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold">출연</h2>
              <p className="mt-2 text-muted-foreground">{movie.cast.join(", ")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Actor Recommendation */}
      {movie.actors && movie.actors.length > 0 && (
        <section className="border-t border-border py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-semibold">배우 추천</h2>
            <div className="mt-6 flex flex-col gap-3">
              {movie.actors.map((actor, idx) => (
                <Link key={idx} href={`/chat?q=${encodeURIComponent(`${actor.name}이 등장한 영화 추천해줘`)}`}>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <div>
                      <p className="font-medium">{actor.name}</p>
                      <p className="text-xs text-muted-foreground">이 영화에서: {actor.character}</p>
                    </div>
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Write Review */}
      <section className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold">리뷰 작성</h2>
          <div className="mt-6 rounded-xl bg-card p-6">
            <div className="mb-4">
              <span className="text-sm text-muted-foreground">평점을 선택하세요</span>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setUserRating(star)}>
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= userRating ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="이 영화에 대한 감상을 남겨주세요..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="min-h-32"
            />
            <Button className="mt-4">리뷰 등록</Button>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold">사용자 리뷰</h2>
          <div className="mt-6 space-y-4">
            {movie.reviews.length > 0 ? (
              movie.reviews.map((review) => (
                <div key={review.id} className="rounded-xl bg-card p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                        <span className="font-medium">{review.user.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{review.user}</p>
                        <p className="text-sm text-muted-foreground">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-medium">{review.rating}</span>
                    </div>
                  </div>
                  <p className="mt-4 text-muted-foreground">{review.content}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <ThumbsUp className="mr-1 h-4 w-4" />
                      {review.likes}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-card p-8 text-center">
                <p className="text-muted-foreground">아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Similar Movies */}
      <section className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold">비슷한 영화</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {similarMovies.map((m) => (
              <Link key={m.id} href={`/movie/${m.id}`} className="group">
                <div className="overflow-hidden rounded-xl">
                  <img
                    src={m.posterUrl}
                    alt={m.title}
                    className="aspect-[2/3] w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 font-medium">{m.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
