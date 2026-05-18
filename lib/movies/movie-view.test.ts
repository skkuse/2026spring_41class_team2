import { describe, expect, it } from "vitest"
import { formatCastNames, mapMovieCardToView } from "./movie-view"

describe("mapMovieCardToView", () => {
  it("maps API movie cards to existing card view props", () => {
    expect(
      mapMovieCardToView({
        id: 550,
        title: "Fight Club",
        year: 1999,
        rating: 4.23,
        genres: [
          { id: 18, name: "Drama" },
          { id: 53, name: "Thriller" },
        ],
        posterUrl: null,
        isBookmarked: true,
      }),
    ).toEqual({
      id: "550",
      title: "Fight Club",
      year: "1999",
      rating: 4.23,
      genre: "Drama, Thriller",
      posterUrl: null,
      isBookmarked: true,
    })
  })
})

describe("formatCastNames", () => {
  it("formats full cast arrays for the current detail screen", () => {
    expect(
      formatCastNames([
        { id: 1, name: "A", characterName: "Hero", profileUrl: null },
        { id: 2, name: "B", characterName: null, profileUrl: "https://example.com/b.jpg" },
      ]),
    ).toBe("A, B")
  })
})
