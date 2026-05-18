import "server-only"

import { count, eq } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import { movieBookmarks, profiles, reviews, type ProfileRow } from "@/server/db/schema"
import type {
  CreateProfileRepoParams,
  Profile,
  UpdateProfileRepoParams,
  UserCounts,
  UserRepository,
} from "./user-types"

export function createUserRepository(): UserRepository {
  return {
    async findProfileById(userId: string): Promise<Profile | null> {
      const [row] = await getDb()
        .select()
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1)

      return row ? mapProfile(row) : null
    },

    async createProfile(input: CreateProfileRepoParams): Promise<Profile> {
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

    async updateProfile(userId: string, input: UpdateProfileRepoParams): Promise<Profile> {
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

    async getUserCounts(userId: string): Promise<UserCounts> {
      const [bookmarkedMovies, userReviews] = await Promise.all([
        getDb().select({ count: count() }).from(movieBookmarks).where(eq(movieBookmarks.userId, userId)),
        getDb().select({ count: count() }).from(reviews).where(eq(reviews.userId, userId)),
      ])

      return {
        bookmarkedMovieCount: bookmarkedMovies[0]?.count ?? 0,
        reviewCount: userReviews[0]?.count ?? 0,
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

function toProfileUpdateRow(input: UpdateProfileRepoParams): Partial<Pick<ProfileRow, "email" | "profileImageUrl">> {
  return {
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.profileImageUrl !== undefined ? { profileImageUrl: input.profileImageUrl } : {}),
  }
}
