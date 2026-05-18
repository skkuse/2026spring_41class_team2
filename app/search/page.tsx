import { Header } from "@/components/header"
import { MovieCard } from "@/components/movie-card"
import { Input } from "@/components/ui/input"
import { createOptionalRequestContext } from "@/server/auth/request-context"
import { movieService } from "@/server/movies"
import { mapMovieCardToView } from "@/lib/movies/movie-view"
import { Search } from "lucide-react"

type SearchPageProps = {
  searchParams: Promise<{
    q?: string
    sort?: "popular" | "rating"
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const q = params.q?.trim() ?? ""
  const sort = params.sort === "rating" ? "rating" : "popular"
  const context = await createOptionalRequestContext()
  const { movies } = await movieService.listMovies(context, { q, sort, limit: 50 })
  const movieViews = movies.map(mapMovieCardToView)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">영화 탐색</h1>
          <p className="mt-2 text-muted-foreground">원하는 영화를 검색하세요</p>
        </div>

        <form action="/search">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" placeholder="영화 제목 검색..." defaultValue={q} className="pl-10" />
          </div>
        </form>

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
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
