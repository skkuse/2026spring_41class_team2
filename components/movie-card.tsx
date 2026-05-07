"use client"

import Link from "next/link"
import { Star, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface MovieCardProps {
  id: string
  title: string
  year: string
  rating: number
  genre: string
  posterUrl?: string
}

export function MovieCard({ id, title, year, rating, genre, posterUrl }: MovieCardProps) {
  const [isLiked, setIsLiked] = useState(false)

  return (
    <Link href={`/movie/${id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-card transition-all duration-300 hover:ring-2 hover:ring-primary/50">
        <div className="aspect-[2/3] w-full overflow-hidden bg-muted">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary">
              <span className="text-4xl font-bold text-muted-foreground">{title.charAt(0)}</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
          onClick={(e) => {
            e.preventDefault()
            setIsLiked(!isLiked)
          }}
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
        </Button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent p-4">
          <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{year}</span>
            <span>|</span>
            <span>{genre}</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-sm font-medium text-primary">{rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
