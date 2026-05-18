import "server-only"

import { eq, sql } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import { isUndefinedTableError } from "@/server/db/postgres-errors"
import { profiles, type ProfileRow } from "@/server/db/schema"
import type {
  Profile,
  ProfileUpdateInput,
  UserRepository,
} from "./user-types"

export function createUserRepository(): UserRepository {
  return {
    async findProfileById(userId) {
      const [row] = await getDb()
        .select()
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1)

      return row ? mapProfile(row) : null
    },

    async createProfile(input) {
      const [row] = await getDb()
        .insert(profiles)
        .values({
          id: input.id,
          name: input.name,
          email: input.email,
          profileImageUrl: input.profileImageUrl,
          onboardingCompleted: input.onboardingCompleted,
        })
        .returning()

      return mapProfile(row)
    },

    async updateProfile(userId, input) {
      const [row] = await getDb()
        .update(profiles)
        .set({
          ...toProfileUpdateRow(input),
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId))
        .returning()

      return mapProfile(row)
    },

    async getUserCounts(userId) {
      const [bookmarkedMovieCount, reviewCount] = await Promise.all([
        countUserRows("movie_bookmarks", "user_id", userId),
        countUserRows("reviews", "user_id", userId),
      ])

      return {
        bookmarkedMovieCount,
        reviewCount,
      }
    },
  }
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    profileImageUrl: row.profileImageUrl,
    onboardingCompleted: row.onboardingCompleted,
  }
}

function toProfileUpdateRow(input: ProfileUpdateInput) {
  return {
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.profileImageUrl !== undefined ? { profileImageUrl: input.profileImageUrl } : {}),
  }
}

async function countUserRows(tableName: "movie_bookmarks" | "reviews", columnName: "user_id", userId: string) {
  try {
    const rows = await getDb().execute<{ count: number }>(
      sql`select count(*)::int as count from ${sql.raw(`public.${tableName}`)} where ${sql.raw(columnName)} = ${userId}`,
    )

    return Number(rows[0]?.count ?? 0)
  } catch (error) {
    if (isUndefinedTableError(error)) {
      return 0
    }
    throw error
  }
}
