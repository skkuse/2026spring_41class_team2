"use client"

import { ProtectedPage } from "@/components/auth/protected-page"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { MessageCircle, Send, User } from "lucide-react"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CharacterChatApiError,
  createCharacterChatConversation,
  getCharacterChatConversation,
  getCharacterChatMovies,
  sendCharacterChatMessage,
  type CharacterChatCharacter,
  type CharacterChatMovie,
} from "@/lib/character-chat/character-chat-client"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  role: "user" | "character"
  content: string
}

const SPOILER_INPUT_NOTICE = "스포일러가 포함될 수 있습니다. 계속하려면 이 문구를 지우고 메시지를 입력하세요."

function buildInitialMessage(content: string): Message {
  return {
    id: "init-0",
    role: "character",
    content,
  }
}

function mapConversationMessage(message: { id: string; role: "user" | "character"; content: string }): Message {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
  }
}

function errorMessage(error: unknown) {
  if (error instanceof CharacterChatApiError && error.isUnauthorized) {
    return "로그인 후 캐릭터와 대화할 수 있습니다."
  }

  if (error instanceof Error) {
    return error.message
  }

  return "요청을 처리하지 못했습니다."
}

export default function CharacterChatPage() {
  return (
    <ProtectedPage>
      <CharacterChatPageContent/>
    </ProtectedPage>
  )
}

function CharacterChatPageContent() {
  const [movies, setMovies] = useState<CharacterChatMovie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<CharacterChatMovie | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterChatCharacter | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoadingMovies, setIsLoadingMovies] = useState(true)
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const selectionRequestRef = useRef(0)

  useEffect(() => {
    let ignore = false

    async function loadMovies() {
      setIsLoadingMovies(true)
      setError(null)

      try {
        const response = await getCharacterChatMovies()
        if (ignore) {
          return
        }
        setMovies(response.movies)
        setSelectedMovie(response.movies[0] ?? null)
      } catch (loadError) {
        if (!ignore) {
          setError(errorMessage(loadError))
        }
      } finally {
        if (!ignore) {
          setIsLoadingMovies(false)
        }
      }
    }

    void loadMovies()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  function handleSelectMovie(movie: CharacterChatMovie) {
    setSelectedMovie(movie)
    setSelectedCharacter(null)
    setConversationId(null)
    setMessages([])
    setSuggestedQuestions([])
    setInputValue("")
    setError(null)
  }

  async function handleSelectCharacter(character: CharacterChatCharacter) {
    if (!selectedMovie) {
      return
    }

    const requestKey = selectionRequestRef.current + 1
    selectionRequestRef.current = requestKey
    setSelectedCharacter(character)
    setConversationId(null)
    setMessages([])
    setSuggestedQuestions([])
    setInputValue("")
    setError(null)
    setIsCreatingConversation(true)

    try {
      const conversation = await getCharacterChatConversation({
        movieId: selectedMovie.id,
        characterId: character.id,
      })
      if (selectionRequestRef.current !== requestKey) {
        return
      }
      if (conversation.conversationId) {
        setConversationId(conversation.conversationId)
        setMessages([buildInitialMessage(conversation.initialMessage), ...conversation.messages.map(mapConversationMessage)])
        setSuggestedQuestions(conversation.suggestedQuestions)
        setInputValue(conversation.messages.length === 0 ? SPOILER_INPUT_NOTICE : "")
        return
      }

      const createdConversation = await createCharacterChatConversation({
        movieId: selectedMovie.id,
        characterId: character.id,
      })
      if (selectionRequestRef.current !== requestKey) {
        return
      }
      setConversationId(createdConversation.conversationId)
      setMessages([buildInitialMessage(createdConversation.initialMessage)])
      setSuggestedQuestions(createdConversation.suggestedQuestions)
      setInputValue(SPOILER_INPUT_NOTICE)
    } catch (createError) {
      if (selectionRequestRef.current === requestKey) {
        setError(errorMessage(createError))
      }
    } finally {
      if (selectionRequestRef.current === requestKey) {
        setIsCreatingConversation(false)
      }
    }
  }

  async function handleSendMessage(content: string) {
    const message = content.trim()
    if (!message || message === SPOILER_INPUT_NOTICE || !selectedCharacter || !conversationId || isTyping) {
      return
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: message,
    }
    setMessages((prev) => [...prev, userMsg])
    setInputValue("")
    setSuggestedQuestions([])
    setError(null)
    setIsTyping(true)

    try {
      const response = await sendCharacterChatMessage({ conversationId, message })
      const charMsg: Message = {
        id: response.messageId,
        role: "character",
        content: response.reply,
      }
      setMessages((prev) => [...prev, charMsg])
      setSuggestedQuestions(response.suggestedQuestions)
    } catch (sendError) {
      setMessages((prev) => prev.filter((item) => item.id !== userMsg.id))
      setError(errorMessage(sendError))
    } finally {
      setIsTyping(false)
    }
  }

  const inputDisabled = !selectedCharacter || !conversationId || isCreatingConversation || isTyping

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-balance">영화 속 등장인물과 대화하기</h1>
          <p className="mt-1 text-sm text-muted-foreground">영화를 선택하고 캐릭터를 골라 대화해보세요.</p>
          <p className="mt-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-700 dark:text-yellow-300">
            스포일러 주의: 캐릭터 대화에는 영화의 주요 사건과 결말에 관한 내용이 포함될 수 있습니다.
          </p>
        </div>

        <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
          {isLoadingMovies ? (
            <div className="flex h-40 w-28 flex-shrink-0 items-center justify-center rounded-xl border bg-card text-xs text-muted-foreground">
              불러오는 중
            </div>
          ) : (
            movies.map((movie) => (
              <button
                key={movie.id}
                onClick={() => handleSelectMovie(movie)}
                className={cn(
                  "group w-28 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
                  selectedMovie?.id === movie.id
                    ? "border-primary shadow-md shadow-primary/20"
                    : "border-transparent hover:border-border",
                )}
              >
                <div className="relative">
                  <img src={movie.posterUrl} alt={movie.title} className="h-40 w-full object-cover" />
                  {selectedMovie?.id === movie.id && <div className="absolute inset-0 bg-primary/20" />}
                </div>
                <div className="bg-card p-2 text-left">
                  <p className="line-clamp-1 text-xs font-semibold">{movie.title}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr_200px]">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">등장인물</h2>
            {!selectedMovie ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  영화를 먼저
                  <br />
                  선택하세요
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedMovie.characters.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => void handleSelectCharacter(character)}
                    disabled={isCreatingConversation}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-all duration-150 disabled:opacity-60",
                      selectedCharacter?.id === character.id
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-muted/50 hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={character.avatarUrl}
                        alt={character.name}
                        className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{character.name}</p>
                        <p className="text-xs leading-relaxed text-muted-foreground">{character.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border bg-card">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              {selectedCharacter ? (
                <>
                  <img
                    src={selectedCharacter.avatarUrl}
                    alt={selectedCharacter.name}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold">{selectedCharacter.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedMovie?.title}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm font-semibold text-foreground">채팅</p>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {!selectedCharacter ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <MessageCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">
                    {selectedMovie ? "캐릭터를 선택하면\n대화가 시작됩니다." : "영화와 캐릭터를\n선택하세요."}
                  </p>
                </div>
              ) : (
                <>
                  {isCreatingConversation && (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      대화를 준비하는 중
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                      {msg.role === "character" && (
                        <img
                          src={selectedCharacter.avatarUrl}
                          alt={selectedCharacter.name}
                          className="mt-1 h-7 w-7 flex-shrink-0 rounded-full object-cover"
                        />
                      )}
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                          msg.role === "user"
                            ? "rounded-tr-sm bg-primary text-primary-foreground"
                            : "rounded-tl-sm bg-muted text-foreground",
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start gap-2">
                      <img
                        src={selectedCharacter.avatarUrl}
                        alt={selectedCharacter.name}
                        className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                      />
                      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {selectedCharacter && suggestedQuestions.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t px-4 py-2">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => void handleSendMessage(question)}
                    disabled={inputDisabled}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 border-t p-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleSendMessage(inputValue)}
                placeholder={selectedCharacter ? `${selectedCharacter.name}에게 메시지 보내기...` : "캐릭터를 선택하세요"}
                disabled={inputDisabled}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={() => void handleSendMessage(inputValue)}
                disabled={inputDisabled || !inputValue.trim() || inputValue.trim() === SPOILER_INPUT_NOTICE}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">영화 정보</h2>
            {!selectedMovie ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  영화를 먼저
                  <br />
                  선택하세요
                </p>
              </div>
            ) : (
              <div>
                <Link href={`/movie/${selectedMovie.id}`}>
                  <div className="group relative">
                    <img
                      src={selectedMovie.posterUrl}
                      alt={selectedMovie.title}
                      className="aspect-[2/3] w-full rounded-lg object-cover transition-opacity duration-200 group-hover:opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white">
                        상세 정보 보기
                      </span>
                    </div>
                  </div>
                </Link>
                <p className="mt-3 text-sm font-semibold">{selectedMovie.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedMovie.genres.length > 0 ? (
                    selectedMovie.genres.map((genre) => (
                      <Badge key={genre.id} variant="secondary" className="text-xs">
                        {genre.name}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      장르 정보 없음
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{selectedMovie.description}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
