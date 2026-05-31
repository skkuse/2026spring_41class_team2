"use client"

import { signOut } from "@/lib/auth/auth-client"
import {
  createRecommendationChatDebugQuestion,
  deleteRecommendationChatDebugQuestion,
  getRecommendationChatDebugQuestions,
  RecommendationChatApiError,
  resetMyRecommendationChatConversation,
  runRecommendationChatDebug,
  type RecommendationChatAnalysis,
  type RecommendationChatDebugQuestion,
  type RecommendationChatDebugRunResponse,
} from "@/lib/recommendation-chat/recommendation-chat-client"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type DebugResult = {
  id: string
  question: string
  response: RecommendationChatDebugRunResponse
  createdAt: string
}

type MeResponse = {
  authenticated: boolean
  user: {
    id: string
    name: string
    email: string
  } | null
}

type AuthState =
  | { status: "loading"; user: null }
  | { status: "authenticated"; user: NonNullable<MeResponse["user"]> }
  | { status: "anonymous"; user: null }
  | { status: "error"; user: null }

type HtmlValue = {
  html: React.ReactNode
}

type FlowStep = {
  title: string
  rows: Array<[string, React.ReactNode | HtmlValue]>
  rawTitle: string
  rawValue: unknown
}

export default function RecommendationChatDebugPage() {
  const [questions, setQuestions] = useState<RecommendationChatDebugQuestion[]>([])
  const [customQuestion, setCustomQuestion] = useState("")
  const [results, setResults] = useState<DebugResult[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rawJsonIndex, setRawJsonIndex] = useState(0)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [authState, setAuthState] = useState<AuthState>({ status: "anonymous", user: null })

  useEffect(() => {
    let cancelled = false

    async function loadInitialState() {
      setIsLoadingQuestions(true)
      setErrorMessage(null)
      try {
        const [questionsResponse, meResponse] = await Promise.all([getRecommendationChatDebugQuestions(), getMe()])
        if (!cancelled) {
          setQuestions(questionsResponse.questions)
          setAuthState(
            meResponse.authenticated && meResponse.user
              ? { status: "authenticated", user: meResponse.user }
              : { status: "anonymous", user: null },
          )
        }
      } catch (error) {
        if (!cancelled) {
          setAuthState({ status: "error", user: null })
          setErrorMessage(toErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setIsLoadingQuestions(false)
        }
      }
    }

    void loadInitialState()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedResult = useMemo(
    () => results.find((result) => result.id === selectedId) ?? results[0] ?? null,
    [results, selectedId],
  )
  const flowSteps = selectedResult ? buildFlowSteps(selectedResult) : []
  const rawPayload = flowSteps[rawJsonIndex] ?? flowSteps[0]

  const metrics = {
    total: results.length,
    success: results.filter((result) => result.response.status === "success").length,
    unsupported: results.filter((result) => result.response.status === "unsupported").length,
    noCandidate: results.filter((result) => result.response.status === "no_candidate").length,
  }

  const handleRun = async (question: string) => {
    const text = question.trim()
    if (!text || isRunning) {
      return
    }

    setIsRunning(true)
    setErrorMessage(null)
    try {
      const result = await runOneDebugMessage(text)
      setResults((prev) => [result, ...prev])
      setSelectedId(result.id)
      setRawJsonIndex(0)
    } catch (error) {
      setErrorMessage(toErrorMessage(error))
    } finally {
      setIsRunning(false)
    }
  }

  const handleRunAll = async () => {
    if (questions.length === 0 || isRunning) {
      return
    }

    setIsRunning(true)
    setErrorMessage(null)
    try {
      const runResults = await runWithConcurrency(
        questions.map((question) => question.text),
        3,
        runOneDebugMessage,
      )
      setResults((prev) => [...runResults.reverse(), ...prev])
      setSelectedId(runResults[runResults.length - 1]?.id ?? null)
      setRawJsonIndex(0)
    } catch (error) {
      setErrorMessage(toErrorMessage(error))
    } finally {
      setIsRunning(false)
    }
  }

  const handleAddQuestion = async () => {
    const text = customQuestion.trim()
    if (!text || isRunning) {
      return
    }

    setErrorMessage(null)
    try {
      const response = await createRecommendationChatDebugQuestion({ text })
      setQuestions((prev) => [response.question, ...prev])
      setCustomQuestion("")
    } catch (error) {
      setErrorMessage(toErrorMessage(error))
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (isRunning) {
      return
    }

    setErrorMessage(null)
    try {
      await deleteRecommendationChatDebugQuestion({ questionId })
      setQuestions((prev) => prev.filter((question) => question.id !== questionId))
    } catch (error) {
      setErrorMessage(toErrorMessage(error))
    }
  }

  const handleResetConversation = async () => {
    if (isRunning) {
      return
    }

    setIsRunning(true)
    setErrorMessage(null)
    try {
      await resetMyRecommendationChatConversation()
      setResults([])
      setSelectedId(null)
      setRawJsonIndex(0)
    } catch (error) {
      setErrorMessage(toErrorMessage(error))
    } finally {
      setIsRunning(false)
    }
  }

  const handleLogout = async () => {
    setErrorMessage(null)
    const { error } = await signOut()
    if (error) {
      setErrorMessage("로그아웃하지 못했습니다.")
      return
    }

    setAuthState({ status: "anonymous", user: null })
    setResults([])
    setSelectedId(null)
    setRawJsonIndex(0)
  }

  return (
    <div className="debug-app">
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: debugPageCss }} />
      <header className="topbar">
        <div className="brand">
          <div className="logo">C</div>
          <div>
            <h1>Recommendation Chat Debug</h1>
            <div className="muted">준비 질문 실행 결과와 추천 파이프라인 중간값 확인</div>
          </div>
        </div>
        <div className="topbar-actions">
          <div className={`session-state${authState.status === "authenticated" ? " authenticated" : ""}`}>
            <span className="session-dot" />
            {authState.status === "authenticated" ? "로그인됨" : "로그인 필요"}
          </div>
          {authState.status === "authenticated" ? (
            <button className="button secondary small" type="button" onClick={handleLogout}>
              로그아웃
            </button>
          ) : (
            <Link className="button secondary small" href="/login?returnTo=/debug/recommendation-chat">
              로그인
            </Link>
          )}
          <button className="button secondary small" type="button" onClick={handleResetConversation} disabled={isRunning}>
            추천 채팅 초기화
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="panel">
          <div className="panel-header">
            <h2 className="panel-title">준비 질문</h2>
            <button className="button small" type="button" onClick={handleRunAll} disabled={questions.length === 0 || isRunning}>
              전체 실행
            </button>
          </div>
          <div className="panel-body">
            <div className="question-list">
              {isLoadingQuestions ? <p className="muted">질문을 불러오는 중입니다.</p> : null}
              {questions.map((question) => (
                <div className="question" key={question.id}>
                  <p className="question-text">{question.text}</p>
                  <div className="question-actions">
                    <button className="button secondary small" type="button" onClick={() => handleRun(question.text)} disabled={isRunning}>
                      실행
                    </button>
                    <button
                      className="button secondary small"
                      type="button"
                      onClick={() => handleDeleteQuestion(question.id)}
                      disabled={isRunning}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="input-row">
              <input
                value={customQuestion}
                onChange={(event) => setCustomQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleAddQuestion()
                  }
                }}
                placeholder="직접 입력 질문"
                disabled={isRunning}
              />
              <button className="button secondary" type="button" onClick={handleAddQuestion} disabled={!customQuestion.trim() || isRunning}>
                추가
              </button>
            </div>
            {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
          </div>
        </aside>

        <main>
          <section className="summary-grid" aria-label="실행 요약">
            <Metric label="실행 질문" value={metrics.total} />
            <Metric label="추천 성공" value={metrics.success} />
            <Metric label="Unsupported" value={metrics.unsupported} />
            <Metric label="후보 없음" value={metrics.noCandidate} />
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">실행 결과</h2>
              <span className="muted">{isRunning ? "실행 중" : ""}</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>상태</th>
                    <th>질문</th>
                    <th>Intent</th>
                    <th>장르</th>
                    <th>국가</th>
                    <th>언어</th>
                    <th>연도</th>
                    <th>러닝타임</th>
                    <th>태그</th>
                    <th>Excluded</th>
                    <th>실패 단계</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="muted">
                        아직 실행 결과가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    results.map((result) => (
                      <ResultRow
                        key={result.id}
                        result={result}
                        selected={result.id === selectedResult?.id}
                        onSelect={() => {
                          setSelectedId(result.id)
                          setRawJsonIndex(0)
                        }}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {selectedResult ? (
            <section className="details">
              <div className="flow">
                {flowSteps.map((step, index) => (
                  <div className="flow-step" key={step.title}>
                    <div className="flow-index">{index + 1}</div>
                    <div className="flow-card">
                      <div className="flow-card-header">
                        <h3 className="flow-card-title">{step.title}</h3>
                        <button
                          type="button"
                          className="raw-json-button"
                          aria-pressed={rawJsonIndex === index}
                          onClick={() => setRawJsonIndex(index)}
                        >
                          Raw JSON
                        </button>
                      </div>
                      <div className="kv">
                        {step.rows.map(([key, value]) => (
                          <div className="kv-row" key={key}>
                            <div className="kv-key">{key}</div>
                            <div className="kv-value">{isHtmlValue(value) ? value.html : value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <aside className="json-panel" aria-label="Raw JSON">
                <div className="json-context-card">
                  <div className="json-context-label">사용자 입력</div>
                  <div className="json-context-value">{selectedResult.question}</div>
                </div>
                <div className="json-view-card">
                  <div className="json-panel-header">
                    <h3>{rawPayload?.rawTitle ?? "Raw JSON"}</h3>
                  </div>
                  <div className="json-viewer">
                    <JsonViewer
                      value={rawPayload?.rawValue ?? selectedResult.response}
                      availableOptions={selectedResult.response.trace.availableOptions}
                    />
                  </div>
                </div>
              </aside>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  )
}

function ResultRow({
  result,
  selected,
  onSelect,
}: {
  result: DebugResult
  selected: boolean
  onSelect: () => void
}) {
  const trace = result.response.trace
  const analysis = trace.normalizedAnalysis ?? emptyAnalysis()
  const status = statusMeta(result.response.status)

  return (
    <tr data-selected={selected} onClick={onSelect}>
      <td>
        <span className={`status ${status.className}`}>{status.label}</span>
      </td>
      <td className="truncate">{result.question}</td>
      <td className="mono">{analysis.intent}</td>
      <td className="mono">
        <ValueToggle ids={analysis.genreIds} names={analysis.genreIds.map((id) => genreName(id, trace.availableOptions))} />
      </td>
      <td className="mono">{formatArray(analysis.countryCodes)}</td>
      <td className="mono">{formatArray(analysis.languageCodes)}</td>
      <td className="mono">{formatRange(analysis.yearRange)}</td>
      <td className="mono">{formatRange(analysis.runtimeRange)}</td>
      <td>{analysis.userTagQueries.map((query) => query.userTag).join(", ") || "-"}</td>
      <td>{formatArray(analysis.excludedTerms)}</td>
      <td>{trace.failureStage || "-"}</td>
      <td>
        <button className="button secondary small" type="button" onClick={onSelect}>
          상세
        </button>
      </td>
    </tr>
  )
}

function buildFlowSteps(result: DebugResult): FlowStep[] {
  const trace = result.response.trace
  const rawAnalysis = trace.rawAnalysis ?? emptyAnalysis()
  const normalizedAnalysis = trace.normalizedAnalysis ?? emptyAnalysis()
  const availableOptions = trace.availableOptions ?? { genres: [], countries: [], languages: [] }
  const generatedReasons = reasonsArray(trace.generatedReasons)

  return [
    {
      title: "요청 컨텍스트 준비",
      rows: [
        ["message", result.question],
        ["conversation.id", result.response.conversationId ?? "-"],
        ["availableOptions", `${availableOptions.genres.length} genres / ${availableOptions.countries.length} countries / ${availableOptions.languages.length} languages`],
        ["recentExchanges", `${trace.recentExchanges.length} pairs`],
        ["excludedMovieIds", formatArray(trace.excludedMovieIds)],
      ],
      rawTitle: "요청 컨텍스트 준비 JSON",
      rawValue: {
        request: { message: result.question },
        conversation: { id: result.response.conversationId },
        analysisPrep: {
          availableOptions: trace.availableOptions,
          recentExchanges: trace.recentExchanges,
          excludedMovieIds: trace.excludedMovieIds,
        },
      },
    },
    {
      title: "LLM 분석 요청 준비",
      rows: [
        ["currentMessage", result.question],
        ["availableOptions", `${availableOptions.genres.length} genres / ${availableOptions.countries.length} countries / ${availableOptions.languages.length} languages`],
        ["recentExchanges", `${trace.recentExchanges.length} pairs`],
      ],
      rawTitle: "LLM 분석 요청 JSON",
      rawValue: {
        currentMessage: result.question,
        availableOptions: trace.availableOptions,
        recentExchanges: trace.recentExchanges,
      },
    },
    {
      title: "LLM 추천 조건 분석",
      rows: analysisRows(rawAnalysis, trace.availableOptions),
      rawTitle: "LLM 분석 결과 JSON",
      rawValue: trace.rawAnalysis,
    },
    {
      title: "분석 결과 정규화",
      rows: [
        ...analysisRows(normalizedAnalysis, trace.availableOptions),
        ["hasRecommendationConditions", String(hasRecommendationConditions(normalizedAnalysis))],
      ],
      rawTitle: "정규화된 분석 결과 JSON",
      rawValue: trace.normalizedAnalysis,
    },
    {
      title: "사용자 태그 매핑 및 추천 후보 조회",
      rows: [
        ["userTagQueries", `${normalizedAnalysis.userTagQueries.length}개`],
        ["embeddingInputs", htmlValue(<SubRows items={trace.embeddingInputs.map((input, index) => [normalizedAnalysis.userTagQueries[index]?.userTag ?? `tag-${index + 1}`, input])} />)],
        ["mappedTagsByUserTag", htmlValue(<SubRows items={mappedTagsRows(trace.mappedTagsByUserTag)} />)],
        ["uniqueMappedTagIds", htmlValue(<ValueToggle ids={uniqueMappedTagIds(trace.mappedTagsByUserTag)} names={uniqueMappedTagNames(trace.mappedTagsByUserTag)} />)],
        ["candidateQueryType", trace.candidateQueryType || "-"],
        ["filters", stringify(trace.filters)],
        ["candidateCount", String(trace.candidateCount ?? 0)],
      ],
      rawTitle: "태그 매핑 및 후보 조회 JSON",
      rawValue: {
        userTagQueries: normalizedAnalysis.userTagQueries,
        embeddingInputs: trace.embeddingInputs,
        mappedTagsByUserTag: trace.mappedTagsByUserTag,
        uniqueMappedTagIds: uniqueMappedTagIds(trace.mappedTagsByUserTag),
        candidateQueryType: trace.candidateQueryType,
        filters: trace.filters,
        candidateCount: trace.candidateCount,
      },
    },
    {
      title: "추천 후보 선별 및 추천 이유 생성",
      rows: [
        ["selectedMovies", htmlValue(<SubRows items={trace.selectedMovies.map((movie) => [movie.title, `movieId: ${movie.id} / matchedUserTags: ${formatArray(movie.matchedUserTags)}`])} />)],
        ["generatedReasons", htmlValue(<SubRows items={generatedReasons.map((reason) => [movieTitleById(trace.selectedMovies, reason.movieId), reason.reason])} />)],
        ["failureStage", trace.failureStage || "-"],
      ],
      rawTitle: "후보 선별 및 추천 이유 JSON",
      rawValue: {
        selectedMovies: trace.selectedMovies,
        generatedReasons: trace.generatedReasons,
      },
    },
    {
      title: "최종 결과",
      rows: [
        ["answer", trace.answer ?? "-"],
        ["movies", htmlValue(<SubRows items={trace.movies.map((movie, index) => [String(index + 1), movie.title])} />)],
        ["status", result.response.status],
        ["failureStage", trace.failureStage || "-"],
        ["error", trace.error ? formatDebugError(trace.error) : "-"],
      ],
      rawTitle: "최종 결과 JSON",
      rawValue: {
        answer: trace.answer,
        movies: trace.movies,
        status: result.response.status,
        failureStage: trace.failureStage,
        error: trace.error,
      },
    },
  ]
}

function formatDebugError(error: { name: string; message: string; cause?: { name: string; message: string }[] }) {
  const cause = error.cause?.map((item) => `${item.name}: ${item.message}`).join(" <- ")
  return cause ? `${error.name}: ${error.message} / cause: ${cause}` : `${error.name}: ${error.message}`
}

function analysisRows(
  analysis: RecommendationChatAnalysis,
  availableOptions: RecommendationChatDebugRunResponse["trace"]["availableOptions"],
): Array<[string, React.ReactNode | HtmlValue]> {
  return [
    ["intent", analysis.intent],
    ["genreIds", htmlValue(<ValueToggle ids={analysis.genreIds} names={analysis.genreIds.map((id) => genreName(id, availableOptions))} />)],
    ["countryCodes", formatArray(analysis.countryCodes)],
    ["languageCodes", formatArray(analysis.languageCodes)],
    ["yearRange", formatRange(analysis.yearRange)],
    ["runtimeRange", formatRange(analysis.runtimeRange)],
    ["userTagQueries", analysis.userTagQueries.map((query) => query.userTag).join(", ") || "-"],
    ["excludedTerms", formatArray(analysis.excludedTerms)],
    ["confidence", String(analysis.confidence)],
  ]
}

function JsonViewer({
  value,
  availableOptions,
  jsonKey = null,
  isRoot = true,
}: {
  value: unknown
  availableOptions: RecommendationChatDebugRunResponse["trace"]["availableOptions"]
  jsonKey?: string | null
  isRoot?: boolean
}) {
  const keyPrefix =
    jsonKey === null ? null : (
      <span className="json-key">
        {JSON.stringify(jsonKey)}
        {": "}
      </span>
    )

  if (Array.isArray(value)) {
    if (jsonKey === "genreIds" && value.length > 0 && value.every((item) => typeof item === "number")) {
      return (
        <div className="json-line">
          {keyPrefix}
          <ValueToggle ids={value} names={value.map((id) => genreName(id, availableOptions))} />
        </div>
      )
    }
    if (value.length === 0) {
      return (
        <div className="json-line">
          {keyPrefix}[]
        </div>
      )
    }
    return (
      <details open={jsonKey !== "availableOptions"} className={isRoot ? "root" : undefined}>
        <summary>
          {keyPrefix}[ {value.length} ]
        </summary>
        {value.map((item, index) => (
          <JsonViewer key={index} value={item} availableOptions={availableOptions} jsonKey={String(index)} isRoot={false} />
        ))}
      </details>
    )
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      return (
        <div className="json-line">
          {keyPrefix}{"{}"}
        </div>
      )
    }
    return (
      <details open={jsonKey !== "availableOptions"} className={isRoot ? "root" : undefined}>
        <summary>
          {keyPrefix}
          {"{ "}
          {entries.length}
          {" }"}
        </summary>
        {entries.map(([entryKey, entryValue]) => (
          <JsonViewer key={entryKey} value={entryValue} availableOptions={availableOptions} jsonKey={entryKey} isRoot={false} />
        ))}
      </details>
    )
  }

  return (
    <div className="json-line">
      {keyPrefix}
      <JsonScalar value={value} />
    </div>
  )
}

function JsonScalar({ value }: { value: unknown }) {
  if (typeof value === "string") {
    return <span className="json-string">{JSON.stringify(value)}</span>
  }
  if (typeof value === "number") {
    return <span className="json-number">{value}</span>
  }
  if (typeof value === "boolean") {
    return <span className="json-boolean">{String(value)}</span>
  }
  if (value === null) {
    return <span className="json-null">null</span>
  }
  return <>{String(value)}</>
}

function ValueToggle({ ids, names }: { ids: Array<number | string>; names: string[] }) {
  const [mode, setMode] = useState<"ids" | "names">("ids")
  if (ids.length === 0) {
    return <>[]</>
  }

  return (
    <button type="button" className="value-toggle" onClick={() => setMode((prev) => (prev === "ids" ? "names" : "ids"))}>
      {JSON.stringify(mode === "ids" ? ids : names)}
    </button>
  )
}

function SubRows({ items }: { items: Array<[string, string]> }) {
  if (items.length === 0) {
    return <>-</>
  }

  return (
    <div className="subrows">
      {items.map(([key, value], index) => (
        <div className="subrow" key={`${key}-${index}`}>
          <div className="subrow-key">{key}</div>
          <div className="subrow-value">{value}</div>
        </div>
      ))}
    </div>
  )
}

async function runOneDebugMessage(question: string): Promise<DebugResult> {
  const response = await runRecommendationChatDebug({ message: question })
  return {
    id: `run-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    question,
    response,
    createdAt: new Date().toISOString(),
  }
}

async function getMe(): Promise<MeResponse> {
  const response = await fetch("/api/me", { cache: "no-store" })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new RecommendationChatApiError("현재 로그인 상태를 확인하지 못했습니다.", response.status)
  }
  return body as MeResponse
}

export async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
) {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await worker(items[currentIndex], currentIndex)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker))
  return results
}

function htmlValue(html: React.ReactNode): HtmlValue {
  return { html }
}

function isHtmlValue(value: React.ReactNode | HtmlValue): value is HtmlValue {
  return Boolean(value && typeof value === "object" && "html" in value)
}

function statusMeta(status: RecommendationChatDebugRunResponse["status"]) {
  if (status === "success") {
    return { label: "success", className: "ok" }
  }
  if (status === "unsupported") {
    return { label: "unsupported", className: "warn" }
  }
  if (status === "error") {
    return { label: "error", className: "bad" }
  }
  return { label: "no candidate", className: "bad" }
}

function formatArray(value: unknown[] | undefined | null) {
  return value && value.length > 0 ? JSON.stringify(value) : "[]"
}

function formatRange(value: { from: number | null; to: number | null } | null) {
  return value ? JSON.stringify(value) : "null"
}

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function genreName(id: number, availableOptions: RecommendationChatDebugRunResponse["trace"]["availableOptions"]) {
  const genre = availableOptions?.genres?.find((item) => item.id === id)
  return genre?.nameKo || genre?.name || `unknown(${id})`
}

function uniqueMappedTagIds(mappedTagsByUserTag: RecommendationChatDebugRunResponse["trace"]["mappedTagsByUserTag"]) {
  return [
    ...new Set(
      Object.values(mappedTagsByUserTag || {})
        .flat()
        .map((tag) => tag.tagId),
    ),
  ]
}

function mappedTagsRows(mappedTagsByUserTag: RecommendationChatDebugRunResponse["trace"]["mappedTagsByUserTag"]) {
  return Object.entries(mappedTagsByUserTag || {}).map(([userTag, tags]) => [
    userTag,
    tags.map((tag) => `${tag.tag}(${tag.relevance})`).join(", "),
  ]) satisfies Array<[string, string]>
}

function uniqueMappedTagNames(mappedTagsByUserTag: RecommendationChatDebugRunResponse["trace"]["mappedTagsByUserTag"]) {
  const namesById = new Map(
    Object.values(mappedTagsByUserTag || {})
      .flat()
      .map((tag) => [tag.tagId, tag.tag]),
  )
  return uniqueMappedTagIds(mappedTagsByUserTag).map((id) => namesById.get(Number(id)) ?? `unknown(${id})`)
}

function reasonsArray(generatedReasons: Record<string, string>) {
  return Object.entries(generatedReasons).map(([movieId, reason]) => ({ movieId: Number(movieId), reason }))
}

function movieTitleById(movies: RecommendationChatDebugRunResponse["trace"]["selectedMovies"], movieId: number) {
  return movies.find((movie) => movie.id === movieId)?.title ?? `movieId ${movieId}`
}

function hasRecommendationConditions(analysis: RecommendationChatAnalysis) {
  return Boolean(
    analysis.genreIds.length ||
      analysis.countryCodes.length ||
      analysis.languageCodes.length ||
      analysis.yearRange ||
      analysis.runtimeRange ||
      analysis.userTagQueries.length,
  )
}

function emptyAnalysis(): RecommendationChatAnalysis {
  return {
    intent: "unsupported",
    genreIds: [],
    countryCodes: [],
    languageCodes: [],
    yearRange: null,
    runtimeRange: null,
    userTagQueries: [],
    excludedTerms: [],
    confidence: 0,
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof RecommendationChatApiError) {
    return error.isUnauthorized ? "로그인이 필요합니다. 상단 로그인 버튼으로 로그인해 주세요." : error.message
  }

  return "추천 채팅 디버그 요청을 처리하지 못했습니다."
}

const debugPageCss = `
  :root {
    color-scheme: light;
  }

  .debug-app {
    min-height: 100vh;
    background: #f7f8fb;
    color: #172033;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .debug-app * {
    box-sizing: border-box;
  }

  .debug-app button,
  .debug-app input {
    font: inherit;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 64px;
    padding: 0 28px;
    border-bottom: 1px solid #d8dee8;
    background: #ffffff;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .logo {
    display: grid;
    width: 32px;
    height: 32px;
    place-items: center;
    border-radius: 8px;
    background: #2364d2;
    color: white;
    font-weight: 800;
  }

  .debug-app h1 {
    margin: 0;
    font-size: 18px;
    line-height: 1.2;
  }

  .topbar-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  .session-state {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border: 1px solid #bfdbfe;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 13px;
    font-weight: 700;
  }

  .session-state.authenticated {
    border-color: #bbf7d0;
    background: #f0fdf4;
    color: #16784f;
  }

  .session-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2563eb;
  }

  .session-state.authenticated .session-dot {
    background: #16a34a;
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
    gap: 20px;
    padding: 20px 28px 32px;
  }

  .panel {
    border: 1px solid #d8dee8;
    border-radius: 8px;
    background: #ffffff;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid #d8dee8;
  }

  .panel-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
  }

  .panel-body {
    padding: 16px;
  }

  .question-list {
    display: grid;
    gap: 10px;
  }

  .question {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid #d8dee8;
    border-radius: 8px;
    background: white;
  }

  .question-text {
    margin: 0;
    font-size: 14px;
    line-height: 1.45;
  }

  .button {
    display: inline-flex;
    min-height: 36px;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border: 1px solid transparent;
    border-radius: 7px;
    padding: 0 12px;
    background: #2364d2;
    color: white;
    cursor: pointer;
    font-weight: 700;
    text-decoration: none;
  }

  .button:hover {
    background: #174ba0;
  }

  .button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .button.secondary {
    border-color: #d8dee8;
    background: white;
    color: #172033;
  }

  .button.secondary:hover {
    background: #f1f5f9;
  }

  .button.small {
    min-height: 30px;
    padding: 0 9px;
    font-size: 13px;
  }

  .input-row {
    display: flex;
    gap: 8px;
    margin-top: 14px;
  }

  .input-row input {
    min-width: 0;
    flex: 1;
    min-height: 38px;
    border: 1px solid #d8dee8;
    border-radius: 7px;
    padding: 0 10px;
    background: white;
  }

  .question-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 14px;
  }

  .metric {
    padding: 12px;
    border: 1px solid #d8dee8;
    border-radius: 8px;
    background: white;
  }

  .metric-label {
    display: block;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
  }

  .metric-value {
    display: block;
    margin-top: 6px;
    font-size: 22px;
    font-weight: 800;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    min-width: 980px;
    border-collapse: collapse;
    font-size: 13px;
  }

  th,
  td {
    border-bottom: 1px solid #d8dee8;
    padding: 10px;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: #f8fafc;
    color: #475569;
    font-size: 12px;
    white-space: nowrap;
  }

  tr[data-selected="true"] td {
    background: #eff6ff;
  }

  .status {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
  }

  .status.ok {
    background: #dcfce7;
    color: #16784f;
  }

  .status.warn {
    background: #fef3c7;
    color: #b45309;
  }

  .status.bad {
    background: #fee2e2;
    color: #b42318;
  }

  .mono {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    font-size: 12px;
  }

  .details {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 460px);
    align-items: start;
    gap: 18px;
    margin-top: 20px;
  }

  .flow {
    display: grid;
    gap: 12px;
  }

  .flow-step {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 12px;
  }

  .flow-index {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border-radius: 50%;
    background: #2364d2;
    color: white;
    font-size: 13px;
    font-weight: 800;
  }

  .flow-card,
  .json-context-card,
  .json-view-card {
    border: 1px solid #d8dee8;
    border-radius: 8px;
    background: white;
  }

  .flow-card-header,
  .json-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid #d8dee8;
  }

  .flow-card-title,
  .json-panel h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
  }

  .json-panel {
    position: sticky;
    top: 18px;
  }

  .json-context-card {
    display: grid;
    gap: 6px;
    margin-bottom: 12px;
    padding: 12px 14px;
  }

  .json-context-label {
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
  }

  .json-context-value {
    line-height: 1.45;
  }

  .raw-json-button {
    min-height: 30px;
    border: 1px solid #d8dee8;
    border-radius: 7px;
    background: white;
    color: #172033;
    cursor: pointer;
    padding: 0 9px;
    font-size: 12px;
    font-weight: 800;
  }

  .raw-json-button:hover,
  .raw-json-button[aria-pressed="true"] {
    border-color: #bfdbfe;
    background: #eff6ff;
    color: #1d4ed8;
  }

  .kv {
    display: grid;
  }

  .kv-row {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr);
    gap: 12px;
    padding: 10px 14px;
    border-bottom: 1px solid #eef2f7;
  }

  .kv-row:last-child {
    border-bottom: 0;
  }

  .kv-key {
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
  }

  .kv-value {
    min-width: 0;
    line-height: 1.45;
    white-space: pre-wrap;
  }

  .json-viewer {
    max-height: 380px;
    overflow: auto;
    padding: 14px;
    border-radius: 0 0 8px 8px;
    background: #0f172a;
    color: #e2e8f0;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    font-size: 12px;
    line-height: 1.6;
  }

  .json-viewer details {
    margin-left: 16px;
  }

  .json-viewer details.root {
    margin-left: 0;
  }

  .json-viewer summary {
    cursor: pointer;
    list-style: none;
  }

  .json-viewer summary::-webkit-details-marker {
    display: none;
  }

  .json-viewer summary::before {
    content: "▾";
    display: inline-block;
    width: 14px;
    color: #93c5fd;
  }

  .json-viewer details:not([open]) > summary::before {
    content: "▸";
  }

  .json-key {
    color: #93c5fd;
  }

  .json-string {
    color: #86efac;
  }

  .json-number,
  .json-boolean {
    color: #fbbf24;
  }

  .json-null {
    color: #c4b5fd;
  }

  .json-line {
    margin-left: 16px;
  }

  .json-line::before {
    content: "";
    display: inline-block;
    width: 14px;
  }

  .value-toggle {
    display: inline-flex;
    min-height: 22px;
    align-items: center;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 1px 6px;
    background: #eff6ff;
    color: #1d4ed8;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    font-weight: 800;
  }

  .json-viewer .value-toggle {
    border-color: #1e3a8a;
    background: #172554;
    color: #bfdbfe;
  }

  .subrows {
    display: grid;
    gap: 6px;
  }

  .subrow {
    display: grid;
    grid-template-columns: minmax(80px, 140px) minmax(0, 1fr);
    gap: 8px;
    align-items: start;
    padding: 6px 8px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #f8fafc;
  }

  .subrow-key {
    color: #334155;
    font-weight: 800;
  }

  .subrow-value {
    min-width: 0;
  }

  .muted {
    color: #64748b;
  }

  .truncate {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .error-message {
    margin: 12px 0 0;
    color: #b42318;
    font-size: 13px;
    line-height: 1.45;
  }

  @media (max-width: 1080px) {
    .layout {
      grid-template-columns: 1fr;
    }

    .details {
      grid-template-columns: 1fr;
    }

    .json-panel {
      position: static;
    }

    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .topbar {
      align-items: flex-start;
      flex-direction: column;
      padding: 14px 16px;
    }

    .topbar-actions {
      justify-content: flex-start;
    }

    .layout {
      padding: 16px;
    }

    .summary-grid {
      grid-template-columns: 1fr;
    }

    .kv-row {
      grid-template-columns: 1fr;
    }
  }
`
