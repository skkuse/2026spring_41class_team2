"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { LoginButtons } from "@/components/auth/login-buttons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

const errorMessages: Record<string, string> = {
  oauth_failed: "소셜 로그인 요청이 취소되었거나 실패했습니다.",
  invalid_callback: "로그인 응답이 올바르지 않습니다.",
  session_exchange_failed: "로그인 세션을 만들지 못했습니다.",
  profile_sync_failed: "사용자 정보를 동기화하지 못했습니다.",
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo")
  const error = searchParams.get("error")

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary">
              <Image
                src="/cinemate_logo.png"
                alt="Cinemate Logo"
                width={40}
                height={40}
              />
            </div>
            <div>
              <CardTitle className="text-2xl">씨네메이트</CardTitle>
              <CardDescription className="mt-1.5">
                소셜 계정으로 간편하게 로그인하세요
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                {errorMessages[error] ?? "로그인 중 문제가 발생했습니다."}
              </p>
            ) : null}
            <LoginButtons returnTo={returnTo} />
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
