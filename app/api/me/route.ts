import { NextResponse } from "next/server"
import {
  createRequestContextFromAuthUser,
  isMissingAuthSessionError,
  mapSupabaseUser,
} from "@/server/auth/request-context"
import { createSupabaseServerClient } from "@/server/auth/supabase-server"
import { userService } from "@/server/users"
import { meResponseSchema } from "@/server/users/user-schema"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error && !isMissingAuthSessionError(error)) {
      throw error
    }

    const context = createRequestContextFromAuthUser(user)
    const response = await userService.getCurrentUser(context, user ? mapSupabaseUser(user) : null)

    return NextResponse.json(meResponseSchema.parse(response))
  } catch (error) {
    logMeError(error)
    return NextResponse.json(
      { error: { code: "profile_sync_failed", message: "현재 사용자 정보를 동기화하지 못했습니다." } },
      { status: 500 },
    )
  }
}

function logMeError(error: unknown) {
  if (error instanceof Error) {
    const apiError = error as Error & { status?: number; code?: string }
    console.error("[api/me]", {
      name: apiError.name,
      status: apiError.status,
      code: apiError.code,
      message: apiError.message,
    })
    return
  }

  console.error("[api/me]", { error })
}
