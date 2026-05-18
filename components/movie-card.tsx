"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Check, Star, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState, type MouseEvent } from "react"
import { BookmarkedMoviesApiError, toggleMovieBookmark } from "@/lib/bookmarks/bookmarked-movies-client"
import { cn } from "@/lib/utils"

interface MovieCardProps {
  id: string
  title: string
  year: string
  rating: number
  genre: string
  posterUrl?: string | null
  isBookmarked?: boolean
  reason?: string
  selectable?: boolean
  selected?: boolean
  disabled?: boolean
  showLikeButton?: boolean
  compact?: boolean
  onClick?: () => void
  onBookmarkChange?: (isBookmarked: boolean) => void
}

export function MovieCard({
  id,
  title,
  year,
  rating,
  genre,
  posterUrl,
  isBookmarked = false,
  reason,
  selectable = false,
  selected = false,
  disabled = false,
  showLikeButton = true,
  compact = false,
  onClick,
  onBookmarkChange,
}: MovieCardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLiked, setIsLiked] = useState(isBookmarked)
  const [bookmarkPending, setBookmarkPending] = useState(false)

  useEffect(() => {
    setIsLiked(isBookmarked)
  }, [isBookmarked])

  const handleBookmarkClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (bookmarkPending) {
      return
    }

    const movieId = Number(id)
    if (!Number.isInteger(movieId) || movieId <= 0) {
      return
    }

    const previous = isLiked
    const next = !previous
    setIsLiked(next)
    setBookmarkPending(true)

    try {
      const result = await toggleMovieBookmark(movieId, next)
      setIsLiked(result.isBookmarked)
      onBookmarkChange?.(result.isBookmarked)
    } catch (error) {
      setIsLiked(previous)
      if (error instanceof BookmarkedMoviesApiError && error.isUnauthorized) {
        router.push(`/login?returnTo=${encodeURIComponent(pathname)}`)
      }
    } finally {
      setBookmarkPending(false)
    }
  }

  const cardClasses = cn(
    "relative overflow-hidden rounded-xl bg-card transition-all duration-300",
    selectable
      ? "w-full text-left hover:ring-2 hover:ring-primary/50"
      : "hover:ring-2 hover:ring-primary/50",
    selected && "ring-2 ring-primary shadow-lg shadow-primary/10",
    disabled && "cursor-not-allowed opacity-60",
    compact && "rounded-lg text-[0.8rem]",
  )

  const content = (
    <div className={cardClasses}>
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className={cn(
              "h-full w-full object-cover transition-transform duration-300",
              compact ? "group-hover:scale-[1.02]" : "group-hover:scale-105",
              selected && "scale-[1.01]",
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <span className="text-4xl font-bold text-muted-foreground">{title.charAt(0)}</span>
          </div>
        )}

        {selected && (
          <div className="absolute left-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <Check className="h-4 w-4" />
          </div>
        )}

        {showLikeButton && !selectable && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-20 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
            aria-label={isLiked ? "찜 해제" : "찜하기"}
            aria-pressed={isLiked}
            disabled={bookmarkPending}
            onClick={handleBookmarkClick}
          >
            <Heart className={cn("h-4 w-4", isLiked ? "fill-red-500 text-red-500" : "")} />
          </Button>
        )}

        {selected && (
          <div className="absolute inset-0 z-10 bg-primary/10" />
        )}
      </div>

      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent",
        compact ? "p-2.5" : "p-4",
      )}>
        <h3 className={cn("font-semibold text-foreground line-clamp-1", compact ? "text-[0.85rem]" : "text-base")}>
          {title}
        </h3>
        <div className={cn("mt-1 flex items-center gap-2 text-sm text-muted-foreground", compact && "gap-1 text-[0.68rem]")}>
          <span>{year}</span>
          <span>|</span>
          <span>{genre}</span>
        </div>
        <div className={cn("mt-2 flex items-center gap-1", compact && "mt-1")}>
          <Star className={cn("fill-primary text-primary", compact ? "h-3 w-3" : "h-4 w-4")} />
          <span className={cn("font-medium text-primary", compact ? "text-[0.68rem]" : "text-sm")}>{rating.toFixed(1)}</span>
        </div>
        {reason && (
          <p className={cn("mt-2 line-clamp-2 leading-relaxed text-muted-foreground", compact ? "text-[0.68rem]" : "text-sm")}>
            {reason}
          </p>
        )}
      </div>
    </div>
  )

  if (selectable) {
    return (
      <button
        type="button"
        className={cn("group block w-full text-left", disabled && "cursor-not-allowed")}
        onClick={onClick}
        disabled={disabled}
      >
        {content}
      </button>
    )
  }

  return (
    <Link href={`/movie/${id}`} className="group block">
      {content}
    </Link>
  )
}
