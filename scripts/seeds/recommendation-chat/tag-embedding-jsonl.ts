import { readFile } from "node:fs/promises"

export type TagEmbeddingJsonlRow = {
  tagId: number
  tag: string
  labelKo: string
  embeddingInput: string
  embedding?: number[]
}

export function parseTagEmbeddingJsonl(text: string) {
  const rows: TagEmbeddingJsonlRow[] = []
  const seenTagIds = new Set<number>()

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const lineNumber = index + 1
    if (!line.trim()) {
      continue
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(line)
    } catch (error) {
      throw new Error(`line ${lineNumber}: JSON 형식이 올바르지 않습니다.`, { cause: error })
    }

    const row = validateTagEmbeddingJsonlRow(parsed, lineNumber)
    if (seenTagIds.has(row.tagId)) {
      throw new Error(`line ${lineNumber}: tagId가 중복되었습니다. tagId=${row.tagId}`)
    }
    seenTagIds.add(row.tagId)
    rows.push(row)
  }

  return rows
}

export async function readTagEmbeddingJsonlFile(filePath: string) {
  return parseTagEmbeddingJsonl(await readFile(filePath, "utf8"))
}

function validateTagEmbeddingJsonlRow(value: unknown, lineNumber: number): TagEmbeddingJsonlRow {
  if (typeof value !== "object" || value === null) {
    throw new Error(`line ${lineNumber}: 객체가 필요합니다.`)
  }

  const row = value as Partial<TagEmbeddingJsonlRow>
  if (!Number.isSafeInteger(row.tagId)) {
    throw new Error(`line ${lineNumber}: tagId 정수가 필요합니다.`)
  }

  for (const key of ["tag", "labelKo", "embeddingInput"] as const) {
    if (typeof row[key] !== "string" || row[key]!.trim() === "") {
      throw new Error(`line ${lineNumber}: ${key} 문자열이 필요합니다.`)
    }
  }

  if (row.embedding !== undefined) {
    if (!Array.isArray(row.embedding) || row.embedding.length !== 1536 || row.embedding.some((item) => typeof item !== "number")) {
      throw new Error(`line ${lineNumber}: embedding은 1536차원 number 배열이어야 합니다.`)
    }
  }

  const tagId = row.tagId as number
  const tag = row.tag as string
  const labelKo = row.labelKo as string
  const embeddingInput = row.embeddingInput as string

  return {
    tagId,
    tag,
    labelKo,
    embeddingInput,
    ...(row.embedding ? { embedding: row.embedding } : {}),
  }
}
