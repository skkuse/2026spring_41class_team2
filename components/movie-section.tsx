"use client"

import { MovieCard } from "@/components/movie-card"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

interface Movie {
  id: string
  title: string
  year: string
  rating: number
  genre: string
  posterUrl?: string
}

interface MovieSectionProps {
  title: string
  description?: string
  movies: Movie[]
  href?: string
}

export function MovieSection({ title, description, movies, href }: MovieSectionProps) {
  return (
    <section className="py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            더보기
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {movies.map((movie) => (
          <MovieCard key={movie.id} {...movie} />
        ))}
      </div>
    </section>
  )
}
