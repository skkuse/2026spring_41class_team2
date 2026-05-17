"use client"

import { Suspense, useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"

type MeResponse =
  | { authenticated: false; user: null }
  | { authenticated: true; user: { onboardingCompleted: boolean } }

type ProtectedPageProps = {
  children: ReactNode
  requireOnboardingCompleted?: boolean
}

export function ProtectedPage({ children, requireOnboardingCompleted = false }: ProtectedPageProps) {
  return (
    <Suspense fallback={<ProtectedPageFallback />}>
      <ProtectedPageContent requireOnboardingCompleted={requireOnboardingCompleted}>
        {children}
      </ProtectedPageContent>
    </Suspense>
  )
}

function ProtectedPageContent({ children, requireOnboardingCompleted = false }: ProtectedPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      const response = await fetch("/api/me", { cache: "no-store" })
      const me = (await response.json()) as MeResponse

      if (cancelled) {
        return
      }

      if (!response.ok || !me.authenticated) {
        const returnTo = `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`
        router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`)
        return
      }

      if (requireOnboardingCompleted && !me.user.onboardingCompleted) {
        router.replace("/onboarding")
        return
      }

      setAllowed(true)
    }

    checkAuth().catch(() => {
      if (!cancelled) {
        router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`)
      }
    })

    return () => {
      cancelled = true
    }
  }, [pathname, requireOnboardingCompleted, router, searchParams])

  if (!allowed) {
    return <ProtectedPageFallback />
  }

  return children
}

function ProtectedPageFallback() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Spinner />
    </div>
  )
}
