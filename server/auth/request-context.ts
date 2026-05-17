import "server-only"

import { randomUUID } from "node:crypto"
import type { User } from "@supabase/supabase-js"
import type { AuthUser, RequestContext } from "./auth-types"

export function createRequestContextFromAuthUser(user: User | null): RequestContext {
  return {
    requestId: randomUUID(),
    user: user?.email
      ? {
          id: user.id,
          email: user.email,
        }
      : null,
  }
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

  const authError = error as { name?: string; message?: string; status?: number }
  return (
    authError.name === "AuthSessionMissingError" ||
    authError.message?.toLowerCase().includes("session missing") ||
    authError.message?.toLowerCase().includes("auth session missing") ||
    authError.status === 401
  )
}
