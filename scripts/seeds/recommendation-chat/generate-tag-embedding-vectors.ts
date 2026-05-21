import { appendFile, mkdir, readFile, rm } from "node:fs/promises"
import path from "node:path"
import OpenAI from "openai"
import { loadEnvFiles } from "./env"
import { parseTagEmbeddingJsonl, type TagEmbeddingJsonlRow } from "./tag-embedding-jsonl"

const ROOT_DIR = process.cwd()
const INPUT_FILE = path.join(ROOT_DIR, "data", "seeds", "recommendation-chat", "movie-tag-embeddings.jsonl")
const OUTPUT_FILE = path.join(ROOT_DIR, "data", "seeds", "recommendation-chat", "movie-tag-embeddings-with-vectors.jsonl")
const BATCH_SIZE = 100

async function main() {
  await loadEnvFiles(ROOT_DIR)
  const options = parseArgs(process.argv.slice(2))
  const inputRows = parseTagEmbeddingJsonl(await readFile(INPUT_FILE, "utf8"))

  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
  if (options.reset) {
    await rm(OUTPUT_FILE, { force: true })
  }

  const existingRowsByTagId = await readExistingVectorRows()
  const pendingRows = inputRows.filter((row) => !existingRowsByTagId.has(row.tagId))

  if (pendingRows.length === 0) {
    console.log(`no pending embedding rows. output=${OUTPUT_FILE}`)
    return
  }

  const openai = new OpenAI()
  console.log(`creating ${pendingRows.length} tag embedding vectors. existing=${existingRowsByTagId.size} output=${OUTPUT_FILE}`)

  for (let index = 0; index < pendingRows.length; index += BATCH_SIZE) {
    const batch = pendingRows.slice(index, index + BATCH_SIZE)
    const embeddings = await createEmbeddings(openai, batch)
    const rows = batch.map((row, batchIndex) => ({
      ...row,
      embedding: embeddings[batchIndex],
    }))

    await appendFile(OUTPUT_FILE, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8")
    console.log(`wrote ${Math.min(index + batch.length, pendingRows.length)} / ${pendingRows.length} pending vectors`)
  }

  console.log(`wrote ${pendingRows.length} new embedding vectors to ${OUTPUT_FILE}`)
}

function parseArgs(args: string[]) {
  return {
    reset: args.includes("--reset"),
  }
}

async function readExistingVectorRows() {
  let text: string
  try {
    text = await readFile(OUTPUT_FILE, "utf8")
  } catch {
    return new Map<number, TagEmbeddingJsonlRow>()
  }

  const rows = parseTagEmbeddingJsonl(text)
  const missingEmbedding = rows.find((row) => !row.embedding)
  if (missingEmbedding) {
    throw new Error(`existing vector file has row without embedding. tagId=${missingEmbedding.tagId}`)
  }

  return new Map(rows.map((row) => [row.tagId, row]))
}

async function createEmbeddings(openai: OpenAI, rows: TagEmbeddingJsonlRow[]) {
  const response = await openai.embeddings.create({
    model: getEmbeddingModel(),
    input: rows.map((row) => row.embeddingInput),
  })
  const embeddings = response.data.map((item) => item.embedding)
  for (const [index, embedding] of embeddings.entries()) {
    if (embedding.length !== 1536) {
      throw new Error(`embedding dimension mismatch. tagId=${rows[index].tagId}`)
    }
  }
  return embeddings
}

function getEmbeddingModel() {
  return process.env.OPENAI_RECOMMENDATION_CHAT_EMBEDDING_MODEL ?? "text-embedding-3-small"
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
