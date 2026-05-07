"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, Film } from "lucide-react"

export function Header() {
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
          <Link href="/login">
            <Button variant="outline" size="sm" className="hidden md:flex">
              로그인
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
