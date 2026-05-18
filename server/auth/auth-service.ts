import type { AuthUser } from "./auth-types"
import type { Profile, UserRepository } from "@/server/users/user-types"

export type AuthServiceDeps = {
  userRepository: UserRepository
}

export function createAuthService(deps: AuthServiceDeps) {
  return {
    async ensureProfile(authUser: AuthUser): Promise<Profile> {
      const email = authUser.email?.trim()
      if (!email) {
        throw new Error("Auth user email is required")
      }

      const existingProfile = await deps.userRepository.findProfileById(authUser.id)
      const profileImageUrl = getMetadataString(authUser.userMetadata, [
        "avatar_url",
        "picture",
        "profile_image_url",
      ])

      if (!existingProfile) {
        return deps.userRepository.createProfile({
          id: authUser.id,
          name: getMetadataString(authUser.userMetadata, ["name", "full_name"]) ?? email.split("@")[0],
          email,
          profileImageUrl,
          onboardingCompleted: false,
        })
      }

      const update: { email?: string; profileImageUrl?: string | null } = {}
      if (existingProfile.email !== email) {
        update.email = email
      }
      if (existingProfile.profileImageUrl !== profileImageUrl) {
        update.profileImageUrl = profileImageUrl
      }

      if (Object.keys(update).length === 0) {
        return existingProfile
      }

      return deps.userRepository.updateProfile(authUser.id, update)
    },
  }
}

function getMetadataString(
  metadata: Record<string, unknown> | undefined,
  keys: string[],
) {
  for (const key of keys) {
    const value = metadata?.[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return null
}
