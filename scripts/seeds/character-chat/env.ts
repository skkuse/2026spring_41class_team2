import { readFile } from "node:fs/promises"
import path from "node:path"

export const ROOT_DIR = process.cwd()

export async function loadEnvFiles() {
  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(ROOT_DIR, fileName)
    let text: string

    try {
      text = await readFile(filePath, "utf8")
    } catch {
      continue
    }

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim()

      if (!line || line.startsWith("#")) {
        continue
      }

      const equalsIndex = line.indexOf("=")

      if (equalsIndex === -1) {
        continue
      }

      const key = line.slice(0, equalsIndex).trim()
      let value = line.slice(equalsIndex + 1).trim()

      if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  }
}

export function getSupabaseServiceEnv() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_URL 환경 변수가 필요합니다.")
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다.")
  }

  return { supabaseUrl, serviceRoleKey }
}
