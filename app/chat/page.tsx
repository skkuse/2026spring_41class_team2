"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Send, Sparkles, Star, ArrowRight, RotateCcw } from "lucide-react"
import Link from "next/link"
import { Suspense, useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"

interface Movie {
  id: string
  title: string
  year: string
  rating: number
  genre: string
  reason: string
  posterUrl: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  movies?: Movie[]
}

const suggestedQuestions = [
  "주말에 보기 좋은 영화 추천해줘",
  "잔잔한 감성의 일본 영화 추천해줘",
  "크리스토퍼 놀란 감독 영화 입문작 추천",
  "가족과 함께 볼 감동 영화",
]

const mockResponses: Record<string, { text: string; movies: Movie[] }> = {
  default: {
    text: "안녕하세요! 영화 추천 AI입니다. 어떤 영화를 찾고 계신가요? 장르, 분위기, 감독, 배우 등 원하시는 조건을 말씀해주세요.",
    movies: []
  },
  "주말에 보기 좋은 영화 추천해줘": {
    text: "주말에 편하게 볼 수 있는 영화들을 추천해드릴게요. 가벼운 코미디부터 감동적인 드라마까지 다양하게 준비했습니다.",
    movies: [
      { id: "5", title: "라라랜드", year: "2016", rating: 4.5, genre: "로맨스", reason: "아름다운 영상미와 음악이 주말 저녁을 특별하게 만들어줍니다.", posterUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg" },
      { id: "18", title: "포레스트 검프", year: "1994", rating: 4.7, genre: "드라마", reason: "따뜻한 감동과 인생에 대한 깊은 메시지를 전달합니다.", posterUrl: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg" },
      { id: "1", title: "기생충", year: "2019", rating: 4.8, genre: "드라마", reason: "긴장감과 블랙 코미디가 조화롭게 어우러진 걸작입니다.", posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg" },
    ]
  },
  "잔잔한 감성의 일본 영화 추천해줘": {
    text: "일본 특유의 잔잔하고 서정적인 영화들을 추천해드릴게요. 여유롭게 감상하시기 좋은 작품들입니다.",
    movies: [
      { id: "19", title: "러브레터", year: "1995", rating: 4.6, genre: "로맨스", reason: "이와이 슌지 감독의 대표작으로, 아름다운 설경과 깊은 감정선이 특징입니다.", posterUrl: "https://image.tmdb.org/t/p/w500/vUCGkgaB8qiSdmVuMQjKXTPW2DL.jpg" },
      { id: "20", title: "걸어도 걸어도", year: "2008", rating: 4.4, genre: "드라마", reason: "고레에다 히로카즈 감독의 가족 드라마. 일상의 소중함을 담담하게 그립니다.", posterUrl: "https://image.tmdb.org/t/p/w500/2WQN0D6CIrWZ6rjkXnU9TzJJgJE.jpg" },
      { id: "21", title: "바닷마을 다이어리", year: "2015", rating: 4.5, genre: "드라마", reason: "네 자매의 따뜻한 이야기. 고레에다 감독 특유의 섬세한 연출이 돋보입니다.", posterUrl: "https://image.tmdb.org/t/p/w500/wTp3qBXJGhPE2m1yGzDhW0k5q9F.jpg" },
    ]
  },
  "크리스토퍼 놀란 감독 영화 입문작 추천": {
    text: "크리스토퍼 놀란 감독 입문으로 추천드리는 영화들입니다. 복잡하지 않으면서도 그의 연출력을 잘 느낄 수 있는 작품들이에요.",
    movies: [
      { id: "3", title: "인터스텔라", year: "2014", rating: 4.9, genre: "SF", reason: "우주와 시간을 넘나드는 감동적인 이야기. 놀란 입문작으로 최고입니다.", posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
      { id: "15", title: "다크 나이트", year: "2008", rating: 4.8, genre: "액션", reason: "슈퍼히어로 영화의 새로운 기준을 제시한 작품입니다.", posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
      { id: "22", title: "인셉션", year: "2010", rating: 4.7, genre: "SF", reason: "꿈 속의 꿈을 다루는 독창적인 스토리와 화려한 액션이 인상적입니다.", posterUrl: "https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg" },
    ]
  },
  "엠마 스톤이 등장한 영화 추천해줘": {
    text: "엠마 스톤이 출연한 영화들 중 추천작을 알려드릴게요. 뛰어난 연기력으로 다양한 장르를 소화하는 배우입니다!",
    movies: [
      { id: "5", title: "라라랜드", year: "2016", rating: 4.5, genre: "뮤지컬", reason: "아카데미 여우주연상 수상작. 꿈과 사랑을 노래하는 감동적인 뮤지컬입니다.", posterUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg" },
      { id: "23", title: "가엾은 것들", year: "2023", rating: 4.6, genre: "SF/드라마", reason: "아카데미 여우주연상 수상. 대담하고 실험적인 비주얼이 인상적인 작품입니다.", posterUrl: "https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg" },
      { id: "24", title: "이지 A", year: "2010", rating: 4.2, genre: "코미디", reason: "엠마 스톤의 매력이 폭발하는 하이틴 코미디. 재치있는 대사가 일품입니다.", posterUrl: "https://image.tmdb.org/t/p/w500/6rUq9gpthjr66uKuVFMgGWvpAkK.jpg" },
      { id: "25", title: "버드맨", year: "2014", rating: 4.5, genre: "드라마", reason: "아카데미 작품상 수상작. 원테이크 기법의 혁신적인 연출이 돋보입니다.", posterUrl: "https://image.tmdb.org/t/p/w500/rSZs93P0LLxqlVEbI001UKoeCQC.jpg" },
    ]
  },
  "라이언 고슬링이 등장한 영화 추천해줘": {
    text: "라이언 고슬링 출연작 중 추천작들입니다. 독특한 분위기와 깊이 있는 연기가 매력인 배우예요!",
    movies: [
      { id: "5", title: "라라랜드", year: "2016", rating: 4.5, genre: "뮤지컬", reason: "직접 피아노 연주까지 소화한 열연. 로맨틱한 재즈 뮤지컬의 정석입니다.", posterUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg" },
      { id: "26", title: "드라이브", year: "2011", rating: 4.4, genre: "액션/스릴러", reason: "과묵한 드라이버 역할로 컬트적인 인기를 얻은 네온 누아르 걸작입니다.", posterUrl: "https://image.tmdb.org/t/p/w500/602vevIURmpDfzbnv5Ubi6wIkQm.jpg" },
      { id: "27", title: "블레이드 러너 2049", year: "2017", rating: 4.6, genre: "SF", reason: "드니 빌뇌브 감독의 걸작. 아름다운 영상미와 철학적인 스토리가 인상적입니다.", posterUrl: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg" },
      { id: "28", title: "노트북", year: "2004", rating: 4.3, genre: "로맨스", reason: "순수한 사랑 이야기의 고전. 로맨스 영화의 대명사로 사랑받는 작품입니다.", posterUrl: "https://image.tmdb.org/t/p/w500/rNzQyW4f8B8cQeg7Dgj3n6eT5k9.jpg" },
    ]
  },
}

function ChatPageContent() {
  const searchParams = useSearchParams()
  const processedQueryRef = useRef<string | null>(null)
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "안녕하세요! 영화 추천 AI입니다. 어떤 영화를 찾고 계신가요? 장르, 분위기, 감독, 배우 등 원하시는 조건을 말씀해주세요.",
      movies: []
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const query = searchParams.get("q")
    if (query && processedQueryRef.current !== query) {
      processedQueryRef.current = query
      handleSend(query)
    }
  }, [searchParams])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const response = mockResponses[messageText] || {
        text: `"${messageText}"에 대해 검색해보았습니다. 다음 영화들을 추천드려요.`,
        movies: [
          { id: "1", title: "기생충", year: "2019", rating: 4.8, genre: "드라마", reason: "뛰어난 연출력과 깊은 사회적 메시지를 담은 작품입니다.", posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg" },
          { id: "3", title: "인터스텔라", year: "2014", rating: 4.9, genre: "SF", reason: "장르를 불문하고 감동적인 스토리를 원한다면 추천드립니다.", posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
        ]
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.text,
        movies: response.movies
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleReset = () => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: "안녕하세요! 영화 추천 AI입니다. 어떤 영화를 찾고 계신가요? 장르, 분위기, 감독, 배우 등 원하시는 조건을 말씀해주세요.",
        movies: []
      }
    ])
    processedQueryRef.current = null
  }


  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-border p-4 lg:block">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">대화 기록</h2>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="mr-1 h-4 w-4" />
              새 대화
            </Button>
          </div>
          <div className="mt-6">
            <h3 className="mb-3 text-sm text-muted-foreground">추천 질문</h3>
            <div className="space-y-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="w-full rounded-lg bg-secondary/50 p-3 text-left text-sm transition-colors hover:bg-secondary"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${message.role === "user" ? "order-2" : ""}`}>
                    {message.role === "assistant" && (
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                          <Sparkles className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <span className="text-sm font-medium">AI 추천</span>
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-card"
                    }`}>
                      <p className="leading-relaxed">{message.content}</p>
                    </div>

                    {/* Movie Cards */}
                    {message.movies && message.movies.length > 0 && (
                      <div className="mt-4 grid gap-3">
                        {message.movies.map((movie) => (
                          <Link key={movie.id} href={`/movie/${movie.id}`}>
                            <div className="group flex gap-4 rounded-xl bg-card p-4 transition-colors hover:bg-secondary/50">
                              <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg">
                                <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-semibold">{movie.title}</h4>
                                    <p className="text-sm text-muted-foreground">{movie.year} | {movie.genre}</p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-primary text-primary" />
                                    <span className="text-sm font-medium">{movie.rating}</span>
                                  </div>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{movie.reason}</p>
                              </div>
                              <ArrowRight className="h-5 w-5 shrink-0 self-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%]">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                        <Sparkles className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span className="text-sm font-medium">AI 추천</span>
                    </div>
                    <div className="rounded-2xl bg-card px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4">
            <div className="mx-auto max-w-3xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="영화에 대해 물어보세요..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={!input.trim() || isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                예: &quot;기생충 좋아했다면 볼 만한 한국 영화는?&quot;, &quot;러닝타임 2시간 이하 코미디 추천해줘&quot;
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageContent />
    </Suspense>
  )
}
