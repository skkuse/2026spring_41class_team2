import { createBrowserClient } from "@supabase/ssr"
import type { Provider } from "@supabase/supabase-js"

export type OAuthProvider = Extract<Provider, "google" | "kakao">

export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase browser environment variables are required")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export function buildAuthCallbackUrl(origin: string, returnTo?: string | null) {
  const url = new URL("/auth/callback", origin)
  if (returnTo) {
    url.searchParams.set("returnTo", returnTo)
  }

  return url.toString()
}

export async function signInWithOAuth(input: {
  provider: OAuthProvider
  returnTo?: string | null
  origin: string
  supabase?: ReturnType<typeof createBrowserSupabaseClient>
}) {
  const supabase = input.supabase ?? createBrowserSupabaseClient()
  return supabase.auth.signInWithOAuth({
    provider: input.provider,
    options: {
      redirectTo: buildAuthCallbackUrl(input.origin, input.returnTo),
    },
  })
}

export async function signOut(input: {
  supabase?: ReturnType<typeof createBrowserSupabaseClient>
} = {}) {
  const supabase = input.supabase ?? createBrowserSupabaseClient()
  return supabase.auth.signOut()
}

