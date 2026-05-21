import { readFile } from "node:fs/promises"
import path from "node:path"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { loadEnvFiles } from "./env"
import { parseTagEmbeddingJsonl } from "./tag-embedding-jsonl"

const ROOT_DIR = process.cwd()
const SOURCE_FILE = path.join(ROOT_DIR, "data", "seeds", "recommendation-chat", "movie-tag-embeddings.jsonl")
const VECTOR_FILE = path.join(ROOT_DIR, "data", "seeds", "recommendation-chat", "movie-tag-embeddings-with-vectors.jsonl")

async function main() {
  await loadEnvFiles(ROOT_DIR)
  const sourceRows = parseTagEmbeddingJsonl(await readFile(SOURCE_FILE, "utf8"))
  const vectorRows = parseTagEmbeddingJsonl(await readFile(VECTOR_FILE, "utf8"))

  validateVectorRows(sourceRows, vectorRows)
  await validateSupabaseMovieTags(vectorRows)

  console.log(`validated ${vectorRows.length} tag embedding vector rows`)
}

function validateVectorRows(sourceRows: ReturnType<typeof parseTagEmbeddingJsonl>, vectorRows: ReturnType<typeof parseTagEmbeddingJsonl>) {
  if (vectorRows.length !== sourceRows.length) {
    throw new Error(`vector row count mismatch. expected=${sourceRows.length} actual=${vectorRows.length}`)
  }

  const sourceTagsById = new Map(sourceRows.map((row) => [row.tagId, row.tag]))
  for (const row of vectorRows) {
    const sourceTag = sourceTagsById.get(row.tagId)
    if (!sourceTag) {
      throw new Error(`vector file has unknown tagId. tagId=${row.tagId}`)
    }
    if (sourceTag !== row.tag) {
      throw new Error(`vector file tag mismatch. tagId=${row.tagId} expected=${sourceTag} actual=${row.tag}`)
    }
    if (!row.embedding) {
      throw new Error(`vector file row has no embedding. tagId=${row.tagId}`)
    }
  }
}

async function validateSupabaseMovieTags(rows: ReturnType<typeof parseTagEmbeddingJsonl>) {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.")
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const dbRows = await listMovieTags(supabase)
  const expectedTagsById = new Map(rows.map((row) => [row.tagId, row.tag]))
  const dbTagsById = new Map(dbRows.map((row) => [row.tag_id, row.tag]))

  const missingInDb = rows.filter((row) => !dbTagsById.has(row.tagId))
  if (missingInDb.length > 0) {
    throw new Error(`movie_tags missing tagIds. tagIds=${missingInDb.map((row) => row.tagId).join(",")}`)
  }

  const extraInDb = dbRows.filter((row) => !expectedTagsById.has(row.tag_id))
  if (extraInDb.length > 0) {
    throw new Error(`vector file missing DB tagIds. tagIds=${extraInDb.map((row) => row.tag_id).join(",")}`)
  }

  for (const row of rows) {
    const dbTag = dbTagsById.get(row.tagId)
    if (dbTag !== row.tag) {
      throw new Error(`movie_tags tag mismatch. tagId=${row.tagId} expected=${row.tag} actual=${dbTag}`)
    }
  }
}

async function listMovieTags(supabase: SupabaseClient) {
  const rows: { tag_id: number; tag: string }[] = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from("movie_tags").select("tag_id, tag").order("tag_id", { ascending: true }).range(from, from + pageSize - 1)
    if (error) {
      throw error
    }
    rows.push(...((data ?? []) as { tag_id: number; tag: string }[]))
    if (!data || data.length < pageSize) {
      break
    }
  }
  return rows
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
