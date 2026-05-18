import { NextResponse, type NextRequest } from "next/server"
import { resolvePostLoginRedirect } from "@/server/auth/auth-rules"
import { createRequestContextFromAuthUser, createRequestId, mapSupabaseUser } from "@/server/auth/request-context"
import { createSupabaseServerClient } from "@/server/auth/supabase-server"
import { logger } from "@/server/logger"
import { userService } from "@/server/users"

const route = "GET /auth/callback"

export async function GET(request: NextRequest) {
  const requestId = createRequestId()
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const returnTo = requestUrl.searchParams.get("returnTo")
  const oauthError = requestUrl.searchParams.get("error")

  logger.debug("request.start", { requestId, route, query: { hasCode: Boolean(code), returnTo, error: oauthError } })

  if (oauthError) {
    logger.warn("auth.callback.oauth_failed", { requestId, route, oauthError })
    return redirectToLogin(requestUrl, "oauth_failed", requestId)
  }

  if (!code) {
    logger.warn("auth.callback.invalid_callback", { requestId, route, reason: "missing_code" })
    return redirectToLogin(requestUrl, "invalid_callback", requestId)
  }

  const supabase = await createSupabaseServerClient()
  logger.debug("auth.exchange_code.start", { requestId, route })

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    logger.error("auth.exchange_code.failed", { requestId, route, error: exchangeError })
    return redirectToLogin(requestUrl, "session_exchange_failed", requestId)
  }

  logger.debug("auth.exchange_code.result", { requestId, route, success: true })
  logger.debug("auth.get_user.start", { requestId, route })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  logger.debug("auth.get_user.result", { requestId, route, hasUser: Boolean(user), userId: user?.id, error: userError })

  if (userError || !user) {
    logger.error("auth.get_user_after_exchange.failed", { requestId, route, error: userError ?? new Error("User is missing after session exchange") })
    return redirectToLogin(requestUrl, "session_exchange_failed", requestId)
  }

  try {
    const context = createRequestContextFromAuthUser(user, requestId)
    logger.debug("profile.sync.start", { requestId, route, userId: context.user?.id })

    const me = await userService.getCurrentUser(context, mapSupabaseUser(user))

    if (!me.authenticated) {
      logger.warn("profile.sync.unauthenticated", { requestId, route, userId: user.id })
      return redirectToLogin(requestUrl, "session_exchange_failed", requestId)
    }

    const redirectPath = resolvePostLoginRedirect({
      returnTo,
      onboardingCompleted: me.user.onboardingCompleted,
    })

    logger.info("auth.callback.success", { requestId, route, userId: me.user.id, onboardingCompleted: me.user.onboardingCompleted, redirectPath })

    return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
  } catch (error) {
    logger.error("profile.sync.failed", { requestId, route, userId: user.id, error })
    return redirectToLogin(requestUrl, "profile_sync_failed", requestId)
  }
}

function redirectToLogin(requestUrl: URL, error: string, requestId: string) {
  const loginUrl = new URL("/login", requestUrl.origin)
  loginUrl.searchParams.set("error", error)
  logger.debug("auth.callback.redirect_to_login", { requestId, route, error, redirectPath: `${loginUrl.pathname}${loginUrl.search}` })
  return NextResponse.redirect(loginUrl)
}
