import "server-only"

import { createClient } from "@supabase/supabase-js"

const CHARACTER_IMAGE_BUCKET = "character-images"
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60

export function createSupabaseCharacterChatAvatarUrlSigner() {
  return {
    async sign(path: string) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Supabase storage environment variables are required")
      }

      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
      const { data, error } = await supabase.storage
        .from(CHARACTER_IMAGE_BUCKET)
        .createSignedUrl(path, SIGNED_URL_EXPIRES_IN_SECONDS)

      if (error || !data?.signedUrl) {
        throw new Error(`Failed to sign character image URL. path=${path}`)
      }

      return data.signedUrl
    },
  }
}
