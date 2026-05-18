import { describe, expect, it } from "vitest";
import { MIN_TAG_RELEVANCE, selectMovieTagRelevanceRows, type MovieTagRelevanceSeedRow } from "./generate-csv-from-movielens";

function row(movieId: number, tagId: number, relevance: number): MovieTagRelevanceSeedRow {
  return {
    movieId,
    tagId,
    relevance,
    relevanceValue: relevance.toFixed(6),
  };
}

describe("selectMovieTagRelevanceRows", () => {
  it("keeps every row with relevance at or above the threshold", () => {
    const selectedRows = selectMovieTagRelevanceRows([
      ...Array.from({ length: 20 }, (_, index) => row(1, index + 1, 0.1 + index * 0.01)),
      row(1, 21, MIN_TAG_RELEVANCE),
      row(1, 22, 0.7),
    ]);

    expect(selectedRows.map((selectedRow) => selectedRow.tagId)).toContain(21);
    expect(selectedRows.map((selectedRow) => selectedRow.tagId)).toContain(22);
  });

  it("adds below-threshold rows when a movie needs top tags to reach the minimum", () => {
    const selectedRows = selectMovieTagRelevanceRows(
      Array.from({ length: 25 }, (_, index) => row(1, index + 1, 0.49 - index * 0.01)),
    );

    expect(selectedRows).toHaveLength(20);
    expect(selectedRows.map((selectedRow) => selectedRow.tagId)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    );
  });

  it("uses tag id ascending as the top-tag tie breaker", () => {
    const selectedRows = selectMovieTagRelevanceRows([
      ...Array.from({ length: 19 }, (_, index) => row(1, index + 10, 0.4 - index * 0.001)),
      row(1, 1, 0.3),
      row(1, 2, 0.3),
      row(1, 3, 0.3),
    ]);

    expect(selectedRows).toHaveLength(20);
    expect(selectedRows.map((selectedRow) => selectedRow.tagId)).toContain(1);
    expect(selectedRows.map((selectedRow) => selectedRow.tagId)).not.toContain(2);
    expect(selectedRows.map((selectedRow) => selectedRow.tagId)).not.toContain(3);
  });
});
