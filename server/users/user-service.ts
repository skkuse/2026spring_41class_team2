import { createAuthService } from "@/server/auth/auth-service"
import type { AuthUser, RequestContext } from "@/server/auth/auth-types"
import type { MeResponse, UserRepository } from "./user-types"

export type UserServiceDeps = {
  userRepository: UserRepository
}

export function createUserService(deps: UserServiceDeps) {
  const authService = createAuthService({ userRepository: deps.userRepository })

  return {
    async getCurrentUser(context: RequestContext, authUser: AuthUser | null): Promise<MeResponse> {
      if (!context.user || !authUser) {
        return { authenticated: false, user: null }
      }

      const profile = await authService.ensureProfile(authUser)
      const counts = await deps.userRepository.getUserCounts(context.user.id)

      return {
        authenticated: true,
        user: {
          ...profile,
          ...counts,
        },
      }
    },
  }
}

