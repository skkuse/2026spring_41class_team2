import "server-only"

type LogLevel = "debug" | "info" | "warn" | "error"
type LogFields = Record<string, unknown>

const REDACTED = "[REDACTED]"
const MAX_STRING_LENGTH = 10_000
const isProduction = process.env.NODE_ENV === "production"
const sensitiveKeyPattern = /authorization|cookie|password|token|secret|api[_-]?key|access[_-]?token|refresh[_-]?token/i

export const logger = {
  debug(event: string, fields: LogFields = {}) {
    if (isProduction) {
      return
    }

    writeLog("debug", event, fields)
  },

  info(event: string, fields: LogFields = {}) {
    writeLog("info", event, fields)
  },

  warn(event: string, fields: LogFields = {}) {
    writeLog("warn", event, fields)
  },

  error(event: string, fields: LogFields = {}) {
    writeLog("error", event, fields)
  },
}

function writeLog(level: LogLevel, event: string, fields: LogFields) {
  const sanitizedFields = sanitizeLogData(fields) as LogFields
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...sanitizedFields,
  }

  if (level === "debug") {
    console.debug("[server]", payload)
    return
  }

  if (level === "info") {
    console.info("[server]", payload)
    return
  }

  if (level === "warn") {
    console.warn("[server]", payload)
    return
  }

  console.error("[server]", payload)
}

function sanitizeLogData(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value instanceof Error) {
    const appError = value as Error & { code?: string; status?: number }
    return {
      name: appError.name,
      message: appError.message,
      code: appError.code,
      status: appError.status,
      stack: isProduction ? undefined : appError.stack,
    }
  }

  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...[TRUNCATED]` : value
  }

  if (!value || typeof value !== "object") {
    return value
  }

  if (seen.has(value)) {
    return "[Circular]"
  }
  seen.add(value)

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogData(item, seen))
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, fieldValue]) => [
      key,
      sensitiveKeyPattern.test(key) ? REDACTED : sanitizeLogData(fieldValue, seen),
    ]),
  )
}
