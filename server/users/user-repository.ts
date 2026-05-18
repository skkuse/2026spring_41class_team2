import "server-only"

import { eq } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import { profiles, type ProfileRow } from "@/server/db/schema"
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
      void userId

      // TODO: movie_bookmarks, reviews 테이블 구현 후 실제 사용자별 count 조회로 교체한다.
      return {
        bookmarkedMovieCount: 0,
        reviewCount: 0,
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
