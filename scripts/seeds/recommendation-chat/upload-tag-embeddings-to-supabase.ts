import { readFile } from "node:fs/promises"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"
import { loadEnvFiles } from "./env"
import { parseTagEmbeddingJsonl } from "./tag-embedding-jsonl"

const ROOT_DIR = process.cwd()
const INPUT_FILE = path.join(ROOT_DIR, "data", "seeds", "recommendation-chat", "movie-tag-embeddings-with-vectors.jsonl")
const BATCH_SIZE = 100

async function main() {
  await loadEnvFiles(ROOT_DIR)
  const rows = parseTagEmbeddingJsonl(await readFile(INPUT_FILE, "utf8"))
  const missingEmbedding = rows.find((row) => !row.embedding)
  if (missingEmbedding) {
    throw new Error(`embedding is required before upload. tagId=${missingEmbedding.tagId}`)
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.")
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE)
    const { error } = await supabase.from("movie_tag_mapping_embeddings").upsert(
      batch.map((row) => ({
        tag_id: row.tagId,
        embedding_model: getEmbeddingModel(),
        embedding: row.embedding,
      })),
      { onConflict: "tag_id,embedding_model" },
    )

    if (error) {
      throw error
    }
  }

  console.log(`uploaded ${rows.length} tag embeddings`)
}

function getEmbeddingModel() {
  return process.env.OPENAI_RECOMMENDATION_CHAT_EMBEDDING_MODEL ?? "text-embedding-3-small"
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
