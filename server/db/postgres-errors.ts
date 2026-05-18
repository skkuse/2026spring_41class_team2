export function isPostgresErrorCode(error: unknown, code: string): boolean {
  let current = error

  while (typeof current === "object" && current !== null) {
    if ("code" in current && (current as { code?: string }).code === code) {
      return true
    }

    current = "cause" in current ? (current as { cause?: unknown }).cause : null
  }

  return false
}

export function isUndefinedTableError(error: unknown) {
  return isPostgresErrorCode(error, "42P01")
}
