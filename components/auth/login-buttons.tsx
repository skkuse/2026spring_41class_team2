"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { signInWithOAuth, type OAuthProvider } from "@/lib/auth/auth-client"
import Image from "next/image"

type LoginButtonsProps = {
  returnTo?: string | null
}

export function LoginButtons({ returnTo }: LoginButtonsProps) {
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (provider: OAuthProvider) => {
    setPendingProvider(provider)
    setError(null)

    const { error: oauthError } = await signInWithOAuth({
      provider,
      returnTo,
      origin: window.location.origin,
    })

    if (oauthError) {
      setError("로그인을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.")
      setPendingProvider(null)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="ghost"
        className="h-auto w-full p-0 hover:bg-transparent"
        disabled={pendingProvider !== null}
        onClick={() => handleLogin("google")}
      >
        <Image
          src="/web_dark_rd_ctn.svg"
          alt="Google로 계속하기"
          width={200}
          height={28}
          className="h-10 w-auto object-contain"
        />
      </Button>

      {pendingProvider === "google" ? (
        <p className="text-center text-sm text-muted-foreground">
          Google 로그인 페이지로 이동 중...
        </p>
      ):null}
      {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
