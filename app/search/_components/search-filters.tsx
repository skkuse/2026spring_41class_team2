"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Genre = {
  id: number
  name: string
}

type SearchFiltersProps = {
  genres: Genre[]
  currentQ: string
  currentSort: "popular" | "rating"
  currentGenreId: number | undefined
}

export function SearchFilters({ genres, currentQ, currentSort, currentGenreId }: SearchFiltersProps) {
  const router = useRouter()
  const [q, setQ] = useState(currentQ)

  function buildUrl(params: { q: string; sort: string; genreId?: number }) {
    const sp = new URLSearchParams()
    if (params.q) sp.set("q", params.q)
    if (params.sort !== "popular") sp.set("sort", params.sort)
    if (params.genreId) sp.set("genreId", String(params.genreId))
    const qs = sp.toString()
    return qs ? `/search?${qs}` : "/search"
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(buildUrl({ q, sort: currentSort, genreId: currentGenreId }))
  }

  function handleSortChange(sort: "popular" | "rating") {
    router.push(buildUrl({ q: currentQ, sort, genreId: currentGenreId }))
  }

  function handleGenreChange(genreId: number | undefined) {
    router.push(buildUrl({ q: currentQ, sort: currentSort, genreId }))
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="영화 제목 검색..."
            className="pl-10"
          />
        </div>
      </form>

      <div className="flex items-center gap-2">
        <span className="shrink-0 text-sm text-muted-foreground">정렬</span>
        <div className="flex gap-1.5">
          {(["popular", "rating"] as const).map((sort) => (
            <button
              key={sort}
              type="button"
              onClick={() => handleSortChange(sort)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                currentSort === sort
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted",
              )}
            >
              {sort === "popular" ? "인기순" : "평점순"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => handleGenreChange(undefined)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
            currentGenreId === undefined
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-muted",
          )}
        >
          전체
        </button>
        {genres.map((genre) => (
          <button
            key={genre.id}
            type="button"
            onClick={() => handleGenreChange(currentGenreId === genre.id ? undefined : genre.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              currentGenreId === genre.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted",
            )}
          >
            {genre.name}
          </button>
        ))}
      </div>
    </div>
  )
}
