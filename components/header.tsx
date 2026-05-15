"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, Film, LogOut } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const authStorageKey = "cinemate:isLoggedIn"
const onboardingCompleteKey = "cinemate:onboardingCompleted"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(window.localStorage.getItem(authStorageKey) === "true")
    }

    syncAuthState()
    window.addEventListener("storage", syncAuthState)
    window.addEventListener("cinemate-auth-change", syncAuthState)

    return () => {
      window.removeEventListener("storage", syncAuthState)
      window.removeEventListener("cinemate-auth-change", syncAuthState)
    }
  }, [])

  useEffect(() => {
    if (!isLoggedIn) {
      return
    }

    const onboardingCompleted = window.localStorage.getItem(onboardingCompleteKey) === "true"
    if (!onboardingCompleted && pathname !== "/onboarding") {
      router.replace("/onboarding")
    }
  }, [isLoggedIn, pathname, router])

  const handleLogout = () => {
    window.localStorage.removeItem(authStorageKey)
    window.dispatchEvent(new Event("cinemate-auth-change"))
    setIsLoggedIn(false)
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Film className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">씨네메이트</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            홈
          </Link>
          <Link href="/search" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            영화 탐색
          </Link>
          <Link href="/chat" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            AI 추천
          </Link>
          <Link href="/recommend" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            맞춤 추천
          </Link>
          <Link href="/character-chat" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            캐릭터 대화
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/mypage">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          {isLoggedIn ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="hidden md:flex">
                로그인
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
