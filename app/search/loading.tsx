import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { SearchResultsSkeleton } from "./_components/search-results-skeleton"

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">영화 탐색</h1>
          <p className="mt-2 text-muted-foreground">원하는 영화를 검색하세요</p>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="영화 제목 검색..." className="pl-10" disabled />
        </div>

        <SearchResultsSkeleton />
      </main>
    </div>
  )
}
