import { NextResponse, type NextRequest } from "next/server"
import { resolvePostLoginRedirect } from "@/server/auth/auth-rules"
import { createRequestContextFromAuthUser, mapSupabaseUser } from "@/server/auth/request-context"
import { createSupabaseServerClient } from "@/server/auth/supabase-server"
import { userService } from "@/server/users"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const returnTo = requestUrl.searchParams.get("returnTo")
  const oauthError = requestUrl.searchParams.get("error")

  if (oauthError) {
    return redirectToLogin(requestUrl, "oauth_failed")
  }

  if (!code) {
    return redirectToLogin(requestUrl, "invalid_callback")
  }

  const supabase = await createSupabaseServerClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return redirectToLogin(requestUrl, "session_exchange_failed")
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return redirectToLogin(requestUrl, "session_exchange_failed")
  }

  try {
    const context = createRequestContextFromAuthUser(user)
    const me = await userService.getCurrentUser(context, mapSupabaseUser(user))

    if (!me.authenticated) {
      return redirectToLogin(requestUrl, "session_exchange_failed")
    }

    const redirectPath = resolvePostLoginRedirect({
      returnTo,
      onboardingCompleted: me.user.onboardingCompleted,
    })

    return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
  } catch {
    return redirectToLogin(requestUrl, "profile_sync_failed")
  }
}

function redirectToLogin(requestUrl: URL, error: string) {
  const loginUrl = new URL("/login", requestUrl.origin)
  loginUrl.searchParams.set("error", error)
  return NextResponse.redirect(loginUrl)
}

