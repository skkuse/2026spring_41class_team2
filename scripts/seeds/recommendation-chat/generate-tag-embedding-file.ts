import { appendFile, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import os from "node:os"
import path from "node:path"
import { z } from "zod"
import { parseTagEmbeddingJsonl } from "./tag-embedding-jsonl"

type SourceTag = {
  tagId: number
  tag: string
}

type GeneratedTagEmbeddingRow = SourceTag & {
  labelKo: string
  embeddingInput: string
}

const ROOT_DIR = process.cwd()
const SOURCE_FILE = path.join(ROOT_DIR, "data", "seeds", "movie-recommendation", "generated", "movie_tags_seed.csv")
const OUTPUT_DIR = path.join(ROOT_DIR, "data", "seeds", "recommendation-chat")
const OUTPUT_FILE = path.join(OUTPUT_DIR, "movie-tag-embeddings.jsonl")
const BATCH_OUTPUT_DIR = path.join(OUTPUT_DIR, "movie-tag-embedding-batches")
const BATCH_SIZE = 100
const PARALLEL_CODEX_SESSIONS = 4
const MAX_LOCALIZE_ATTEMPTS = 4

const codexOutputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    tags: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          tagId: { type: "integer" },
          tag: { type: "string" },
          labelKo: { type: "string" },
          embeddingInput: { type: "string" },
        },
        required: ["tagId", "tag", "labelKo", "embeddingInput"],
      },
    },
  },
  required: ["tags"],
}

const localizedBatchSchema = z.object({
  tags: z.array(
    z.object({
      tagId: z.number().int(),
      tag: z.string().min(1),
      labelKo: z.string().min(1),
      embeddingInput: z.string().min(1),
    }),
  ),
})

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const sourceRows = await readSourceTags()
  const limitedSourceRows = options.limit ? sourceRows.slice(0, options.limit) : sourceRows

  await mkdir(OUTPUT_DIR, { recursive: true })
  if (options.reset) {
    await rm(OUTPUT_FILE, { force: true })
    await rm(BATCH_OUTPUT_DIR, { recursive: true, force: true })
  }
  await mkdir(BATCH_OUTPUT_DIR, { recursive: true })

  const existingTagIds = await readExistingTagIds()
  const pendingRows = limitedSourceRows.filter((row) => !existingTagIds.has(row.tagId))

  if (pendingRows.length === 0) {
    console.log(`no pending rows. output=${OUTPUT_FILE}`)
    return
  }

  console.log(
    `generating ${pendingRows.length} rows. existing=${existingTagIds.size} batchSize=${BATCH_SIZE} parallel=${PARALLEL_CODEX_SESSIONS} output=${OUTPUT_FILE}`,
  )

  const batches = chunkRows(pendingRows, BATCH_SIZE)
  let appendedCount = 0

  for (let waveIndex = 0; waveIndex < batches.length; waveIndex += PARALLEL_CODEX_SESSIONS) {
    const waveBatches = batches.slice(waveIndex, waveIndex + PARALLEL_CODEX_SESSIONS)
    const waveNumber = Math.floor(waveIndex / PARALLEL_CODEX_SESSIONS) + 1
    const totalWaves = Math.ceil(batches.length / PARALLEL_CODEX_SESSIONS)
    console.log(`starting wave ${waveNumber}/${totalWaves}. batches=${waveBatches.length}`)

    const batchFiles = await Promise.all(waveBatches.map((batch) => createValidatedBatchFile(batch)))

    for (const batchFile of batchFiles) {
      await appendFile(OUTPUT_FILE, await readFile(batchFile.filePath, "utf8"), "utf8")
      appendedCount += batchFile.rowCount
    }

    console.log(`appended ${appendedCount} / ${pendingRows.length} pending rows`)
  }

  console.log(`wrote ${pendingRows.length} new rows to ${OUTPUT_FILE}`)
}

function parseArgs(args: string[]) {
  let limit: number | undefined
  let reset = false

  for (const arg of args) {
    if (arg === "--reset") {
      reset = true
      continue
    }

    if (arg.startsWith("--limit=")) {
      const value = Number(arg.slice("--limit=".length))
      if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error("--limit은 양의 정수여야 합니다.")
      }
      limit = value
    }
  }

  return { limit, reset }
}

async function readSourceTags() {
  const text = await readFile(SOURCE_FILE, "utf8")
  const lines = text.split(/\r?\n/).filter(Boolean)
  const header = lines.shift()
  if (header !== "tag_id,tag") {
    throw new Error("movie_tags_seed.csv 헤더가 올바르지 않습니다.")
  }

  return lines
    .map((line) => {
      const commaIndex = line.indexOf(",")
      const tagId = Number(line.slice(0, commaIndex))
      const tag = line.slice(commaIndex + 1)
      if (!Number.isSafeInteger(tagId) || !tag) {
        throw new Error(`movie_tags_seed.csv 행이 올바르지 않습니다. line=${line}`)
      }

      return { tagId, tag }
    })
    .sort((a, b) => a.tagId - b.tagId)
}

async function readExistingTagIds() {
  let text: string
  try {
    text = await readFile(OUTPUT_FILE, "utf8")
  } catch {
    return new Set<number>()
  }

  return new Set(parseTagEmbeddingJsonl(text).map((row) => row.tagId))
}

function chunkRows<T>(rows: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size))
  }
  return chunks
}

async function createValidatedBatchFile(batch: SourceTag[]) {
  const localizedBatch = await localizeTagBatchWithRetry(batch)
  const rows = localizedBatch.map(buildJsonlRow)
  const warnings = rows.flatMap(buildQualityWarnings)
  for (const warning of warnings) {
    console.warn(warning)
  }

  const filePath = buildBatchOutputFilePath(batch)
  await writeFile(filePath, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8")
  await validateBatchOutputFile(batch, filePath)
  return { filePath, rowCount: rows.length }
}

function buildBatchOutputFilePath(batch: SourceTag[]) {
  const firstTagId = batch[0]?.tagId
  const lastTagId = batch.at(-1)?.tagId
  if (!firstTagId || !lastTagId) {
    throw new Error("빈 batch는 파일로 저장할 수 없습니다.")
  }

  return path.join(BATCH_OUTPUT_DIR, `movie-tag-embeddings-${String(firstTagId).padStart(4, "0")}-${String(lastTagId).padStart(4, "0")}.jsonl`)
}

async function validateBatchOutputFile(batch: SourceTag[], filePath: string) {
  const rows = parseTagEmbeddingJsonl(await readFile(filePath, "utf8"))
  if (rows.length !== batch.length) {
    throw new Error(`batch 파일 행 개수가 올바르지 않습니다. file=${filePath} expected=${batch.length} actual=${rows.length}`)
  }

  const expectedTagsById = new Map(batch.map((row) => [row.tagId, row.tag]))
  for (const row of rows) {
    const expectedTag = expectedTagsById.get(row.tagId)
    if (!expectedTag) {
      throw new Error(`batch 파일에 요청하지 않은 tagId가 있습니다. file=${filePath} tagId=${row.tagId}`)
    }
    if (expectedTag !== row.tag) {
      throw new Error(`batch 파일 tag 문자열이 원본과 다릅니다. file=${filePath} tagId=${row.tagId}`)
    }
  }
}

async function localizeTagBatchWithRetry(batch: SourceTag[]) {
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_LOCALIZE_ATTEMPTS; attempt += 1) {
    try {
      const output = await runCodexTagBatch(batch, attempt)
      return validateLocalizedTagBatch(batch, output.tags)
    } catch (error) {
      lastError = error
      if (attempt < MAX_LOCALIZE_ATTEMPTS) {
        console.warn(`retrying codex tag batch. firstTagId=${batch[0]?.tagId} attempt=${attempt + 1}`)
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Codex 태그 변환에 실패했습니다.")
}

async function runCodexTagBatch(batch: SourceTag[], attempt: number) {
  const firstTagId = batch[0]?.tagId
  if (!firstTagId) {
    throw new Error("빈 batch는 Codex로 처리할 수 없습니다.")
  }

  const tmpDir = path.join(os.tmpdir(), `cinemate-tag-labels-${process.pid}-${firstTagId}-${Date.now()}-${attempt}`)
  await mkdir(tmpDir, { recursive: true })
  const schemaFile = path.join(tmpDir, "schema.json")
  const outputFile = path.join(tmpDir, "output.json")
  await writeFile(schemaFile, JSON.stringify(codexOutputSchema), "utf8")

  const prompt = buildCodexPrompt(batch)
  await runCommand("codex", [
    "--ask-for-approval",
    "never",
    "exec",
    "--cd",
    ROOT_DIR,
    "--sandbox",
    "read-only",
    "--output-schema",
    schemaFile,
    "--output-last-message",
    outputFile,
    "--color",
    "never",
    prompt,
  ])

  const outputText = await readFile(outputFile, "utf8")
  return localizedBatchSchema.parse(JSON.parse(outputText))
}

function buildCodexPrompt(batch: SourceTag[]) {
  return [
    "다음 movie tag seed batch에 대해 한국어 labelKo와 embeddingInput을 생성해줘.",
    "반드시 JSON만 최종 응답으로 반환해.",
    "",
    "응답 필드:",
    "- tagId",
    "- tag",
    "- labelKo",
    "- embeddingInput",
    "",
    "규칙:",
    "- 입력의 tagId와 tag를 그대로 복사해. 새 tagId를 만들거나 tag 문자열을 수정하지 마.",
    "- 입력 항목마다 정확히 1개씩 반환해. 누락, 추가, 중복 금지.",
    "- labelKo는 짧고 자연스러운 한국어 라벨로 작성해. 숫자, 고유명사, 브랜드, 약어, 인명, 작품명은 그대로 둬도 돼.",
    "- labelKo도 embeddingInput에 포함되므로 '영화', '작품', '태그', '추천', '취향'을 쓰지 마.",
    "- embeddingInput은 설명문이 아니라 공백으로 구분된 키워드/짧은 구문만 작성해.",
    "- embeddingInput은 한 줄 문자열로 작성해.",
    "- 쉼표, 세미콜론, bullet, 줄바꿈을 쓰지 않고 공백만 사용해.",
    "- 앞뒤 공백과 중복 공백을 넣지 마.",
    "- 각 표현은 공백 기준 1~3단어 이내로 작성해.",
    "- 표현 수는 원문 tag와 labelKo를 포함해 8~20개로 작성해.",
    "- 원문 tag 문자열을 반드시 포함해.",
    "- 한국어 labelKo 문자열을 반드시 포함해.",
    "- 한국어 표현을 중심으로 작성해.",
    "- 사용자의 userTags로 나올 법한 짧은 표현을 포함해.",
    "- 핵심 소재, 분위기, 장르, 서사 상황을 조합해 작성해.",
    "- 같은 의미 단어를 반복하지 마.",
    "- embeddingInput에는 그 태그가 붙은 콘텐츠의 속성만 넣어.",
    "- 사용자의 의도, 추천 동작, 검색 동작, 제외 의도, 선호 여부를 설명하는 표현은 넣지 마.",
    "- '영화', '작품', '태그', '추천', '취향'은 사용하지 마.",
    "- 문장형 설명, 조사 많은 줄글, '영화 특성이다' 같은 표현은 쓰지 마.",
    "- tag 의미 밖으로 과잉 확장하지 마.",
    "- 여러 뜻이 가능한 tag는 영화 데이터셋의 태그 의미에 맞는 표현만 사용해.",
    "- 단어의 일반 사전 의미, 색상, 장소, 물건, 일상 용례로 임의 확장하지 마.",
    "- tag 자체가 특정 작품, 인물, 프랜차이즈가 아닌 이상 구체적인 영화 제목이나 인물명은 만들지 마.",
    "",
    "좋은 예:",
    'tag=dark labelKo=어두운 분위기 embeddingInput="dark 어두운 분위기 암울한 톤 음산함 비극적 정서 noir bleak grim"',
    'tag=bad plot labelKo=허술한 줄거리 embeddingInput="bad plot 허술한 줄거리 개연성 부족 빈약한 서사 설득력 낮음 억지 전개 동기 부족 결말 허술"',
    "",
    "나쁜 예:",
    'tag=dark embeddingInput="dark 검은색 밤 조명 부족 어두운 화면 피부색 다크모드"',
    'tag=bad plot embeddingInput="bad plot 피하고 싶은 줄거리 보기 싫은 전개 추천 제외 취향 아님"',
    "",
    "입력:",
    JSON.stringify({ requiredTags: batch }, null, 2),
  ].join("\n")
}

function validateLocalizedTagBatch(batch: SourceTag[], items: GeneratedTagEmbeddingRow[]) {
  if (items.length !== batch.length) {
    throw new Error(`응답 개수가 요청 개수와 다릅니다. expected=${batch.length} actual=${items.length}`)
  }

  const expectedTagsById = new Map(batch.map((row) => [row.tagId, row.tag]))
  const localizedRows = new Map<number, GeneratedTagEmbeddingRow>()

  for (const item of items) {
    const expectedTag = expectedTagsById.get(item.tagId)
    if (!expectedTag) {
      throw new Error(`요청하지 않은 tagId가 반환되었습니다. tagId=${item.tagId}`)
    }
    if (expectedTag !== item.tag) {
      throw new Error(`tag 문자열이 원본과 다릅니다. tagId=${item.tagId} expected=${expectedTag} actual=${item.tag}`)
    }
    if (localizedRows.has(item.tagId)) {
      throw new Error(`중복 tagId가 반환되었습니다. tagId=${item.tagId}`)
    }

    localizedRows.set(item.tagId, {
      tagId: item.tagId,
      tag: item.tag,
      labelKo: item.labelKo.trim(),
      embeddingInput: item.embeddingInput.trim(),
    })
  }

  const missingIds = batch.map((row) => row.tagId).filter((tagId) => !localizedRows.has(tagId))
  if (missingIds.length > 0) {
    throw new Error(`한국어 태그 변환 결과가 누락되었습니다. tagIds=${missingIds.join(",")}`)
  }

  return batch.map((row) => localizedRows.get(row.tagId)!)
}

function buildJsonlRow(row: GeneratedTagEmbeddingRow) {
  return {
    tagId: row.tagId,
    tag: row.tag,
    labelKo: row.labelKo,
    embeddingInput: row.embeddingInput,
  }
}

function buildQualityWarnings(row: GeneratedTagEmbeddingRow) {
  const warnings: string[] = []
  if (row.labelKo === row.tag) {
    warnings.push(`warning: labelKo equals source tag. tagId=${row.tagId} tag=${row.tag}`)
  }
  if (!row.embeddingInput.includes(row.tag)) {
    warnings.push(`warning: embeddingInput does not contain source tag. tagId=${row.tagId} tag=${row.tag}`)
  }
  if (!row.embeddingInput.includes(row.labelKo)) {
    warnings.push(`warning: embeddingInput does not contain labelKo. tagId=${row.tagId} tag=${row.tag}`)
  }
  if (/[\n\r,;•]/.test(row.embeddingInput)) {
    warnings.push(`warning: embeddingInput contains invalid separator. tagId=${row.tagId} tag=${row.tag}`)
  }
  if (/(영화|작품|태그|추천|취향)/.test(row.embeddingInput)) {
    warnings.push(`warning: embeddingInput contains forbidden generic wording. tagId=${row.tagId} tag=${row.tag}`)
  }
  if (/\s{2,}/.test(row.embeddingInput) || row.embeddingInput !== row.embeddingInput.trim()) {
    warnings.push(`warning: embeddingInput contains extra whitespace. tagId=${row.tagId} tag=${row.tag}`)
  }
  if (/(사용자|관객|추천|선호|취향|원한다|찾는다|피한다|어울린다|맞는다|원할 때|찾을 때|피하고 싶|보기 싫|제외|검색해|검색용|검색어)/.test(row.embeddingInput)) {
    warnings.push(`warning: embeddingInput contains user-intent wording. tagId=${row.tagId} tag=${row.tag}`)
  }
  return warnings
}

async function runCommand(command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT_DIR, stdio: ["ignore", "pipe", "pipe"] })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8")
    })
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8")
    })
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) {
        const tokenUsage = findCodexTokenUsage(`${stdout}\n${stderr}`)
        if (tokenUsage) {
          console.log(`codex tokens used=${tokenUsage}`)
        }
        resolve()
        return
      }
      reject(new Error(`${command} exited with code ${code}: ${stderr.slice(-4000)}`))
    })
  })
}

function findCodexTokenUsage(output: string) {
  const matches = [...output.matchAll(/tokens used\s+([\d,]+)/gi)]
  return matches.at(-1)?.[1]
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
