import { Suspense } from "react"
import { Header } from "@/components/header"
import { SearchFilters } from "./_components/search-filters"
import { SearchResults } from "./_components/search-results"
import { SearchResultsSkeleton } from "./_components/search-results-skeleton"
import { normalizeSearchPageParams, type SearchPageParams } from "./search-params"
import { movieService } from "@/server/movies"

type SearchPageProps = {
  searchParams: Promise<SearchPageParams>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, sort, genreId } = normalizeSearchPageParams(await searchParams)
  const { genres } = await movieService.listGenres()

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">영화 탐색</h1>
          <p className="mt-2 text-muted-foreground">원하는 영화를 검색하세요</p>
        </div>

        <SearchFilters
          genres={genres}
          currentQ={q}
          currentSort={sort}
          currentGenreId={genreId}
        />

        <Suspense key={`${q}:${sort}:${genreId}`} fallback={<SearchResultsSkeleton />}>
          <SearchResults q={q} sort={sort} genreId={genreId} />
        </Suspense>
      </main>
    </div>
  )
}
