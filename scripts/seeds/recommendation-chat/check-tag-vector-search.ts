import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import postgres from "postgres"
import { z } from "zod"
import { loadEnvFiles } from "./env"

type TagVectorSearchMatch = {
  rank: number
  tagId: number
  tag: string
  similarity: number
}

type TagVectorSearchReport = {
  generatedAt: string
  termGenerationModel: string | null
  embeddingModel: string
  topN: number
  minTop1Similarity: number
  thresholdCandidates: {
    minTop1Similarity: number
    passed: number
    failed: number
  }[]
  summary: {
    queryCount: number
    minTop1SimilarityPassed: number
    minTop1SimilarityFailed: number
    mappingExpectationCount: number
    mappingExpectationPassed: number
    mappingExpectationFailed: number
    expectedCheckCount: number
    expectedCheckPassed: number
    expectedCheckFailed: number
  }
  queries: {
    userTag: string
    embeddingTerms: string[]
    embeddingInput: string
    top1Tag: string | null
    top1Similarity: number | null
    expectedShouldMap: boolean
    minTop1SimilarityPassed: boolean
    mappingExpectationPassed: boolean
    expectedTags?: string[]
    expectedMatchFound?: boolean
    highestExpectedMatchRank?: number | null
    matches: TagVectorSearchMatch[]
  }[]
}

type TagVectorSearchRow = {
  tagId: number
  tag: string
  similarity: string | number
}

const ROOT_DIR = process.cwd()
const OUTPUT_FILE = path.join(ROOT_DIR, "data", "seeds", "recommendation-chat", "tag-vector-search-report.json")
const DEFAULT_TOP_N = 10
const DEFAULT_MIN_TOP_1_SIMILARITY = 0.45
const THRESHOLD_CANDIDATES = [0.45, 0.5, 0.55, 0.6]
const generatedTermsSchema = z.object({
  embeddingTerms: z.array(z.string().trim().min(1)).length(7),
})
const DEFAULT_POSITIVE_QUERY_SPECS: TagVectorSearchQuerySpec[] = [
  {
    userTag: "잔잔한",
    embeddingTerms: ["잔잔한", "차분한", "고요한", "느린 호흡", "감성적인", "일상 정서", "여운"],
    expectedTags: ["atmospheric", "wistful", "slow paced", "quiet", "mellow"],
  },
  {
    userTag: "우울한",
    embeddingTerms: ["우울한", "침울한", "먹먹한", "비극적 정서", "암울한 분위기", "상실감", "고독한 인물"],
    expectedTags: ["melancholy", "depression", "depressing", "bleak", "sad", "sad but good"],
  },
  {
    userTag: "액션 많은",
    embeddingTerms: ["액션 많은", "박진감", "격렬한 전투", "추격전", "몸싸움", "대규모 충돌", "위기 탈출"],
    expectedTags: ["action packed", "action", "good action", "realistic action", "dynamic cgi action"],
  },
  {
    userTag: "기발하고 엉뚱한",
    embeddingTerms: ["기발하고 엉뚱한", "독특한 상상력", "엉뚱한 상황", "초현실 분위기", "장난스러운 톤", "예측 불가 전개", "이상한 사건"],
    expectedTags: ["whimsical", "quirky", "surreal", "surrealism"],
  },
  {
    userTag: "어두운 범죄",
    embeddingTerms: ["어두운 범죄", "암울한 범죄", "음산한 사건", "느와르", "거친 범죄극", "살인 수사", "조직 범죄"],
    expectedTags: ["film noir", "noir thriller", "crime gone awry", "mob", "bank robbery", "robbery", "hit men", "gangs", "gritty"],
  },
  {
    userTag: "가볍고 웃긴",
    embeddingTerms: ["가볍고 웃긴", "유쾌한", "코믹한", "밝은 분위기", "장난스러운 톤", "소동극", "웃긴 상황"],
    expectedTags: ["comedy", "funny", "funny as hell", "humorous", "light", "goofy", "screwball comedy"],
  },
  {
    userTag: "좀비",
    embeddingTerms: ["좀비", "좀비물", "언데드", "감염 공포", "생존 위기", "집단 습격", "폐허 탈출"],
    expectedTags: ["zombie", "zombies"],
  },
  {
    userTag: "우주 배경",
    embeddingTerms: ["우주 배경", "외계 공간", "우주선", "SF 모험", "행성 탐사", "우주 항해", "은하 전쟁"],
    expectedTags: ["space", "space opera", "space program", "space travel", "sci-fi"],
  },
]
const DEFAULT_NEGATIVE_QUERY_SPECS: TagVectorSearchQuerySpec[] = [
  {
    userTag: "아무거나",
    embeddingTerms: ["아무거나", "상관없음", "무작위 선택", "넓은 조건", "특정 없음", "열린 요청", "조건 없음"],
    expectedShouldMap: false,
  },
  {
    userTag: "볼만한",
    embeddingTerms: ["볼만한", "무난한", "괜찮은", "일반 평가", "선택 기준", "가벼운 판단", "넓은 표현"],
    expectedShouldMap: false,
  },
  {
    userTag: "요즘",
    embeddingTerms: ["요즘", "최근 분위기", "현재성", "시기 표현", "근래 맥락", "최신 느낌", "시간 조건"],
    expectedShouldMap: false,
  },
  {
    userTag: "친구랑",
    embeddingTerms: ["친구랑", "동행 상황", "함께 보기", "사회적 맥락", "관람 상황", "여럿이 보기", "일행 조건"],
    expectedShouldMap: false,
  },
  {
    userTag: "저녁에",
    embeddingTerms: ["저녁에", "시간대", "밤 시간", "관람 시점", "일상 맥락", "퇴근 후", "시간 조건"],
    expectedShouldMap: false,
  },
  {
    userTag: "심심할 때",
    embeddingTerms: ["심심할 때", "기분 전환", "무료함", "가벼운 상황", "시간 때우기", "일상 맥락", "느슨한 요청"],
    expectedShouldMap: false,
  },
  {
    userTag: "OTT에서",
    embeddingTerms: ["OTT에서", "플랫폼 조건", "온라인 감상", "스트리밍", "시청 환경", "서비스 맥락", "접근 조건"],
    expectedShouldMap: false,
  },
]

async function main() {
  await loadEnvFiles(ROOT_DIR)
  const options = parseArgs(process.argv.slice(2))
  const termGenerationModel = process.env.OPENAI_RECOMMENDATION_CHAT_MODEL ?? "gpt-4.1-mini"
  const embeddingModel = process.env.OPENAI_RECOMMENDATION_CHAT_EMBEDDING_MODEL ?? "text-embedding-3-small"
  const databaseUrl = process.env.SUPABASE_POOLER_DATABASE_URL
  if (!databaseUrl) {
    throw new Error("SUPABASE_POOLER_DATABASE_URL is required.")
  }

  const openai = new OpenAI()
  const sql = postgres(databaseUrl, { max: 1, prepare: false })

  try {
    const report: TagVectorSearchReport = {
      generatedAt: new Date().toISOString(),
      termGenerationModel: options.generateTerms ? termGenerationModel : null,
      embeddingModel,
      topN: options.topN,
      minTop1Similarity: options.minTop1Similarity,
      thresholdCandidates: THRESHOLD_CANDIDATES.map((minTop1Similarity) => ({
        minTop1Similarity,
        passed: 0,
        failed: 0,
      })),
      summary: {
        queryCount: options.querySpecs.length,
        minTop1SimilarityPassed: 0,
        minTop1SimilarityFailed: 0,
        mappingExpectationCount: 0,
        mappingExpectationPassed: 0,
        mappingExpectationFailed: 0,
        expectedCheckCount: 0,
        expectedCheckPassed: 0,
        expectedCheckFailed: 0,
      },
      queries: [],
    }

    for (const querySpec of options.querySpecs) {
      const embeddingTerms = options.generateTerms
        ? await generateEmbeddingTerms(openai, {
            model: termGenerationModel,
            userTag: querySpec.userTag,
          })
        : querySpec.embeddingTerms
      const embeddingInput = embeddingTerms.join(" ")
      const embedding = await createEmbedding(openai, embeddingModel, embeddingInput)
      const matches = await listTopTagMatches(sql, {
        embedding,
        embeddingModel,
        topN: options.topN,
      })
      const expectedMatch = findExpectedMatch(matches, querySpec.expectedTags)
      const top1Tag = matches[0]?.tag ?? null
      const top1Similarity = matches[0]?.similarity ?? null
      const expectedShouldMap = querySpec.expectedShouldMap ?? true
      const minTop1SimilarityPassed =
        top1Similarity !== null && top1Similarity >= options.minTop1Similarity
      const mappingExpectationPassed = expectedShouldMap === minTop1SimilarityPassed

      for (const candidate of report.thresholdCandidates) {
        if (top1Similarity !== null && top1Similarity >= candidate.minTop1Similarity) {
          candidate.passed += 1
        } else {
          candidate.failed += 1
        }
      }

      if (minTop1SimilarityPassed) {
        report.summary.minTop1SimilarityPassed += 1
      } else {
        report.summary.minTop1SimilarityFailed += 1
      }

      report.summary.mappingExpectationCount += 1
      if (mappingExpectationPassed) {
        report.summary.mappingExpectationPassed += 1
      } else {
        report.summary.mappingExpectationFailed += 1
      }

      if (querySpec.expectedTags) {
        report.summary.expectedCheckCount += 1
        if (expectedMatch) {
          report.summary.expectedCheckPassed += 1
        } else {
          report.summary.expectedCheckFailed += 1
        }
      }

      report.queries.push({
        userTag: querySpec.userTag,
        embeddingTerms,
        embeddingInput,
        top1Tag,
        top1Similarity,
        expectedShouldMap,
        minTop1SimilarityPassed,
        mappingExpectationPassed,
        ...(querySpec.expectedTags
          ? {
              expectedTags: querySpec.expectedTags,
              expectedMatchFound: Boolean(expectedMatch),
              highestExpectedMatchRank: expectedMatch?.rank ?? null,
            }
          : {}),
        matches,
      })
    }

    await mkdir(path.dirname(options.outputFile), { recursive: true })
    await writeFile(options.outputFile, `${JSON.stringify(report, null, 2)}\n`, "utf8")
    console.log(`wrote tag vector search report to ${options.outputFile}`)
  } finally {
    await sql.end()
  }
}

function parseArgs(args: string[]) {
  const querySpecs: TagVectorSearchQuerySpec[] = []
  let topN = DEFAULT_TOP_N
  let minTop1Similarity = DEFAULT_MIN_TOP_1_SIMILARITY
  let outputFile = OUTPUT_FILE
  let generateTerms = false
  let scenario: "positive" | "negative" | "all" = "positive"

  for (const arg of args) {
    if (arg === "--generate-terms") {
      generateTerms = true
      continue
    }

    if (arg.startsWith("--scenario=")) {
      const value = arg.slice("--scenario=".length)
      if (value !== "positive" && value !== "negative" && value !== "all") {
        throw new Error("--scenario는 positive, negative, all 중 하나여야 합니다.")
      }
      scenario = value
      continue
    }

    if (arg.startsWith("--query=")) {
      const querySpec = parseQuerySpecArg(arg.slice("--query=".length))
      if (querySpec) {
        querySpecs.push(querySpec)
      }
      continue
    }

    if (arg.startsWith("--top=")) {
      const value = Number(arg.slice("--top=".length))
      if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error("--top은 양의 정수여야 합니다.")
      }
      topN = value
      continue
    }

    if (arg.startsWith("--min-top1-similarity=")) {
      const value = Number(arg.slice("--min-top1-similarity=".length))
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new Error("--min-top1-similarity는 0 이상 1 이하 숫자여야 합니다.")
      }
      minTop1Similarity = value
      continue
    }

    if (arg.startsWith("--output=")) {
      const value = arg.slice("--output=".length).trim()
      if (!value) {
        throw new Error("--output 값이 필요합니다.")
      }
      outputFile = path.isAbsolute(value) ? value : path.join(ROOT_DIR, value)
    }
  }

  return {
    querySpecs: querySpecs.length > 0 ? querySpecs : getDefaultQuerySpecs(scenario),
    topN,
    minTop1Similarity,
    outputFile,
    generateTerms,
  }
}

type TagVectorSearchQuerySpec = {
  userTag: string
  embeddingTerms: string[]
  expectedShouldMap?: boolean
  expectedTags?: string[]
}

function getDefaultQuerySpecs(scenario: "positive" | "negative" | "all") {
  if (scenario === "positive") {
    return DEFAULT_POSITIVE_QUERY_SPECS
  }
  if (scenario === "negative") {
    return DEFAULT_NEGATIVE_QUERY_SPECS
  }
  return [...DEFAULT_POSITIVE_QUERY_SPECS, ...DEFAULT_NEGATIVE_QUERY_SPECS]
}

function parseQuerySpecArg(value: string) {
  const [userTagValue, termsValue] = value.split("::")
  const userTag = userTagValue?.trim()
  if (!userTag) {
    return undefined
  }

  if (!termsValue) {
    throw new Error('--query는 "사용자태그::term1|term2|term3|term4|term5|term6|term7" 형식이어야 합니다.')
  }

  const embeddingTerms = termsValue
    .split("|")
    .map((term) => term.trim())
    .filter(Boolean)
  if (embeddingTerms.length !== 7) {
    throw new Error("--query embeddingTerms는 정확히 7개여야 합니다.")
  }
  if (embeddingTerms[0] !== userTag) {
    throw new Error("--query 첫 번째 embeddingTerm은 사용자태그와 동일해야 합니다.")
  }

  return { userTag, embeddingTerms }
}

async function generateEmbeddingTerms(
  openai: OpenAI,
  params: {
    model: string
    userTag: string
  },
) {
  const completion = await openai.chat.completions.parse({
    model: params.model,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: [
          "한국어 영화 추천 서비스의 사용자 태그를 vector search용 embeddingTerms로 확장한다.",
          "반드시 JSON schema에 맞게 embeddingTerms 배열만 반환한다.",
          "규칙:",
          "- 정확히 7개를 생성한다.",
          "- 첫 번째 term은 반드시 userTag 원문과 동일하게 둔다.",
          "- 나머지 6개는 한국어 중심의 짧은 표현으로 작성한다.",
          "- 나머지 6개는 좁은 동의어 또는 직접 관련 표현 2개, 핵심 소재/장르/분위기 표현 2개, 대표 서사 상황 또는 맥락 표현 2개로 구성한다.",
          "- 각 term은 1~3어절 이내로 작성한다.",
          "- 공백으로 join했을 때 자연스럽게 embedding input이 되는 짧은 표현만 사용하고, 문장형 설명은 쓰지 않는다.",
          "- 같은 의미의 단어를 반복하지 않고, userTag 의미를 넘어서는 넓은 확장을 하지 않는다.",
          "- 해당 태그가 붙은 콘텐츠의 속성만 넣고, 사용자의 의도나 추천 동작을 설명하는 표현은 넣지 않는다.",
          "- 영화, 작품, 태그, 추천, 취향, 보고 싶은, 찾는, 제외, 싫은, 피하고 싶은 표현은 넣지 않는다.",
          "- 단독 분위기 userTag는 분위기/정서 중심으로 확장한다.",
          "- 장르, 사건, 소재 표현은 userTag와 영화 맥락상 강하게 결합될 때만 포함한다.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({ userTag: params.userTag }),
      },
    ],
    response_format: zodResponseFormat(generatedTermsSchema, "recommendation_chat_embedding_terms"),
  })

  const parsed = completion.choices[0]?.message.parsed
  if (!parsed) {
    throw new Error(`embeddingTerms 생성에 실패했습니다. userTag=${params.userTag}`)
  }
  validateGeneratedEmbeddingTerms(params.userTag, parsed.embeddingTerms)
  return parsed.embeddingTerms
}

function validateGeneratedEmbeddingTerms(userTag: string, embeddingTerms: string[]) {
  if (embeddingTerms[0] !== userTag) {
    throw new Error(`첫 번째 embeddingTerm이 userTag와 다릅니다. userTag=${userTag} first=${embeddingTerms[0]}`)
  }

  const forbiddenTerms = ["영화", "작품", "태그", "추천", "취향", "보고 싶은", "찾는", "제외", "싫은", "피하고 싶은"]
  const invalidTerm = embeddingTerms.find((term) => forbiddenTerms.some((forbidden) => term.includes(forbidden)))
  if (invalidTerm) {
    throw new Error(`embeddingTerms에 금지 표현이 있습니다. userTag=${userTag} term=${invalidTerm}`)
  }
}

function findExpectedMatch(matches: TagVectorSearchMatch[], expectedTags?: string[]) {
  if (!expectedTags) {
    return undefined
  }

  const expectedTagSet = new Set(expectedTags)
  return matches.find((match) => expectedTagSet.has(match.tag))
}

async function createEmbedding(openai: OpenAI, embeddingModel: string, input: string) {
  const response = await openai.embeddings.create({
    model: embeddingModel,
    input,
  })
  const embedding = response.data[0]?.embedding
  if (!embedding || embedding.length !== 1536) {
    throw new Error(`embedding dimension mismatch. query=${input}`)
  }
  return embedding
}

async function listTopTagMatches(
  sql: postgres.Sql,
  params: {
    embedding: number[]
    embeddingModel: string
    topN: number
  },
) {
  const vectorLiteral = `[${params.embedding.join(",")}]`
  const rows = await sql<TagVectorSearchRow[]>`
    select
      e.tag_id as "tagId",
      t.tag,
      1 - (e.embedding <=> ${vectorLiteral}::vector) as similarity
    from public.movie_tag_mapping_embeddings e
    join public.movie_tags t on t.tag_id = e.tag_id
    where e.embedding_model = ${params.embeddingModel}
    order by e.embedding <=> ${vectorLiteral}::vector
    limit ${params.topN}
  `

  return rows.map((row, index) => ({
    rank: index + 1,
    tagId: row.tagId,
    tag: row.tag,
    similarity: Number(row.similarity),
  }))
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
