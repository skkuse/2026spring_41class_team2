import Link from "next/link"
import { MovieCard } from "@/components/movie-card"
import { createOptionalRequestContext } from "@/server/auth/request-context"
import { movieService } from "@/server/movies"
import { mapMovieCardToView } from "@/lib/movies/movie-view"

type SearchResultsProps = {
  q: string
  sort: "popular" | "rating"
}

export async function SearchResults({ q, sort }: SearchResultsProps) {
  const context = await createOptionalRequestContext()
  const { movies } = await movieService.listMovies(context, { q, sort, page: 1, size: 50 })
  const movieViews = movies.map(mapMovieCardToView)

  return (
    <div className="mt-8">
      <p className="mb-4 text-sm text-muted-foreground">{movieViews.length}개의 영화</p>
      {movieViews.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {movieViews.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-card p-12 text-center">
          <p className="text-lg font-medium">검색 결과가 없습니다</p>
          <p className="mt-2 text-muted-foreground">다른 검색어를 시도해보세요</p>
          <Link href="/search" className="mt-4 inline-flex text-sm font-medium text-primary hover:text-primary/80">
            전체 영화 보기
          </Link>
        </div>
      )}
    </div>
  )
}
