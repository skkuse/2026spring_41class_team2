import "server-only"

import { and, asc, count, desc, eq, sql } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import { movieStats, movies, profiles, reviewLikes, reviews } from "@/server/db/schema"
import type { ListMovieReviewsRepoParams, ReviewRepository } from "./review-types"

export function createReviewRepository(): ReviewRepository {
  return {
    async movieExists(movieId) {
      const [row] = await getDb().select({ id: movies.id }).from(movies).where(eq(movies.id, movieId)).limit(1)
      return Boolean(row)
    },

    async reviewExists(reviewId) {
      const [row] = await getDb().select({ id: reviews.id }).from(reviews).where(eq(reviews.id, reviewId)).limit(1)
      return Boolean(row)
    },

    async findReviewByUserAndMovie(userId, movieId) {
      const [row] = await getDb()
        .select({ id: reviews.id })
        .from(reviews)
        .where(and(eq(reviews.userId, userId), eq(reviews.movieId, movieId)))
        .limit(1)
      return row ?? null
    },

    async listMovieReviews(params) {
      const [totalRow] = await getDb()
        .select({ count: count() })
        .from(reviews)
        .where(eq(reviews.movieId, params.movieId))

      const likesCount = sql<number>`count(${reviewLikes.userId})::int`
      const isLiked = buildIsLikedExpression(params.currentUserId)

      const rows = await getDb()
        .select({
          id: reviews.id,
          userId: profiles.id,
          userName: profiles.name,
          profileImageUrl: profiles.profileImageUrl,
          rating: reviews.rating,
          content: reviews.content,
          date: reviews.createdAt,
          likes: likesCount,
          isLiked,
        })
        .from(reviews)
        .innerJoin(profiles, eq(profiles.id, reviews.userId))
        .leftJoin(reviewLikes, eq(reviewLikes.reviewId, reviews.id))
        .where(eq(reviews.movieId, params.movieId))
        .groupBy(reviews.id, profiles.id)
        .orderBy(...buildMovieReviewsOrderBy(params, likesCount))
        .limit(params.limit)
        .offset(params.offset)

      return {
        reviews: rows.map((row) => ({
          id: row.id,
          user: {
            id: row.userId,
            name: row.userName,
            profileImageUrl: row.profileImageUrl,
          },
          rating: row.rating,
          content: row.content,
          date: row.date,
          likes: row.likes,
          isLiked: row.isLiked,
        })),
        totalCount: totalRow?.count ?? 0,
      }
    },

    async createReviewWithStats(params) {
      return getDb().transaction(async (tx) => {
        const [created] = await tx
          .insert(reviews)
          .values({
            userId: params.userId,
            movieId: params.movieId,
            rating: params.rating.toFixed(1),
            content: params.content,
          })
          .returning({
            id: reviews.id,
            rating: reviews.rating,
            content: reviews.content,
            date: reviews.createdAt,
          })

        await tx
          .update(movieStats)
          .set({
            cinemateRatingSum: sql`${movieStats.cinemateRatingSum} + ${params.rating}`,
            cinemateReviewCount: sql`${movieStats.cinemateReviewCount} + 1`,
            updatedAt: sql`now()`,
          })
          .where(eq(movieStats.movieId, params.movieId))

        return created
      })
    },

    async likeReview(params) {
      await getDb().insert(reviewLikes).values(params).onConflictDoNothing()
    },

    async unlikeReview(params) {
      await getDb()
        .delete(reviewLikes)
        .where(and(eq(reviewLikes.reviewId, params.reviewId), eq(reviewLikes.userId, params.userId)))
    },

    async countReviewLikes(reviewId) {
      const [row] = await getDb().select({ count: count() }).from(reviewLikes).where(eq(reviewLikes.reviewId, reviewId))
      return row?.count ?? 0
    },

    async listReviewsByUser(params) {
      const [totalRow] = await getDb()
        .select({ count: count() })
        .from(reviews)
        .where(eq(reviews.userId, params.userId))

      const likesCount = sql<number>`count(${reviewLikes.userId})::int`
      const rows = await getDb()
        .select({
          id: reviews.id,
          movieId: reviews.movieId,
          movieTitle: movies.title,
          posterPath: movies.posterPath,
          rating: reviews.rating,
          content: reviews.content,
          date: reviews.createdAt,
          likes: likesCount,
        })
        .from(reviews)
        .innerJoin(movies, eq(movies.id, reviews.movieId))
        .leftJoin(reviewLikes, eq(reviewLikes.reviewId, reviews.id))
        .where(eq(reviews.userId, params.userId))
        .groupBy(reviews.id, movies.id)
        .orderBy(desc(reviews.createdAt), asc(reviews.id))
        .limit(params.limit)
        .offset(params.offset)

      return {
        reviews: rows,
        totalCount: totalRow?.count ?? 0,
      }
    },
  }
}

function buildIsLikedExpression(userId: string | null) {
  if (!userId) {
    return sql<boolean>`false`
  }

  return sql<boolean>`exists (
    select 1 from ${reviewLikes} current_user_like
    where current_user_like.review_id = ${reviews.id}
      and current_user_like.user_id = ${userId}
  )`
}

function buildMovieReviewsOrderBy(params: ListMovieReviewsRepoParams, likesCount: ReturnType<typeof sql<number>>) {
  if (params.sort === "likes") {
    return [desc(likesCount), desc(reviews.createdAt), asc(reviews.id)]
  }

  return [desc(reviews.createdAt), asc(reviews.id)]
}
