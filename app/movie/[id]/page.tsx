"use client"

import { Header } from "@/components/header"
import { MovieCard } from "@/components/movie-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Star, Heart, Clock, Calendar, Globe, Play, MessageCircle, ThumbsUp } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useState, use } from "react"
import { BookmarkedMoviesApiError, toggleMovieBookmark } from "@/lib/bookmarks/bookmarked-movies-client"
import {
  ReviewsApiError,
  createMovieReview,
  getMovieReviews,
  toggleReviewLike,
  type MovieReview,
} from "@/lib/reviews/reviews-client"
import { getSimilarMovies } from "@/lib/movies/similar-movies-client"
import { mapMovieCardToView, type MovieCardView } from "@/lib/movies/movie-view"

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
  synopsis: string
  posterUrl: string
  backdropUrl?: string | null
  trailerUrl?: string | null
  reviewCount: number
  isBookmarked?: boolean
  reviews: DisplayReview[]
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
    synopsis: "전원 백수로 살 길 막막하지만 사이는 좋은 기택 가족. 장남 기우에게 명문대생 친구가 과외 자리를 소개해준다. 고액 과외로 적잖은 수입을 올리게 된 기우는 온 가족의 운명을 바꿀 계획을 세우는데...",
    posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    reviewCount: 3,
    reviews: [
      { id: "r1", user: "영화광", rating: 5, content: "봉준호 감독의 역작. 계층간의 갈등을 유머와 스릴러로 풀어낸 걸작입니다.", date: "2024-01-15", likes: 234, isLiked: false },
      { id: "r2", user: "시네필", rating: 4.5, content: "사회적 메시지와 오락성을 모두 잡은 완벽한 영화. 칸 황금종려상이 아깝지 않습니다.", date: "2024-01-10", likes: 156, isLiked: false },
      { id: "r3", user: "무비러버", rating: 5, content: "몇 번을 봐도 새로운 디테일을 발견하게 되는 영화. 연기, 연출, 음악 모두 완벽합니다.", date: "2024-01-05", likes: 89, isLiked: false },
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
    synopsis: "꿈을 쫓는 재즈 뮤지션 세바스찬과 배우 지망생 미아가 LA에서 만나 사랑에 빠지지만, 각자의 꿈을 향해 나아가면서 사랑과 꿈 사이의 갈림길에 서게 된다.",
    posterUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
    reviewCount: 2,
    reviews: [
      { id: "r6", user: "뮤지컬팬", rating: 5, content: "음악과 영상미가 완벽한 현대판 뮤지컬 걸작. 엠마 스톤의 연기가 압도적입니다.", date: "2024-03-01", likes: 198, isLiked: false },
      { id: "r7", user: "로맨스러버", rating: 4.5, content: "꿈과 사랑 사이의 갈등을 아름답게 그려낸 영화. 결말이 너무 인상적이에요.", date: "2024-02-15", likes: 143, isLiked: false },
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
    synopsis: "세계 각국의 정부와 경제가 완전히 붕괴된 미래가 다가온다. 지난 20세기에 범한 잘못이 전 세계적인 식량 부족을 불러왔고, NASA도 해체되었다. 이때 시공간에 불가사의한 틈이 열리고, 남은 자들에게는 이 틈을 탐험해 인류를 구해야 하는 임무가 주어진다.",
    posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    reviewCount: 2,
    reviews: [
      { id: "r4", user: "SF팬", rating: 5, content: "과학적 고증과 감동적인 스토리의 완벽한 조합. 한스 짐머의 음악이 영화를 더욱 빛나게 합니다.", date: "2024-02-01", likes: 312, isLiked: false },
      { id: "r5", user: "놀란빠", rating: 5, content: "놀란 감독 최고의 작품. 우주의 광활함과 인간의 사랑을 동시에 담아낸 걸작.", date: "2024-01-28", likes: 278, isLiked: false },
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
    synopsis: "고담시의 영웅 배트맨은 검사 하비 덴트와 함께 범죄 조직을 소탕하려 하지만, 조커라는 이름의 악당이 나타나 고담을 혼돈으로 몰아넣는다.",
    posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    reviewCount: 2,
    reviews: [
      { id: "r8", user: "DC팬", rating: 5, content: "히스 레저의 조커는 영화사에 길이 남을 연기. 슈퍼히어로 영화의 새로운 지평을 열었습니다.", date: "2024-03-10", likes: 421, isLiked: false },
      { id: "r9", user: "놀란마니아", rating: 5, content: "선과 악, 혼돈과 질서에 대한 철학적 질문을 던지는 완벽한 영화.", date: "2024-03-05", likes: 287, isLiked: false },
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
    synopsis: "억울하게 종신형을 선고받고 쇼생크 교도소에 수감된 앤디 듀프레인이 20여 년에 걸쳐 희망을 잃지 않고 자유를 향해 나아가는 이야기.",
    posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    reviewCount: 2,
    reviews: [
      { id: "r10", user: "영화마니아", rating: 5, content: "희망과 자유에 대한 가장 아름다운 이야기. 모건 프리먼의 내레이션이 영화를 완성시킵니다.", date: "2024-04-01", likes: 534, isLiked: false },
      { id: "r11", user: "클래식무비", rating: 5, content: "시대를 초월하는 명작. 볼 때마다 새로운 감동을 줍니다.", date: "2024-03-20", likes: 312, isLiked: false },
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
  backdropUrl: null,
  trailerUrl: null,
  reviewCount: 0,
  isBookmarked: false,
  reviews: []
}

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const pathname = usePathname()
  const [movie, setMovie] = useState(movieData[id] || defaultMovie)
  const [isLiked, setIsLiked] = useState(false)
  const [bookmarkPending, setBookmarkPending] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewFormError, setReviewFormError] = useState<string | null>(null)
  const [reviewListError, setReviewListError] = useState<string | null>(null)
  const [likePendingReviewId, setLikePendingReviewId] = useState<string | null>(null)
  const [similarMovieViews, setSimilarMovieViews] = useState<MovieCardView[]>([])
  const [similarMoviesLoading, setSimilarMoviesLoading] = useState(true)
  const [similarMoviesError, setSimilarMoviesError] = useState<string | null>(null)

  const movieId = Number(id)

  const loadMovie = useCallback(async (cancelled?: () => boolean) => {
    try {
      const response = await fetch(`/api/movies/${id}`, { cache: "no-store" })
      if (!response.ok) {
        return
      }

      const data = await response.json()
      if (cancelled?.()) {
        return
      }

      const nextMovie = mapMovieDetailResponse(data.movie)
      setMovie((current) => ({ ...nextMovie, reviews: current.reviews }))
      setIsLiked(nextMovie.isBookmarked ?? false)
    } catch {
      // Keep the local fallback while the movie detail API is unavailable.
    }
  }, [id])

  const loadReviews = useCallback(async (cancelled?: () => boolean) => {
    if (!Number.isInteger(movieId) || movieId <= 0) {
      setReviewsLoading(false)
      return
    }

    setReviewsLoading(true)
    setReviewListError(null)

    try {
      const response = await getMovieReviews({ movieId, page: 1, size: 20, sort: "latest" })
      if (!cancelled?.()) {
        setMovie((current) => ({
          ...current,
          reviews: response.reviews.map(mapReview),
          reviewCount: response.totalCount,
        }))
      }
    } catch {
      if (!cancelled?.()) {
        setReviewListError("리뷰 목록을 불러오지 못했습니다.")
      }
    } finally {
      if (!cancelled?.()) {
        setReviewsLoading(false)
      }
    }
  }, [movieId])

  const loadSimilarMovies = useCallback(async (cancelled?: () => boolean) => {
    if (!Number.isInteger(movieId) || movieId <= 0) {
      setSimilarMoviesLoading(false)
      setSimilarMovieViews([])
      return
    }

    setSimilarMoviesLoading(true)
    setSimilarMoviesError(null)

    try {
      const response = await getSimilarMovies(movieId, { limit: 4 })
      if (!cancelled?.()) {
        setSimilarMovieViews(response.movies.map(mapMovieCardToView))
      }
    } catch {
      if (!cancelled?.()) {
        setSimilarMoviesError("비슷한 영화를 불러오지 못했습니다.")
        setSimilarMovieViews([])
      }
    } finally {
      if (!cancelled?.()) {
        setSimilarMoviesLoading(false)
      }
    }
  }, [movieId])

  useEffect(() => {
    let cancelled = false
    void loadMovie(() => cancelled)
    void loadReviews(() => cancelled)
    void loadSimilarMovies(() => cancelled)

    return () => {
      cancelled = true
    }
  }, [loadMovie, loadReviews, loadSimilarMovies])

  const handleBookmarkClick = async () => {
    if (bookmarkPending) {
      return
    }

    if (!Number.isInteger(movieId) || movieId <= 0) {
      return
    }

    const previous = isLiked
    const next = !previous
    setIsLiked(next)
    setBookmarkPending(true)

    try {
      const response = await toggleMovieBookmark(movieId, next)
      setIsLiked(response.isBookmarked)
    } catch (error) {
      setIsLiked(previous)
      if (error instanceof BookmarkedMoviesApiError && error.isUnauthorized) {
        router.push(`/login?returnTo=${encodeURIComponent(pathname)}`)
      }
    } finally {
      setBookmarkPending(false)
    }
  }

  const handleReviewSubmit = async () => {
    if (reviewSubmitting || !Number.isInteger(movieId) || movieId <= 0) {
      return
    }

    setReviewFormError(null)
    setReviewSubmitting(true)

    try {
      await createMovieReview(movieId, { rating: userRating, content: reviewText })
      setUserRating(0)
      setReviewText("")
      await Promise.all([loadMovie(), loadReviews()])
    } catch (error) {
      if (error instanceof ReviewsApiError && error.isUnauthorized) {
        router.push(`/login?returnTo=${encodeURIComponent(pathname)}`)
        return
      }
      setReviewFormError(error instanceof ReviewsApiError ? error.message : "리뷰를 등록하지 못했습니다.")
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleReviewLikeClick = async (review: DisplayReview) => {
    if (likePendingReviewId) {
      return
    }

    const previous = review
    const nextLiked = !review.isLiked
    setLikePendingReviewId(review.id)
    setMovie((current) => ({
      ...current,
      reviews: current.reviews.map((item) =>
        item.id === review.id
          ? { ...item, isLiked: nextLiked, likes: Math.max(0, item.likes + (nextLiked ? 1 : -1)) }
          : item,
      ),
    }))

    try {
      const response = await toggleReviewLike(review.id, nextLiked)
      setMovie((current) => ({
        ...current,
        reviews: current.reviews.map((item) =>
          item.id === review.id ? { ...item, isLiked: response.isLiked, likes: response.likes } : item,
        ),
      }))
    } catch (error) {
      setMovie((current) => ({
        ...current,
        reviews: current.reviews.map((item) => (item.id === review.id ? previous : item)),
      }))
      if (error instanceof ReviewsApiError && error.isUnauthorized) {
        router.push(`/login?returnTo=${encodeURIComponent(pathname)}`)
      }
    } finally {
      setLikePendingReviewId(null)
    }
  }

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
                  {movie.reviewCount}개의 리뷰
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {movie.trailerUrl && (
                  <a href={movie.trailerUrl} target="_blank" rel="noreferrer">
                    <Button size="lg">
                      <Play className="mr-2 h-5 w-5" />
                      예고편 보기
                    </Button>
                  </a>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  aria-pressed={isLiked}
                  disabled={bookmarkPending}
                  onClick={handleBookmarkClick}
                >
                  <Heart className={`mr-2 h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                  {isLiked ? "찜 해제" : "찜하기"}
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
            <div className="min-w-0">
              <h2 className="text-xl font-semibold">출연</h2>
              <p className="mt-2 truncate text-muted-foreground" title={movie.cast.join(", ")}>
                {movie.cast.join(", ")}
              </p>
            </div>
          </div>
        </div>
      </section>

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
            {reviewFormError && <p className="mt-3 text-sm text-destructive">{reviewFormError}</p>}
            <Button className="mt-4" disabled={reviewSubmitting || userRating <= 0 || reviewText.trim().length === 0} onClick={handleReviewSubmit}>
              {reviewSubmitting ? "등록 중" : "리뷰 등록"}
            </Button>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold">사용자 리뷰</h2>
          <div className="mt-6 space-y-4">
            {reviewsLoading ? (
              <div className="rounded-xl bg-card p-8 text-center">
                <p className="text-muted-foreground">리뷰를 불러오는 중입니다.</p>
              </div>
            ) : movie.reviews.length > 0 ? (
              movie.reviews.map((review) => (
                <div key={review.id} className="rounded-xl bg-card p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                        <span className="font-medium">{review.user.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{review.user}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(review.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-medium">{review.rating}</span>
                    </div>
                  </div>
                  <p className="mt-4 text-muted-foreground">{review.content}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-pressed={review.isLiked}
                      disabled={likePendingReviewId === review.id}
                      onClick={() => void handleReviewLikeClick(review)}
                    >
                      <ThumbsUp className={`mr-1 h-4 w-4 ${review.isLiked ? "fill-primary text-primary" : ""}`} />
                      {review.likes}
                    </Button>
                  </div>
                </div>
              ))
            ) : reviewListError ? (
              <div className="rounded-xl bg-card p-8 text-center">
                <p className="text-muted-foreground">{reviewListError}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => void loadReviews()}>
                  다시 시도
                </Button>
              </div>
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
          {similarMoviesLoading ? (
            <div className="mt-6 rounded-xl bg-card p-8 text-center">
              <p className="text-muted-foreground">비슷한 영화를 불러오는 중입니다.</p>
            </div>
          ) : similarMoviesError ? (
            <div className="mt-6 rounded-xl bg-card p-8 text-center">
              <p className="text-muted-foreground">{similarMoviesError}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => void loadSimilarMovies()}>
                다시 시도
              </Button>
            </div>
          ) : similarMovieViews.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {similarMovieViews.map((similarMovie) => (
                <MovieCard key={similarMovie.id} {...similarMovie} compact showLikeButton={false} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-card p-8 text-center">
              <p className="text-muted-foreground">비슷한 영화가 아직 없습니다.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

type MovieDetailApi = {
  title: string
  originalTitle: string | null
  year: number | null
  rating: number
  genres: { name: string }[]
  runtime: number | null
  countries: string[]
  director: string | null
  cast: { name: string }[]
  synopsis: string | null
  posterUrl: string | null
  backdropUrl: string | null
  trailerUrl: string | null
  isBookmarked: boolean
  reviewCount: number
}

type DisplayReview = {
  id: string
  user: string
  rating: number
  content: string
  date: string
  likes: number
  isLiked: boolean
}

function mapMovieDetailResponse(movie: MovieDetailApi) {
  return {
    title: movie.title,
    originalTitle: movie.originalTitle ?? "",
    year: movie.year?.toString() ?? "연도 미상",
    rating: movie.rating,
    genre: movie.genres.map((genre) => genre.name),
    runtime: movie.runtime ? `${movie.runtime}분` : "정보 없음",
    country: movie.countries.join(", ") || "정보 없음",
    director: movie.director ?? "정보 없음",
    cast: movie.cast.map((member) => member.name),
    synopsis: movie.synopsis ?? "줄거리 정보가 없습니다.",
    posterUrl: movie.posterUrl ?? "",
    backdropUrl: movie.backdropUrl,
    trailerUrl: movie.trailerUrl,
    reviewCount: movie.reviewCount,
    isBookmarked: movie.isBookmarked,
    reviews: [],
  }
}

function mapReview(review: MovieReview): DisplayReview {
  return {
    id: review.id,
    user: review.user.name,
    rating: review.rating,
    content: review.content,
    date: review.date,
    likes: review.likes,
    isLiked: review.isLiked,
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value))
}
