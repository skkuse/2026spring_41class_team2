"use client"

import { Header } from "@/components/header"
import { ProtectedPage } from "@/components/auth/protected-page"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Heart } from "lucide-react"
import { useEffect, useState } from "react"
import { BookmarkedMoviesList } from "./_components/bookmarked-movies-list"
import { MyReviewsList } from "./_components/my-reviews-list"

type MyPageUser = {
  name: string
  email: string
  bookmarkedMovieCount: number
  reviewCount: number
}

type MeResponse =
  | { authenticated: false; user: null }
  | { authenticated: true; user: MyPageUser }

export default function MyPage() {
  const [user, setUser] = useState<MyPageUser | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      const response = await fetch("/api/me", { cache: "no-store" })
      if (!response.ok) {
        return
      }

      const me = (await response.json()) as MeResponse
      if (!cancelled) {
        setUser(me.authenticated ? me.user : null)
      }
    }

    loadUser().catch(() => {
      if (!cancelled) {
        setUser(null)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ProtectedPage>
      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
            {(user?.name ?? "사용자").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold">{user?.name ?? "사용자"}님</h1>
            <p className="mt-1 text-muted-foreground">{user?.email ?? ""}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 md:justify-start">
              <div className="text-center">
                <p className="text-2xl font-bold">{user?.bookmarkedMovieCount ?? 0}</p>
                <p className="text-sm text-muted-foreground">찜한 영화</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{user?.reviewCount ?? 0}</p>
                <p className="text-sm text-muted-foreground">작성한 리뷰</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="liked" className="mt-8">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="liked" className="gap-2">
              <Heart className="h-4 w-4" />
              찜한 영화
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <Star className="h-4 w-4" />
              내 리뷰
            </TabsTrigger>
          </TabsList>

          <TabsContent value="liked" className="mt-6">
            <BookmarkedMoviesList />
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <MyReviewsList />
          </TabsContent>
        </Tabs>
      </main>
      </ProtectedPage>
    </div>
  )
}
