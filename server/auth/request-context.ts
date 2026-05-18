import "server-only"

import { randomUUID } from "node:crypto"
import type { User } from "@supabase/supabase-js"
import type { AuthUser, RequestContext } from "./auth-types"
import { createSupabaseServerClient } from "./supabase-server"

export function createRequestId() {
  return randomUUID()
}

export function createRequestContextFromAuthUser(user: User | null, requestId = createRequestId()): RequestContext {
  return {
    requestId,
    user: user?.email
      ? {
          id: user.id,
          email: user.email,
        }
      : null,
  }
}

export async function createOptionalRequestContext(requestId = createRequestId()) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isMissingAuthSessionError(error)) {
    throw error
  }

  return createRequestContextFromAuthUser(error ? null : user, requestId)
}

export function mapSupabaseUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    userMetadata: user.user_metadata,
  }
}

export function isMissingAuthSessionError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false
  }

  const authError = error as { code?: string; name?: string; message?: string; status?: number }
  return (
    authError.name === "AuthSessionMissingError" ||
    authError.message?.toLowerCase().includes("session missing") ||
    authError.message?.toLowerCase().includes("auth session missing") ||
    authError.code === "refresh_token_not_found" ||
    authError.code === "invalid_refresh_token" ||
    authError.status === 401
  )
}
