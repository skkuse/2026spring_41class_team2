import { describe, expect, it } from "vitest"
import { isUndefinedTableError } from "./postgres-errors"

describe("isUndefinedTableError", () => {
  it("detects a direct Postgres undefined-table error", () => {
    expect(isUndefinedTableError({ code: "42P01" })).toBe(true)
  })

  it("detects a Drizzle-wrapped Postgres undefined-table error", () => {
    const error = new Error("Failed query")
    error.cause = { code: "42P01" }

    expect(isUndefinedTableError(error)).toBe(true)
  })

  it("ignores unrelated errors", () => {
    const error = new Error("Failed query")
    error.cause = { code: "23505" }

    expect(isUndefinedTableError(error)).toBe(false)
  })
})
