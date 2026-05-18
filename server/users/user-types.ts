// HTTP DTO
export type CurrentUserSummaryDto = {
  id: string
  name: string
  email: string
  profileImageUrl: string | null
  onboardingCompleted: boolean
  bookmarkedMovieCount: number
  reviewCount: number
}

export type MeResponseDto =
  | {
      authenticated: false
      user: null
    }
  | {
      authenticated: true
      user: CurrentUserSummaryDto
    }

// Domain
export type Profile = {
  id: string
  name: string
  email: string
  profileImageUrl: string | null
  onboardingCompleted: boolean
}

export type UserCounts = {
  bookmarkedMovieCount: number
  reviewCount: number
}

export type CurrentUserSummary = Profile & UserCounts

export type CurrentUserResult =
  | {
      authenticated: false
      user: null
    }
  | {
      authenticated: true
      user: CurrentUserSummary
    }

// Repository params
export type CreateProfileRepoParams = {
  id: string
  name: string
  email: string
  profileImageUrl: string | null
  onboardingCompleted: boolean
}

export type UpdateProfileRepoParams = {
  email?: string
  profileImageUrl?: string | null
}

// Repository port
export type UserRepository = {
  findProfileById(userId: string): Promise<Profile | null>
  createProfile(input: CreateProfileRepoParams): Promise<Profile>
  updateProfile(userId: string, input: UpdateProfileRepoParams): Promise<Profile>
  getUserCounts(userId: string): Promise<UserCounts>
}
