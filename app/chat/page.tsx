"use client"

import { ProtectedPage } from "@/components/auth/protected-page"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getMyRecommendationChatConversation,
  getRecommendationChatInitialQuestions,
  RecommendationChatApiError,
  resetMyRecommendationChatConversation,
  type RecommendationChatMovie,
  type RecommendationChatMessage,
  submitRecommendationChatMessage,
} from "@/lib/recommendation-chat/recommendation-chat-client"
import { ArrowRight, RotateCcw, Send, Sparkles, Star } from "lucide-react"
import Link from "next/link"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

type UiMessage = {
  id: string
  role: "request" | "response"
  content: string
  movies: RecommendationChatMovie[]
}

function ChatPageContent() {
  const searchParams = useSearchParams()
  const processedQueryRef = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [initialQuestions, setInitialQuestions] = useState<string[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = (text ?? input).trim()
      if (!messageText || isLoading) {
        return
      }

      const optimisticMessage: UiMessage = {
        id: `local-${Date.now()}`,
        role: "request",
        content: messageText,
        movies: [],
      }

      setMessages((prev) => [...prev, optimisticMessage])
      setInput("")
      setErrorMessage(null)
      setIsLoading(true)

      try {
        const response = await submitRecommendationChatMessage({ message: messageText })
        setMessages((prev) => [
          ...prev,
          {
            id: `response-${Date.now()}`,
            role: "response",
            content: response.answer,
            movies: response.movies,
          },
        ])
      } catch (error) {
        setMessages((prev) => prev.filter((message) => message.id !== optimisticMessage.id))
        setInput(messageText)
        setErrorMessage(toErrorMessage(error))
      } finally {
        setIsLoading(false)
      }
    },
    [input, isLoading],
  )

  useEffect(() => {
    let cancelled = false

    async function loadInitialState() {
      setIsBootstrapping(true)
      setErrorMessage(null)

      try {
        const [questions, conversation] = await Promise.all([
          getRecommendationChatInitialQuestions(),
          getMyRecommendationChatConversation(),
        ])
        if (cancelled) {
          return
        }
        setInitialQuestions(questions.questions)
        setMessages(conversation.messages.map(mapApiMessage))
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(toErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
        }
      }
    }

    loadInitialState()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const query = searchParams.get("q")
    if (!isBootstrapping && query && processedQueryRef.current !== query) {
      processedQueryRef.current = query
      void handleSend(query)
    }
  }, [handleSend, isBootstrapping, searchParams])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleReset = async () => {
    if (isLoading || isBootstrapping) {
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    try {
      const response = await resetMyRecommendationChatConversation()
      setMessages(response.messages.map(mapApiMessage))
      setInput("")
      processedQueryRef.current = searchParams.get("q")
    } catch (error) {
      setErrorMessage(toErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-72 shrink-0 border-r border-border p-4 lg:block">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">현재 대화</h2>
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={isLoading || isBootstrapping}>
              <RotateCcw className="mr-1 h-4 w-4" />
              초기화
            </Button>
          </div>
          <div className="mt-6">
            <h3 className="mb-3 text-sm text-muted-foreground">추천 질문</h3>
            <div className="space-y-2">
              {initialQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSend(question)}
                  disabled={isLoading || isBootstrapping}
                  className="w-full rounded-lg bg-secondary/50 p-3 text-left text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
            <div className="mx-auto max-w-3xl space-y-6">
              {isBootstrapping ? (
                <AssistantBubble content="대화를 불러오는 중이에요." movies={[]} />
              ) : messages.length === 0 ? (
                <AssistantBubble
                  content="장르, 제작 국가, 언어, 개봉 시기, 러닝타임 같은 영화 메타데이터 또는 분위기, 감정, 소재 같은 영화 속성 정보를 포함하여 물어봐 주세요!"
                  movies={[]}
                />
              ) : null}

              {messages.map((message) =>
                message.role === "request" ? (
                  <UserBubble key={message.id} content={message.content} />
                ) : (
                  <AssistantBubble key={message.id} content={message.content} movies={message.movies} />
                ),
              )}

              {isLoading ? <AssistantLoadingBubble /> : null}
            </div>
          </div>

          <div className="border-t border-border p-4">
            <div className="mx-auto max-w-3xl">
              {errorMessage ? (
                <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </p>
              ) : null}
              <div className="mb-3 flex gap-2 overflow-x-auto lg:hidden">
                {initialQuestions.map((question) => (
                  <Button
                    key={question}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleSend(question)}
                    disabled={isLoading || isBootstrapping}
                  >
                    {question}
                  </Button>
                ))}
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleSend()
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="영화 추천 조건을 입력하세요"
                  className="flex-1"
                  disabled={isLoading || isBootstrapping}
                />
                <Button type="submit" disabled={!input.trim() || isLoading || isBootstrapping} aria-label="메시지 보내기">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
        <p className="leading-relaxed">{content}</p>
      </div>
    </div>
  )
}

function AssistantBubble({ content, movies }: { content: string; movies: RecommendationChatMovie[] }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium">AI 추천</span>
        </div>
        <div className="rounded-2xl bg-card px-4 py-3">
          <p className="leading-relaxed">{content}</p>
        </div>
        {movies.length > 0 ? <MovieRecommendations movies={movies} /> : null}
      </div>
    </div>
  )
}

function AssistantLoadingBubble() {
  return (
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
  )
}

function MovieRecommendations({ movies }: { movies: RecommendationChatMovie[] }) {
  return (
    <div className="mt-4 grid gap-3">
      {movies.map((movie) => (
        <Link key={movie.id} href={`/movie/${movie.id}`}>
          <div className="group flex gap-4 rounded-xl bg-card p-4 transition-colors hover:bg-secondary/50">
            <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
              {movie.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
              ) : (
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate font-semibold">{movie.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {movie.year ?? "연도 미상"} | {movie.genres.map((genre) => genre.name).join(", ") || "장르 미상"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-sm font-medium">{movie.rating.toFixed(1)}</span>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{movie.reason}</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 self-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </Link>
      ))}
    </div>
  )
}

function mapApiMessage(message: RecommendationChatMessage): UiMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    movies: message.movies,
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof RecommendationChatApiError) {
    return error.message
  }

  return "추천 채팅을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."
}

export default function ChatPage() {
  return (
    <ProtectedPage>
      <Suspense fallback={null}>
        <ChatPageContent />
      </Suspense>
    </ProtectedPage>
  )
}
