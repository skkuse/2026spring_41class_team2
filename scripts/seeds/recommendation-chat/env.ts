import { readFile } from "node:fs/promises"
import path from "node:path"

export async function loadEnvFiles(rootDir: string) {
  for (const fileName of [".env.local", ".env"]) {
    let text: string
    try {
      text = await readFile(path.join(rootDir, fileName), "utf8")
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
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  }
}

