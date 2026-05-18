import type { MovieCardDto, MovieCastMemberDto } from "@/server/movies/movie-types"

export type MovieCardView = {
  id: string
  title: string
  year: string
  rating: number
  genre: string
  posterUrl: string | null
  isBookmarked: boolean
}

export function mapMovieCardToView(movie: MovieCardDto): MovieCardView {
  return {
    id: String(movie.id),
    title: movie.title,
    year: movie.year?.toString() ?? "연도 미상",
    rating: movie.rating,
    genre: movie.genres.map((genre) => genre.name).join(", ") || "장르 미상",
    posterUrl: movie.posterUrl,
    isBookmarked: movie.isBookmarked,
  }
}

export function formatCastNames(cast: MovieCastMemberDto[]) {
  return cast.map((member) => member.name).join(", ")
}
