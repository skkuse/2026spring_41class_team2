import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import postgres from "postgres"
import { recommendationChatAnalysisSchema } from "../../../server/recommendation-chat/recommendation-chat-schema"
import type { RecommendationChatAnalysis, AvailableRecommendationChatOptions } from "../../../server/recommendation-chat/recommendation-chat-types"
import { loadEnvFiles } from "./env"

type SmokeCase = {
  name: string
  message: string
  expectedIntent: RecommendationChatAnalysis["intent"]
  expectedUserTags?: string[]
  forbiddenUserTags?: string[]
  expectedExcludedTerms?: string[]
}

type SmokeCaseReport = SmokeCase & {
  passed: boolean
  failures: string[]
  analysis: RecommendationChatAnalysis
  vectorMatches: UserTagVectorMatches[]
}

type UserTagVectorMatches = {
  userTag: string
  embeddingInput: string
  matches: TagVectorMatch[]
}

type TagVectorMatch = {
  rank: number
  tagId: number
  tag: string
  similarity: number
}

type TagVectorSearchRow = {
  tagId: number
  tag: string
  similarity: string | number
}

type SmokeReport = {
  generatedAt: string
  model: string
  embeddingModel: string
  summary: {
    caseCount: number
    passed: number
    failed: number
  }
  cases: SmokeCaseReport[]
}

const ROOT_DIR = process.cwd()
const OUTPUT_FILE = path.join(ROOT_DIR, "data", "seeds", "recommendation-chat", "analysis-smoke-report.json")
const SUMMARY_OUTPUT_FILE = path.join(ROOT_DIR, "data", "seeds", "recommendation-chat", "analysis-smoke-summary.md")
const DEFAULT_CONCURRENCY = 6
const DEFAULT_VECTOR_TOP_N = 3
const DEFAULT_SMOKE_CASES: SmokeCase[] = [
  {
    name: "positive lingering Japanese romance",
    message: "잔잔하고 여운 남는 일본 로맨스 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["잔잔", "여운"],
  },
  {
    name: "positive tense zombie horror",
    message: "좀비가 등장하는 숨 막히는 공포 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["좀비", "숨 막히"],
  },
  {
    name: "positive heavy dark crime thriller",
    message: "어두운 범죄 스릴러 중에 분위기 묵직한 거 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["어두", "묵직"],
  },
  {
    name: "positive space sci-fi adventure",
    message: "우주 배경의 SF 모험 영화 찾아줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["우주"],
  },
  {
    name: "positive light funny comedy",
    message: "가볍고 웃긴 코미디 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["가볍", "웃긴"],
  },
  {
    name: "positive tearful moving drama",
    message: "눈물 나는 감동적인 드라마 보고 싶어",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["눈물", "감동"],
  },
  {
    name: "positive fast action",
    message: "빠른 전개에 액션 많은 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["빠른 전개", "액션"],
  },
  {
    name: "positive weird surreal",
    message: "기괴하고 초현실적인 분위기의 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["기괴", "초현실"],
  },
  {
    name: "positive warm healing family",
    message: "따뜻하고 힐링되는 가족 영화 보고 싶어",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["따뜻", "힐링"],
  },
  {
    name: "positive brutal bloody horror",
    message: "잔혹하고 피 튀기는 공포 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["잔혹", "피"],
  },
  {
    name: "positive tragic bleak ending",
    message: "비극적이고 암울한 결말의 영화 찾아줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["비극", "암울"],
  },
  {
    name: "positive twist mind game thriller",
    message: "두뇌 싸움이 있는 반전 스릴러 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["두뇌", "반전"],
  },
  {
    name: "positive revenge rough action",
    message: "복수극 느낌 나는 거친 액션 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["복수", "거친"],
  },
  {
    name: "positive coming-of-age youth drama",
    message: "성장 서사가 있는 청춘 드라마 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["성장", "청춘"],
  },
  {
    name: "positive dreamlike beautiful visuals",
    message: "몽환적이고 아름다운 영상미 있는 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["몽환", "영상미"],
  },
  {
    name: "mixed friend zombie",
    message: "친구랑 보기 좋은 좀비 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["좀비"],
    forbiddenUserTags: ["친구", "보기 좋은"],
    expectedExcludedTerms: ["친구"],
  },
  {
    name: "mixed evening calm",
    message: "저녁에 볼 잔잔한 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["잔잔한"],
    forbiddenUserTags: ["저녁"],
    expectedExcludedTerms: ["저녁"],
  },
  {
    name: "mixed ott space",
    message: "OTT에서 볼만한 우주 배경 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["우주"],
    forbiddenUserTags: ["OTT", "볼만한"],
    expectedExcludedTerms: ["OTT"],
  },
  {
    name: "mixed bored light funny comedy",
    message: "심심할 때 볼 가볍고 웃긴 코미디 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["가볍", "웃긴"],
    forbiddenUserTags: ["심심", "볼"],
    expectedExcludedTerms: ["심심"],
  },
  {
    name: "mixed weekend warm family animation",
    message: "주말에 가족이랑 볼 따뜻한 애니메이션 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["따뜻"],
    forbiddenUserTags: ["주말", "가족", "볼"],
    expectedExcludedTerms: ["주말", "가족"],
  },
  {
    name: "mixed alone night scary horror",
    message: "혼자 심야에 보기 좋은 오싹한 공포 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["오싹한"],
    forbiddenUserTags: ["혼자", "심야", "보기 좋은"],
    expectedExcludedTerms: ["혼자", "심야"],
  },
  {
    name: "mixed meal comfortable romance",
    message: "밥 먹으면서 볼 편안한 로맨스 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["편안"],
    forbiddenUserTags: ["밥", "먹으면서", "볼"],
    expectedExcludedTerms: ["밥"],
  },
  {
    name: "mixed netflix dark crime",
    message: "넷플릭스에 있을 법한 어두운 범죄 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["어두"],
    forbiddenUserTags: ["넷플릭스", "있을 법한"],
    expectedExcludedTerms: ["넷플릭스"],
  },
  {
    name: "mixed date sweet romance",
    message: "데이트할 때 볼 달달한 로맨스 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["달달"],
    forbiddenUserTags: ["데이트", "볼"],
    expectedExcludedTerms: ["데이트"],
  },
  {
    name: "mixed commute short fast movie",
    message: "출근길에 짧게 볼 수 있는 빠른 전개의 영화 추천해줘",
    expectedIntent: "new_recommendation",
    expectedUserTags: ["빠른 전개"],
    forbiddenUserTags: ["출근길", "볼 수 있는"],
    expectedExcludedTerms: ["출근길"],
  },
  {
    name: "negative anything",
    message: "재밌는 영화 하나만 골라줘",
    expectedIntent: "unsupported",
    expectedUserTags: [],
    forbiddenUserTags: ["재밌는", "하나만"],
  },
  {
    name: "negative friend only",
    message: "친구들이랑 같이 볼 영화 추천해줘",
    expectedIntent: "unsupported",
    expectedUserTags: [],
    forbiddenUserTags: ["친구", "같이"],
  },
  {
    name: "negative bored only",
    message: "심심할 때 볼 거 추천해줘",
    expectedIntent: "unsupported",
    expectedUserTags: [],
    forbiddenUserTags: ["심심"],
  },
  {
    name: "negative ott only",
    message: "OTT에서 볼 거 추천해줘",
    expectedIntent: "unsupported",
    expectedUserTags: [],
    forbiddenUserTags: ["OTT", "볼"],
  },
  {
    name: "negative my style only",
    message: "내 스타일 영화 추천해줘",
    expectedIntent: "unsupported",
    expectedUserTags: [],
    forbiddenUserTags: ["내 스타일"],
  },
]

const AVAILABLE_OPTIONS: AvailableRecommendationChatOptions = {
  genres: [
    { id: 12, name: "Adventure", nameKo: "모험" },
    { id: 16, name: "Animation", nameKo: "애니메이션" },
    { id: 18, name: "Drama", nameKo: "드라마" },
    { id: 27, name: "Horror", nameKo: "공포" },
    { id: 35, name: "Comedy", nameKo: "코미디" },
    { id: 53, name: "Thriller", nameKo: "스릴러" },
    { id: 80, name: "Crime", nameKo: "범죄" },
    { id: 878, name: "Science Fiction", nameKo: "SF" },
    { id: 10749, name: "Romance", nameKo: "로맨스" },
  ],
  countries: [{ code: "JP" }, { code: "KR" }, { code: "US" }, { code: "FR" }],
  languages: [{ code: "ja" }, { code: "ko" }, { code: "en" }, { code: "fr" }],
}

async function main() {
  await loadEnvFiles(ROOT_DIR)
  const options = parseArgs(process.argv.slice(2))
  const model = process.env.OPENAI_RECOMMENDATION_CHAT_MODEL ?? "gpt-4.1-mini"
  const embeddingModel = process.env.OPENAI_RECOMMENDATION_CHAT_EMBEDDING_MODEL ?? "text-embedding-3-small"
  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL or POSTGRES_URL is required.")
  }
  const openai = new OpenAI()
  const sql = postgres(databaseUrl, { max: options.concurrency, prepare: false })

  try {
    console.log(`running ${DEFAULT_SMOKE_CASES.length} analysis smoke cases with concurrency=${options.concurrency}`)
    const cases = await runSmokeCases(openai, {
      model,
      embeddingModel,
      sql,
      smokeCases: DEFAULT_SMOKE_CASES,
      concurrency: options.concurrency,
      vectorTopN: options.vectorTopN,
    })

    const passed = cases.filter((item) => item.passed).length
    const report: SmokeReport = {
      generatedAt: new Date().toISOString(),
      model,
      embeddingModel,
      summary: {
        caseCount: cases.length,
        passed,
        failed: cases.length - passed,
      },
      cases,
    }

    await mkdir(path.dirname(options.outputFile), { recursive: true })
    await mkdir(path.dirname(options.summaryOutputFile), { recursive: true })
    await writeFile(options.outputFile, `${JSON.stringify(report, null, 2)}\n`, "utf8")
    await writeFile(options.summaryOutputFile, renderSmokeSummary(report), "utf8")
    console.log(`wrote analysis smoke report to ${options.outputFile}`)
    console.log(`wrote analysis smoke summary to ${options.summaryOutputFile}`)
    console.log(`analysis smoke summary: passed=${report.summary.passed} failed=${report.summary.failed}`)

    if (report.summary.failed > 0 && options.failOnMismatch) {
      process.exitCode = 1
    }
  } finally {
    await sql.end()
  }
}

function parseArgs(args: string[]) {
  let outputFile = OUTPUT_FILE
  let summaryOutputFile = SUMMARY_OUTPUT_FILE
  let failOnMismatch = false
  let concurrency = DEFAULT_CONCURRENCY
  let vectorTopN = DEFAULT_VECTOR_TOP_N

  for (const arg of args) {
    if (arg === "--") {
      continue
    }

    if (arg === "--fail-on-mismatch") {
      failOnMismatch = true
      continue
    }

    if (arg.startsWith("--output=")) {
      const value = arg.slice("--output=".length).trim()
      if (!value) {
        throw new Error("--output 값이 필요합니다.")
      }
      outputFile = path.isAbsolute(value) ? value : path.join(ROOT_DIR, value)
      continue
    }

    if (arg.startsWith("--summary-output=")) {
      const value = arg.slice("--summary-output=".length).trim()
      if (!value) {
        throw new Error("--summary-output 값이 필요합니다.")
      }
      summaryOutputFile = path.isAbsolute(value) ? value : path.join(ROOT_DIR, value)
      continue
    }

    if (arg.startsWith("--concurrency=")) {
      const value = Number.parseInt(arg.slice("--concurrency=".length), 10)
      if (!Number.isInteger(value) || value < 1) {
        throw new Error("--concurrency 값은 1 이상의 정수여야 합니다.")
      }
      concurrency = value
      continue
    }

    if (arg.startsWith("--vector-top=")) {
      const value = Number.parseInt(arg.slice("--vector-top=".length), 10)
      if (!Number.isInteger(value) || value < 1) {
        throw new Error("--vector-top 값은 1 이상의 정수여야 합니다.")
      }
      vectorTopN = value
    }
  }

  return { outputFile, summaryOutputFile, failOnMismatch, concurrency, vectorTopN }
}

async function runSmokeCases(
  openai: OpenAI,
  params: {
    model: string
    embeddingModel: string
    sql: postgres.Sql
    smokeCases: SmokeCase[]
    concurrency: number
    vectorTopN: number
  },
) {
  const cases = new Array<SmokeCaseReport>(params.smokeCases.length)
  let nextIndex = 0
  const workerCount = Math.min(params.concurrency, params.smokeCases.length)

  async function runWorker() {
    while (nextIndex < params.smokeCases.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      const smokeCase = params.smokeCases[currentIndex]
      if (!smokeCase) {
        continue
      }

      const analysis = await analyzeRequest(openai, {
        model: params.model,
        currentMessage: smokeCase.message,
      })
      const failures = validateSmokeCase(smokeCase, analysis)
      const vectorMatches = await listAnalysisVectorMatches(openai, params.sql, {
        analysis,
        embeddingModel: params.embeddingModel,
        topN: params.vectorTopN,
      })
      cases[currentIndex] = {
        ...smokeCase,
        passed: failures.length === 0,
        failures,
        analysis,
        vectorMatches,
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => runWorker()))
  return cases
}

async function listAnalysisVectorMatches(
  openai: OpenAI,
  sql: postgres.Sql,
  params: {
    analysis: RecommendationChatAnalysis
    embeddingModel: string
    topN: number
  },
) {
  const userTagQueries = params.analysis.userTagQueries
  if (userTagQueries.length === 0) {
    return []
  }

  const embeddingInputs = userTagQueries.map((query) => query.embeddingTerms.join(" "))
  const response = await openai.embeddings.create({
    model: params.embeddingModel,
    input: embeddingInputs,
  })

  return Promise.all(
    userTagQueries.map(async (query, index) => {
      const embeddingInput = embeddingInputs[index] ?? ""
      const embedding = response.data[index]?.embedding
      if (!embedding || embedding.length !== 1536) {
        throw new Error(`embedding dimension mismatch. userTag=${query.userTag}`)
      }

      return {
        userTag: query.userTag,
        embeddingInput,
        matches: await listTopTagMatches(sql, {
          embedding,
          embeddingModel: params.embeddingModel,
          topN: params.topN,
        }),
      }
    }),
  )
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

async function analyzeRequest(openai: OpenAI, params: { model: string; currentMessage: string }) {
  const completion = await openai.chat.completions.parse({
    model: params.model,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: [
          "You analyze Korean movie recommendation chat requests. Return only valid JSON matching the schema.",
          "Mark non-recommendation, plot/info questions, director/actor/similar-movie requests as unsupported.",
          "Use only available genre, country, and language values.",
          "Return userTagQueries only for movie content attributes: mood, emotion, material, genre tone, narrative situation.",
          "Treat concrete movie subjects or creatures such as 좀비, 귀신, 괴물, 외계인, 살인마, 로봇 as content attributes. Keep them in userTagQueries, not excludedTerms.",
          "Do not put viewing situation, time of day, platform, user state, vague quality requests, request wording, or preference/exclusion wording into userTagQueries.",
          "Viewing context terms such as 친구랑, 혼자, 밤에, 저녁에, 주말에, 밥 먹으면서, 출근길, 데이트할 때 describe when or with whom the user watches. Put them in excludedTerms, not userTagQueries.",
          "For each userTagQuery, create exactly 7 embeddingTerms. The first term must exactly equal userTag.",
          "The remaining terms must be short Korean content-attribute expressions, not prose. Avoid broad expansion beyond the userTag meaning.",
          "Put removed request/situation/platform/vague terms into excludedTerms.",
          "Do not put recognized supported metadata or content attributes into excludedTerms.",
          "Do not treat rating, popularity, famousness, or hidden-gem requests as supported recommendation conditions.",
          "If no supported genre, country, language, year, runtime, or content-attribute userTag remains after exclusions, set intent to unsupported and userTagQueries to an empty array.",
          'Example: "잔잔한 일본 로맨스 영화 추천해줘" is new_recommendation with Romance genre, JP country, and a 잔잔한 userTagQuery.',
          'Example: "좀비가 나오는 긴장감 있는 공포 영화 보고 싶어" is new_recommendation with Horror genre and userTagQueries for 좀비 and 긴장감 있는.',
          'Example: "혼자 밤에 볼 무서운 공포 영화 추천해줘" is new_recommendation with Horror genre and a 무서운 userTagQuery. Put 혼자 and 밤에 in excludedTerms.',
          'Example: "친구랑 볼만한 거 추천해줘" is unsupported with empty userTagQueries.',
          'Example: "평점 높은 영화 추천해줘" is unsupported with empty userTagQueries.',
          'Example: "아무거나 추천해줘" is unsupported with empty userTagQueries.',
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          currentMessage: params.currentMessage,
          availableOptions: AVAILABLE_OPTIONS,
          recentExchanges: [],
        }),
      },
    ],
    response_format: zodResponseFormat(recommendationChatAnalysisSchema, "recommendation_chat_analysis"),
  })

  const parsed = completion.choices[0]?.message.parsed
  if (!parsed) {
    throw new Error(`LLM analysis parse failed. message=${params.currentMessage}`)
  }
  return parsed
}

function validateSmokeCase(smokeCase: SmokeCase, analysis: RecommendationChatAnalysis) {
  const failures: string[] = []
  const userTags = analysis.userTagQueries.map((query) => query.userTag)

  if (analysis.intent !== smokeCase.expectedIntent) {
    failures.push(`intent expected=${smokeCase.expectedIntent} actual=${analysis.intent}`)
  }

  for (const expectedUserTag of smokeCase.expectedUserTags ?? []) {
    if (!userTags.some((userTag) => userTag.includes(expectedUserTag))) {
      failures.push(`missing expected userTag containing "${expectedUserTag}"`)
    }
  }

  for (const forbiddenUserTag of smokeCase.forbiddenUserTags ?? []) {
    if (userTags.some((userTag) => userTag.includes(forbiddenUserTag))) {
      failures.push(`forbidden userTag containing "${forbiddenUserTag}"`)
    }
    if (analysis.userTagQueries.some((query) => query.embeddingTerms.some((term) => term.includes(forbiddenUserTag)))) {
      failures.push(`forbidden embeddingTerm containing "${forbiddenUserTag}"`)
    }
  }

  for (const expectedExcludedTerm of smokeCase.expectedExcludedTerms ?? []) {
    if (!analysis.excludedTerms.some((term) => term.includes(expectedExcludedTerm))) {
      failures.push(`missing excludedTerm containing "${expectedExcludedTerm}"`)
    }
  }

  for (const query of analysis.userTagQueries) {
    if (query.embeddingTerms.length !== 7) {
      failures.push(`embeddingTerms length mismatch. userTag=${query.userTag}`)
    }
    if (query.embeddingTerms[0] !== query.userTag) {
      failures.push(`first embeddingTerm mismatch. userTag=${query.userTag} first=${query.embeddingTerms[0]}`)
    }
  }

  return failures
}

function renderSmokeSummary(report: SmokeReport) {
  const lines: string[] = [
    "# Recommendation Chat Analysis Smoke Summary",
    "",
    `Generated: ${report.generatedAt}`,
    `Model: ${report.model}`,
    `Embedding model: ${report.embeddingModel}`,
    `Result: ${report.summary.passed} / ${report.summary.caseCount} passed`,
    "",
    "| # | Result | Message | Intent | Genres | User Tags | Excluded |",
    "|---:|---|---|---|---|---|---|",
  ]

  report.cases.forEach((smokeCase, index) => {
    lines.push(
      [
        index + 1,
        smokeCase.passed ? "PASS" : "FAIL",
        escapeMarkdownTableCell(smokeCase.message),
        smokeCase.analysis.intent,
        escapeMarkdownTableCell(formatGenres(smokeCase.analysis.genreIds)),
        escapeMarkdownTableCell(formatUserTags(smokeCase.analysis)),
        escapeMarkdownTableCell(formatList(smokeCase.analysis.excludedTerms)),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"),
    )
  })

  report.cases.forEach((smokeCase, index) => {
    const analysis = smokeCase.analysis
    lines.push(
      "",
      `## ${index + 1}. ${smokeCase.passed ? "PASS" : "FAIL"} - ${smokeCase.message}`,
      "",
      `- intent: \`${analysis.intent}\``,
      `- genres: \`${formatGenres(analysis.genreIds)}\``,
      `- countryCodes: \`${JSON.stringify(analysis.countryCodes)}\``,
      `- languageCodes: \`${JSON.stringify(analysis.languageCodes)}\``,
      `- yearRange: \`${formatRange(analysis.yearRange)}\``,
      `- runtimeRange: \`${formatRange(analysis.runtimeRange)}\``,
      `- excludedTerms: \`${JSON.stringify(analysis.excludedTerms)}\``,
      "",
    )

    if (smokeCase.failures.length > 0) {
      lines.push("Failures:", "")
      for (const failure of smokeCase.failures) {
        lines.push(`- ${failure}`)
      }
      lines.push("")
    }

    if (analysis.userTagQueries.length === 0) {
      lines.push("User tags: -", "")
      return
    }

    lines.push("User tags:", "", "| userTag | embeddingTerms |", "|---|---|")
    for (const query of analysis.userTagQueries) {
      lines.push(
        `| ${escapeMarkdownTableCell(query.userTag)} | ${escapeMarkdownTableCell(query.embeddingTerms.join(", "))} |`,
      )
    }

    lines.push("", "Vector matches:", "", "| userTag | embeddingInput | top matches |", "|---|---|---|")
    for (const vectorMatch of smokeCase.vectorMatches) {
      lines.push(
        [
          vectorMatch.userTag,
          vectorMatch.embeddingInput,
          formatTopMatches(vectorMatch.matches),
        ]
          .map(escapeMarkdownTableCell)
          .join(" | ")
          .replace(/^/, "| ")
          .replace(/$/, " |"),
      )
    }
  })

  return `${lines.join("\n")}\n`
}

function formatGenres(genreIds: number[]) {
  const genreNames = genreIds.map((genreId) => {
    const genre = AVAILABLE_OPTIONS.genres.find((item) => item.id === genreId)
    return genre?.name ?? `Unknown(${genreId})`
  })

  return formatList(genreNames)
}

function formatUserTags(analysis: RecommendationChatAnalysis) {
  return formatList(analysis.userTagQueries.map((query) => query.userTag))
}

function formatList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "-"
}

function formatRange(range: RecommendationChatAnalysis["yearRange"]) {
  return range ? JSON.stringify(range) : "null"
}

function escapeMarkdownTableCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>")
}

function formatTopMatches(matches: TagVectorMatch[]) {
  return matches
    .map((match) => `${match.rank}. ${match.tag} (${match.tagId}) \`${match.similarity.toFixed(3)}\``)
    .join(" · ")
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
