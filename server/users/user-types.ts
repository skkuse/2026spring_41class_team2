export type Profile = {
  id: string
  name: string
  email: string
  profileImageUrl: string | null
  onboardingCompleted: boolean
}

export type ProfileCreateInput = {
  id: string
  name: string
  email: string
  profileImageUrl: string | null
  onboardingCompleted: boolean
}

export type ProfileUpdateInput = {
  email?: string
  profileImageUrl?: string | null
}

export type UserCounts = {
  bookmarkedMovieCount: number
  reviewCount: number
}

export type CurrentUserSummary = Profile & UserCounts

export type MeResponse =
  | {
      authenticated: false
      user: null
    }
  | {
      authenticated: true
      user: CurrentUserSummary
    }

export type UserRepository = {
  findProfileById(userId: string): Promise<Profile | null>
  createProfile(input: ProfileCreateInput): Promise<Profile>
  updateProfile(userId: string, input: ProfileUpdateInput): Promise<Profile>
  getUserCounts(userId: string): Promise<UserCounts>
}

