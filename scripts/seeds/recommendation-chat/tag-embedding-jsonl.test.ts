import { describe, expect, it } from "vitest"
import { parseTagEmbeddingJsonl } from "./tag-embedding-jsonl"

describe("parseTagEmbeddingJsonl", () => {
  it("parses valid rows without descriptionKo", () => {
    expect(
      parseTagEmbeddingJsonl(
        [
          JSON.stringify({
            tagId: 1,
            tag: "quiet",
            labelKo: "잔잔함",
            embeddingInput: "quiet 잔잔함 차분한 분위기 고요함 느린 호흡 여백",
          }),
        ].join("\n"),
      ),
    ).toMatchObject([{ tagId: 1, tag: "quiet" }])
  })

  it("rejects rows without embeddingInput", () => {
    expect(() =>
      parseTagEmbeddingJsonl(
        JSON.stringify({
          tagId: 1,
          tag: "quiet",
          labelKo: "잔잔함",
        }),
      ),
    ).toThrow(/embeddingInput/)
  })

  it("rejects duplicate tagId", () => {
    const row = JSON.stringify({
      tagId: 1,
      tag: "quiet",
      labelKo: "잔잔함",
      embeddingInput: "input",
    })

    expect(() => parseTagEmbeddingJsonl(`${row}\n${row}`)).toThrow(/중복/)
  })

  it("rejects invalid JSON line", () => {
    expect(() => parseTagEmbeddingJsonl("{")).toThrow(/JSON/)
  })

  it("rejects invalid embedding dimension", () => {
    expect(() =>
      parseTagEmbeddingJsonl(
        JSON.stringify({
          tagId: 1,
          tag: "quiet",
          labelKo: "잔잔함",
          embeddingInput: "input",
          embedding: [0.1],
        }),
      ),
    ).toThrow(/1536/)
  })
})
