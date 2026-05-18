import { NextResponse } from "next/server"
import {
  createRequestId,
  createRequestContextFromAuthUser,
  isMissingAuthSessionError,
  mapSupabaseUser,
} from "@/server/auth/request-context"
import { createSupabaseServerClient } from "@/server/auth/supabase-server"
import { logger } from "@/server/logger"
import { userService } from "@/server/users"
import { meResponseSchema } from "@/server/users/user-schema"

const route = "GET /api/me"

export async function GET() {
  const requestId = createRequestId()

  try {
    logger.debug("request.start", { requestId, route })

    const supabase = await createSupabaseServerClient()
    logger.debug("auth.get_user.start", { requestId, route })

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    logger.debug("auth.get_user.result", { requestId, route, hasUser: Boolean(user), userId: user?.id, error })

    if (error) {
      if (!isMissingAuthSessionError(error)) {
        throw error
      }

      logger.warn("auth.stale_session", { requestId, route, error })
      await clearStaleAuthSession(supabase, requestId)
    }

    const context = createRequestContextFromAuthUser(user, requestId)
    logger.debug("user.current.start", { requestId, route, userId: context.user?.id })

    const response = await userService.getCurrentUser(context, user ? mapSupabaseUser(user) : null)
    logger.debug("user.current.result", { requestId, route, authenticated: response.authenticated, userId: response.user?.id, onboardingCompleted: response.user?.onboardingCompleted })

    return NextResponse.json(meResponseSchema.parse(response))
  } catch (error) {
    logger.error("api.me.failed", { requestId, route, error })
    return NextResponse.json(
      { error: { code: "profile_sync_failed", message: "현재 사용자 정보를 동기화하지 못했습니다." } },
      { status: 500 },
    )
  }
}

async function clearStaleAuthSession(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  requestId: string,
) {
  logger.debug("auth.sign_out_local.start", { requestId, route })
  const { error } = await supabase.auth.signOut({ scope: "local" })
  if (error && !isMissingAuthSessionError(error)) {
    logger.error("auth.sign_out_local.failed", { requestId, route, error })
    return
  }

  logger.debug("auth.sign_out_local.result", { requestId, route, success: !error })
}
