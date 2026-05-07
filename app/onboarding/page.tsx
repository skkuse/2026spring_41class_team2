"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  Sword, 
  Laugh, 
  Theater, 
  Rocket, 
  Heart, 
  Ghost, 
  Zap, 
  Sparkles, 
  Skull, 
  Clapperboard,
  ShoppingBasket,
  Check,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

const genres = [
  { id: "action", name: "액션", icon: Sword, color: "from-red-500 to-orange-500", description: "추격전, 격투 등 긴박감 넘치는" },
  { id: "comedy", name: "코미디", icon: Laugh, color: "from-yellow-400 to-amber-500", description: "웃음을 유발하여 재미를 주는" },
  { id: "drama", name: "드라마", icon: Theater, color: "from-blue-500 to-cyan-500", description: "인물 간의 갈등과 감정선 중심" },
  { id: "scifi", name: "SF/공상과학", icon: Rocket, color: "from-indigo-500 to-purple-500", description: "과학적 상상력의 미래, 우주, 기술" },
  { id: "romance", name: "로맨스", icon: Heart, color: "from-pink-500 to-rose-500", description: "남녀 간의 사랑 이야기" },
  { id: "horror", name: "공포/호러", icon: Ghost, color: "from-slate-600 to-slate-800", description: "공포심이나 오싹함을 느끼게 하는" },
  { id: "thriller", name: "스릴러", icon: Zap, color: "from-emerald-500 to-teal-600", description: "긴장감과 서스펜스를 유발하는" },
  { id: "fantasy", name: "판타지", icon: Sparkles, color: "from-violet-500 to-fuchsia-500", description: "마법, 초자연적 현상의 세계" },
  { id: "crime", name: "범죄/느와르", icon: Skull, color: "from-zinc-600 to-neutral-800", description: "범죄 사건과 그 이면을 다루는" },
  { id: "animation", name: "애니메이션", icon: Clapperboard, color: "from-sky-400 to-blue-500", description: "그림이나 모형으로 움직임을 구현" },
]

interface FlyingGenre {
  id: string
  name: string
  icon: typeof Sword
  color: string
  startX: number
  startY: number
}

export default function OnboardingPage() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [flyingGenres, setFlyingGenres] = useState<FlyingGenre[]>([])
  const basketRef = useRef<HTMLDivElement>(null)

  const handleGenreClick = (
    genre: typeof genres[0],
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const startX = rect.left + rect.width / 2
    const startY = rect.top + rect.height / 2

    if (selectedGenres.includes(genre.id)) {
      // Remove from selection
      setSelectedGenres(prev => prev.filter(id => id !== genre.id))
    } else {
      // Add flying animation
      const flyingGenre: FlyingGenre = {
        id: `${genre.id}-${Date.now()}`,
        name: genre.name,
        icon: genre.icon,
        color: genre.color,
        startX,
        startY,
      }
      setFlyingGenres(prev => [...prev, flyingGenre])

      // Add to selection after a delay
      setTimeout(() => {
        setSelectedGenres(prev => [...prev, genre.id])
        setFlyingGenres(prev => prev.filter(f => f.id !== flyingGenre.id))
      }, 600)
    }
  }

  const getBasketPosition = () => {
    if (basketRef.current) {
      const rect = basketRef.current.getBoundingClientRect()
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
    }
    return { x: window.innerWidth - 100, y: 100 }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Flying genres animation */}
      <AnimatePresence>
        {flyingGenres.map((genre) => {
          const basketPos = getBasketPosition()
          const Icon = genre.icon
          return (
            <motion.div
              key={genre.id}
              className={`fixed z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${genre.color} text-white font-medium shadow-lg`}
              initial={{
                x: genre.startX - 60,
                y: genre.startY - 20,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                x: basketPos.x - 60,
                y: basketPos.y - 20,
                scale: 0.5,
                opacity: 0.8,
              }}
              exit={{
                scale: 0,
                opacity: 0,
              }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <Icon className="w-5 h-5" />
              <span>{genre.name}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              어떤 영화를 좋아하세요?
            </h1>
            <p className="text-muted-foreground text-lg">
              선호하는 장르를 선택하면 맞춤 영화를 추천해 드릴게요
            </p>
          </motion.div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Genre Selection Grid */}
          <div className="flex-1">
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
            >
              {genres.map((genre) => {
                const Icon = genre.icon
                const isSelected = selectedGenres.includes(genre.id)
                const isFlying = flyingGenres.some(f => f.id.startsWith(genre.id))

                return (
                  <motion.div
                    key={genre.id}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.9 },
                      visible: { opacity: 1, y: 0, scale: 1 },
                    }}
                  >
                    <motion.button
                      onClick={(e) => handleGenreClick(genre, e)}
                      disabled={isFlying}
                      className={`
                        relative w-full p-5 rounded-2xl border-2 transition-all duration-300
                        ${isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50 hover:bg-accent"
                        }
                        ${isFlying ? "opacity-50" : ""}
                        group
                      `}
                      whileHover={{ scale: isFlying ? 1 : 1.02 }}
                      whileTap={{ scale: isFlying ? 1 : 0.98 }}
                    >
                      {/* Selected checkmark */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex flex-col items-center text-center gap-3">
                        <div
                          className={`
                            w-14 h-14 rounded-xl flex items-center justify-center
                            bg-gradient-to-br ${genre.color}
                            shadow-lg transition-transform duration-300
                            ${isSelected ? "scale-110" : "group-hover:scale-105"}
                          `}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">
                            {genre.name}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {genre.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>

          {/* Basket / Selection Summary */}
          <div className="lg:w-80">
            <motion.div
              ref={basketRef}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-8"
            >
              <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                {/* Basket Header */}
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center"
                    animate={{
                      scale: flyingGenres.length > 0 ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <ShoppingBasket className="w-6 h-6 text-primary" />
                  </motion.div>
                  <div>
                    <h2 className="font-semibold text-foreground">내 취향 바구니</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedGenres.length}개 선택됨
                    </p>
                  </div>
                </div>

                {/* Selected Genres */}
                <div className="min-h-[200px] mb-4">
                  {selectedGenres.length === 0 ? (
                    <div className="h-[200px] flex flex-col items-center justify-center text-center">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <ShoppingBasket className="w-12 h-12 text-muted-foreground/30 mb-3" />
                      </motion.div>
                      <p className="text-muted-foreground text-sm">
                        좋아하는 장르를 클릭해서
                        <br />
                        바구니에 담아보세요
                      </p>
                    </div>
                  ) : (
                    <motion.div className="flex flex-wrap gap-2" layout>
                      <AnimatePresence mode="popLayout">
                        {selectedGenres.map((genreId) => {
                          const genre = genres.find(g => g.id === genreId)
                          if (!genre) return null
                          const Icon = genre.icon

                          return (
                            <motion.button
                              key={genreId}
                              layout
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedGenres(prev => prev.filter(id => id !== genreId))}
                              className={`
                                flex items-center gap-2 px-3 py-2 rounded-full
                                bg-gradient-to-r ${genre.color} text-white
                                text-sm font-medium shadow-md
                                hover:shadow-lg transition-shadow
                              `}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{genre.name}</span>
                              <span className="ml-1 opacity-70">×</span>
                            </motion.button>
                          )
                        })}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    asChild
                    className="w-full"
                    size="lg"
                    disabled={selectedGenres.length === 0}
                  >
                    <Link href="/">
                      <span>시작하기</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    asChild
                  >
                    <Link href="/">
                      나중에 할게요
                    </Link>
                  </Button>
                </div>

                {/* Tip */}
                <p className="text-xs text-muted-foreground text-center mt-4">
                  선택한 장르는 마이페이지에서 변경할 수 있어요
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
