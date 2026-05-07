"use client"

import { useState, useRef, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, MessageCircle, User, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ─── 데이터 ────────────────────────────────────────────────

interface Movie {
  id: string
  title: string
  genre: string
  posterUrl: string
  description: string
  characters: Character[]
  actors?: { name: string; character: string }[]
}

interface Character {
  id: string
  name: string
  description: string
  greeting: string
  suggestedQuestions: string[]
  avatarColor: string
}

interface Message {
  id: string
  role: "user" | "character"
  content: string
}

const MOVIES: Movie[] = [
  {
    id: "1",
    title: "기생충",
    genre: "드라마/스릴러",
    posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    description: "전원 백수 가족이 부유한 가족의 집에 파고들면서 벌어지는 이야기.",
    actors: [
      { name: "송강호", character: "기택" },
      { name: "이선균", character: "박 사장" },
    ],
    characters: [
      {
        id: "c1",
        name: "기택",
        description: "백수 가장, 온 가족을 이끄는 인물",
        greeting: "아이고, 여기서 날 만나네요. 뭐, 계획이 있으신 겁니까?",
        suggestedQuestions: ["계획이 왜 없어야 한다고 생각하나요?", "지하실에서 살던 분을 처음 발견했을 때 어떤 기분이었나요?", "돈이 생기면 어떻게 할 건가요?"],
        avatarColor: "bg-stone-500",
      },
      {
        id: "c2",
        name: "기우",
        description: "장남, 과외로 부잣집에 들어간 인물",
        greeting: "안녕하세요. 저 기우예요. 혹시 과외 선생님 찾고 계신 건 아니죠?",
        suggestedQuestions: ["다혜를 처음 봤을 때 어떤 생각이 들었나요?", "가족들을 그 집에 들이기로 한 걸 후회하나요?", "대학에 꼭 가고 싶은 이유가 뭔가요?"],
        avatarColor: "bg-blue-500",
      },
      {
        id: "c3",
        name: "박 사장",
        description: "IT 기업 CEO, 순진하고 부유한 가장",
        greeting: "어서 오세요. 저는 선을 중요하게 생각하는 사람입니다. 선을 넘지 않으면 괜찮아요.",
        suggestedQuestions: ["냄새에 그렇게 민감한 이유가 있나요?", "기택 씨를 어떻게 생각하셨나요?", "지하실의 존재를 몰랐던 게 사실인가요?"],
        avatarColor: "bg-emerald-500",
      },
    ],
  },
  {
    id: "3",
    title: "인터스텔라",
    genre: "SF/드라마",
    posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    description: "인류의 생존을 위해 우주로 떠나는 아버지와 딸의 이야기.",
    actors: [
      { name: "매튜 맥커너히", character: "쿠퍼" },
      { name: "앤 해서웨이", character: "브랜드 박사" },
    ],
    characters: [
      {
        id: "c4",
        name: "쿠퍼",
        description: "전직 NASA 파일럿, 딸을 사랑하는 아버지",
        greeting: "머프? 아, 아니구나. 어디서 오셨나요? 지구는 아직 괜찮은가요?",
        suggestedQuestions: ["머프를 두고 떠날 때 어떤 마음이었나요?", "블랙홀 안에서 무엇을 보았나요?", "다시 그 선택을 해도 같은 결정을 할 건가요?"],
        avatarColor: "bg-sky-500",
      },
      {
        id: "c5",
        name: "머프",
        description: "쿠퍼의 딸, 과학자로 성장한 인물",
        greeting: "아버지가 날 두고 간다는 걸 알았을 때부터 데이터를 모았어요. 뭐가 궁금하세요?",
        suggestedQuestions: ["아버지를 용서하는 데 얼마나 걸렸나요?", "유령이 보내는 신호를 처음 믿게 된 계기가 뭔가요?", "중력 방정식을 풀었을 때 어떤 기분이었나요?"],
        avatarColor: "bg-amber-500",
      },
    ],
  },
  {
    id: "4",
    title: "다크 나이트",
    genre: "액션/범죄",
    posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    description: "고담시를 공포로 몰아넣는 조커와 배트맨의 대결.",
    actors: [
      { name: "클리스천 베일", character: "배트맨" },
      { name: "히스 레저", character: "조커" },
    ],
    characters: [
      {
        id: "c6",
        name: "조커",
        description: "혼돈을 사랑하는 광대, 예측 불가능한 악당",
        greeting: "하하하... 왜 그렇게 심각한 표정이에요? 그냥 웃어봐요. 궁금한 게 있나요?",
        suggestedQuestions: ["왜 고담시를 혼돈에 빠뜨리려 하나요?", "배트맨을 죽이지 않은 이유가 뭔가요?", "당신이 말하는 '계획'이란 무엇인가요?"],
        avatarColor: "bg-purple-600",
      },
      {
        id: "c7",
        name: "배트맨",
        description: "고담시의 수호자, 복면을 쓴 억만장자",
        greeting: "저는 고담이 필요로 하는 영웅이 아닐 수도 있어요. 하지만 지금 이 순간 필요한 존재죠.",
        suggestedQuestions: ["조커와의 싸움에서 가장 힘들었던 순간은요?", "하비 덴트를 왜 그렇게 믿었나요?", "배트맨을 그만두고 싶었던 적이 있나요?"],
        avatarColor: "bg-gray-700",
      },
    ],
  },
  {
    id: "2",
    title: "라라랜드",
    genre: "뮤지컬/로맨스",
    posterUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
    description: "꿈을 쫓는 재즈 뮤지션과 배우 지망생의 사랑 이야기.",
    actors: [
      { name: "엠마 스톤", character: "미아" },
      { name: "라이언 고슬링", character: "세바스찬" },
    ],
    characters: [
      {
        id: "c8",
        name: "미아",
        description: "배우 지망생, 꿈을 포기하지 않는 여성",
        greeting: "안녕하세요! 저 오늘 오디션 있었는데... 어쨌든, 반가워요.",
        suggestedQuestions: ["세바스찬과의 이별을 후회하나요?", "배우의 꿈을 포기하지 않은 이유가 뭔가요?", "처음 세바스찬을 좋아하게 된 순간이 언제인가요?"],
        avatarColor: "bg-rose-400",
      },
      {
        id: "c9",
        name: "세바스찬",
        description: "재즈 뮤지션, 자신만의 재즈 클럽을 꿈꾸는 남자",
        greeting: "재즈에 대해 제대로 얘기해줄 사람이 필요했는데 잘 오셨네요.",
        suggestedQuestions: ["재즈를 그토록 사랑하는 이유가 뭔가요?", "미아와 함께한 날들 중 가장 기억에 남는 순간은요?", "꿈과 사랑 중 하나를 선택해야 한다면 어떻게 할 건가요?"],
        avatarColor: "bg-yellow-500",
      },
    ],
  },
  {
    id: "5",
    title: "쇼생크 탈출",
    genre: "드라마",
    posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    description: "억울하게 감옥에 갇힌 ��디와 그의 탈출 이야기.",
    actors: [
      { name: "팀 로빈스", character: "앤디 듀프레인" },
      { name: "모건 프리먼", character: "레드" },
    ],
    characters: [
      {
        id: "c10",
        name: "앤디 듀프레인",
        description: "억울하게 수감된 은행가, 끈질긴 의지의 소유자",
        greeting: "희망은 좋은 것이에요. 어쩌면 가장 좋은 것일 수도 있죠. 무엇이든 물어보세요.",
        suggestedQuestions: ["탈출하기까지 포기하고 싶었던 순간이 없었나요?", "레드에게 희망을 믿으라고 했을 때 진심이었나요?", "쇼생크에서 가장 소중했던 것이 무엇인가요?"],
        avatarColor: "bg-teal-500",
      },
      {
        id: "c11",
        name: "레드",
        description: "오랜 수감자, 감옥 내 물건 조달자",
        greeting: "나는 쇼생크의 유일한 죄인이라고 생각했어요... 그 사람이 오기 전까지는.",
        suggestedQuestions: ["앤디를 처음 봤을 때 어떤 인상이었나요?", "희망을 위험한 것이라고 생각한 이유는요?", "출소 후 가장 먼저 한 일이 뭔가요?"],
        avatarColor: "bg-orange-500",
      },
    ],
  },
]

// ─── 채팅 초기 메시지 생성 ─────────────────────────────────

function buildInitialMessage(character: Character): Message {
  return {
    id: "init-0",
    role: "character",
    content: character.greeting,
  }
}

// ─── 간단한 캐릭터 응답 생성 (mock) ───────────────────────

function generateCharacterReply(characterName: string, userMessage: string): string {
  const replies: Record<string, string[]> = {
    기택: [
      "그거 참 좋은 질문이네요. 계획이 없으면 실망도 없거든요. 이해가 되시나요?",
      "냄새... 그게 제일 무서운 거예요. 아무리 씻어도 안 지워지는 냄새요.",
      "가난은 대물림이 되는 거더라고요. 그게 가장 슬픈 거죠.",
    ],
    기우: [
      "솔직히 말하면... 후회해요. 하지만 그때는 방법이 없었어요.",
      "다혜 씨는 좋은 사람이에요. 그게 더 복잡하게 만들었죠.",
      "대학이요? 그냥... 그게 정답인 줄 알았어요. 다들 그렇게 하니까.",
    ],
    "박 사장": [
      "선을 넘지 않으면 아무 문제가 없어요. 저는 항상 그렇게 생각해왔어요.",
      "냄새가요? 지하철 냄새 같은 거요. 딱히 나쁘다는 게 아니라 그냥... 달라요.",
      "기택 씨는 유능했어요. 그냥 그 정도로만 생각했죠.",
    ],
    쿠퍼: [
      "머프에게 돌아오겠다고 약속했어요. 약속은 지키는 거니까요.",
      "블랙홀 안에서는... 시간이 달랐어요. 말로 설명하기가 어렵네요.",
      "다시 선택해도 같은 결정을 했을 거예요. 인류가 달려있었으니까요.",
    ],
    머프: [
      "아버지가 돌아올 거라고 믿었어요. 데이터가 그렇게 말하고 있었으니까요.",
      "중력 방정식을 풀었을 때요? 그냥 울었어요. 한참을.",
      "용서하는 데 시간이 걸렸지만... 결국 이해하게 됐어요.",
    ],
    조커: [
      "하하... 계획이요? 계획이 없는 게 계획이에요. 사람들이 너무 계획에 집착하죠.",
      "배트맨을 죽이면 재미없잖아요. 그 사람�� 저의 의미니까요.",
      "혼돈은 공평해요. 계획을 가진 자들의 세상보다 훨씬요.",
    ],
    배트맨: [
      "고담은 영웅이 필요해요. 설령 그 영웅이 악당이 되어야 한다해도.",
      "하비는 진짜 영웅이었어요. 저는 그저 어둠 속의 기사일 뿐이고요.",
      "그만두고 싶었던 순간이요? 매일이요. 하지만 멈출 수가 없어요.",
    ],
    미아: [
      "후회요? 가끔은요. 하지만 그 선택들이 저를 여기까지 데려다줬어요.",
      "오디션에서 떨어질 때마다 그만두고 싶었어요. 그래도 다시 일어났죠.",
      "세바스찬이 재즈 얘기 할 때요. 그때 좋아하게 된 것 같아요.",
    ],
    세바스찬: [
      "재즈는 살아있어요. 매 순간 즉흥적이고 솔직하죠. 그게 좋아요.",
      "미아와 별 아래에서 춤췄던 날이요. 그날이 제일 기억에 남아요.",
      "꿈이요... 꿈 없이는 음악도 없어요. 그게 답이에요.",
    ],
    "앤디 듀프레인": [
      "희망을 버리는 순간 그들이 이기는 거예요. 절대 버리지 않았어요.",
      "모차르트를 틀었을 때요... 그 순간만큼은 쇼생크가 아니었어요.",
      "포기하고 싶었던 순간이요? 토미가 죽던 날이요.",
    ],
    레드: [
      "앤디를 처음 봤을 때요? 오래 못 버틸 것 같았어요. 제가 틀렸죠.",
      "희망은 위험해요. 가진 자에게는 가능성이지만 없는 자에게는 독이거든요.",
      "출소하고 버스를 탔어요. 밖이 너무 넓어서 무서웠어요.",
    ],
  }

  const characterReplies = replies[characterName]
  if (characterReplies) {
    const index = Math.floor(Math.random() * characterReplies.length)
    return characterReplies[index]
  }
  return `${characterName}입니다. 흥미로운 질문이네요. 조금 더 구체적으로 말씀해 주시겠어요?`
}

// ─── 컴포넌트 ────────────────────────────────────────────

export default function CharacterChatPage() {
  const router = useRouter()
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleSelectMovie(movie: Movie) {
    setSelectedMovie(movie)
    setSelectedCharacter(null)
    setMessages([])
  }

  function handleSelectCharacter(character: Character) {
    setSelectedCharacter(character)
    setMessages([buildInitialMessage(character)])
  }

  function handleSendMessage(content: string) {
    if (!content.trim() || !selectedCharacter) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: content.trim(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputValue("")
    setIsTyping(true)

    setTimeout(() => {
      const reply = generateCharacterReply(selectedCharacter.name, content)
      const charMsg: Message = {
        id: `c-${Date.now()}`,
        role: "character",
        content: reply,
      }
      setMessages((prev) => [...prev, charMsg])
      setIsTyping(false)
    }, 900 + Math.random() * 600)
  }

  function handleActorRecommendation(actorName: string) {
    const query = `${actorName}이 등장한 영화 추천해줘`
    router.push(`/chat?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-balance">영화 속 등장인물과 대화하기</h1>
          <p className="mt-1 text-sm text-muted-foreground">영화를 선택하고 캐릭터를 골라 대화해보세요.</p>
        </div>

        {/* Movie Selection */}
        <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
          {MOVIES.map((movie) => (
            <button
              key={movie.id}
              onClick={() => handleSelectMovie(movie)}
              className={cn(
                "group flex-shrink-0 w-28 rounded-xl overflow-hidden border-2 transition-all duration-200",
                selectedMovie?.id === movie.id
                  ? "border-primary shadow-md shadow-primary/20"
                  : "border-transparent hover:border-border"
              )}
            >
              <div className="relative">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="h-40 w-full object-cover"
                />
                {selectedMovie?.id === movie.id && (
                  <div className="absolute inset-0 bg-primary/20" />
                )}
              </div>
              <div className="bg-card p-2 text-left">
                <p className="text-xs font-semibold line-clamp-1">{movie.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{movie.genre}</p>
              </div>
            </button>
          ))}
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr_200px]">

          {/* Left: Character Selection */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">등장인물</h2>
            {!selectedMovie ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">영화를 먼저<br />선택하세요</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedMovie.characters.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => handleSelectCharacter(character)}
                    className={cn(
                      "rounded-lg p-3 text-left transition-all duration-150 border",
                      selectedCharacter?.id === character.id
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0", character.avatarColor)}>
                        {character.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{character.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{character.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Center: Chat Area */}
          <div className="flex flex-col rounded-xl border bg-card overflow-hidden" style={{ minHeight: "520px" }}>
            <div className="flex items-center gap-2 border-b px-4 py-3">
              {selectedCharacter ? (
                <>
                  <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold", selectedCharacter.avatarColor)}>
                    {selectedCharacter.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{selectedCharacter.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedMovie?.title}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm font-semibold text-foreground">채팅</p>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!selectedCharacter ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <MessageCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedMovie ? "캐릭터를 선택하면\n대화가 시작됩니다." : "영화와 캐릭터를\n선택하세요."}
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {msg.role === "character" && (
                        <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1", selectedCharacter.avatarColor)}>
                          {selectedCharacter.name[0]}
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted text-foreground rounded-tl-sm"
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-2 justify-start">
                      <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0", selectedCharacter.avatarColor)}>
                        {selectedCharacter.name[0]}
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Suggested Questions */}
            {selectedCharacter && messages.length <= 2 && (
              <div className="border-t px-4 py-2 flex flex-wrap gap-2">
                {selectedCharacter.suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t p-3 flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                placeholder={selectedCharacter ? `${selectedCharacter.name}에게 메시지 보내기...` : "캐릭터를 선택하세요"}
                disabled={!selectedCharacter || isTyping}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={() => handleSendMessage(inputValue)}
                disabled={!selectedCharacter || !inputValue.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right: Movie Info */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">영화 정보</h2>
            {!selectedMovie ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">영화를 먼저<br />선택하세요</p>
              </div>
            ) : (
              <div>
                <Link href={`/movie/${selectedMovie.id}`}>
                  <div className="relative group">
                    <img
                      src={selectedMovie.posterUrl}
                      alt={selectedMovie.title}
                      className="w-full rounded-lg object-cover aspect-[2/3] transition-opacity duration-200 group-hover:opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
                      <span className="text-white text-xs font-medium bg-black/60 px-3 py-1.5 rounded-full">상세 정보 보기</span>
                    </div>
                  </div>
                </Link>
                <p className="mt-3 text-sm font-semibold">{selectedMovie.title}</p>
                <Badge variant="secondary" className="mt-1 text-xs">{selectedMovie.genre}</Badge>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{selectedMovie.description}</p>
                
                {/* Actor Recommendation Buttons */}
                {selectedMovie.actors && selectedMovie.actors.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">배우 추천</p>
                    <div className="flex flex-col gap-2">
                      {selectedMovie.actors.map((actor, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs h-auto py-2 px-3"
                          onClick={() => handleActorRecommendation(actor.name)}
                        >
                          <Sparkles className="h-3 w-3 mr-2 text-primary" />
                          <span className="truncate">{actor.name}이 등장한 영화 추천해줘</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
