"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Film } from "lucide-react"
import { useRouter } from "next/navigation"

const authStorageKey = "cinemate:isLoggedIn"

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = () => {
    window.localStorage.setItem(authStorageKey, "true")
    window.dispatchEvent(new Event("cinemate-auth-change"))
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Film className="h-7 w-7 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">씨네메이트</CardTitle>
              <CardDescription className="mt-1.5">
                소셜 계정으로 간편하게 로그인하세요
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-center gap-3" size="lg" onClick={handleLogin}>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google로 계속하기
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center gap-3 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000] border-[#FEE500]"
              size="lg"
              onClick={handleLogin}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.758 1.86 5.173 4.645 6.51-.147.53-.54 1.927-.618 2.228-.097.372.137.367.287.267.118-.078 1.876-1.27 2.63-1.782.672.096 1.37.146 2.056.146 5.523 0 10-3.463 10-7.369C21 6.463 17.523 3 12 3z" />
              </svg>
              카카오로 계속하기
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
