"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth/auth-client"
import { Film, LogOut, User } from "lucide-react"

type HeaderUser = {
  name: string
}

type MeResponse =
  | { authenticated: false; user: null }
  | { authenticated: true; user: HeaderUser }

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<HeaderUser | null>(null)

  useEffect(() => {
    let cancelled = false

    async function syncAuthState() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" })
        if (!response.ok) {
          return
        }

        const me = (await response.json()) as MeResponse
        if (!cancelled) {
          setUser(me.authenticated ? me.user : null)
        }
      } catch {
        if (!cancelled) {
          setUser(null)
        }
      }
    }

    syncAuthState()
    window.addEventListener("focus", syncAuthState)

    return () => {
      cancelled = true
      window.removeEventListener("focus", syncAuthState)
    }
  }, [])

  const handleLogout = async () => {
    const { error } = await signOut()
    if (error) {
      return
    }

    setUser(null)
    router.push("/")
    router.refresh()
  }

  const loginHref = pathname === "/login" ? "/login" : `/login?returnTo=${encodeURIComponent(pathname)}`

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
            <Button variant="ghost" size="icon" aria-label="마이페이지">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          {user ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          ) : (
            <Link href={loginHref}>
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
