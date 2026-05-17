import { describe, expect, it, vi } from "vitest"
import { createUserService } from "./user-service"
import type { UserRepository } from "./user-types"

function createRepository(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findProfileById: vi.fn(),
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    getUserCounts: vi.fn(),
    ...overrides,
  }
}

describe("userService.getCurrentUser", () => {
  it("returns an unauthenticated response without repository calls", async () => {
    const repository = createRepository()
    const service = createUserService({ userRepository: repository })

    const response = await service.getCurrentUser({ requestId: "req-1", user: null }, null)

    expect(response).toEqual({ authenticated: false, user: null })
    expect(repository.findProfileById).not.toHaveBeenCalled()
  })

  it("returns profile and user counts for authenticated users", async () => {
    const repository = createRepository({
      findProfileById: vi.fn().mockResolvedValue({
        id: "user-1",
        name: "사용자",
        email: "user@example.com",
        profileImageUrl: null,
        onboardingCompleted: true,
      }),
      getUserCounts: vi.fn().mockResolvedValue({
        bookmarkedMovieCount: 3,
        reviewCount: 2,
      }),
    })
    const service = createUserService({ userRepository: repository })

    const response = await service.getCurrentUser(
      { requestId: "req-1", user: { id: "user-1", email: "user@example.com" } },
      { id: "user-1", email: "user@example.com", userMetadata: {} },
    )

    expect(response).toEqual({
      authenticated: true,
      user: {
        id: "user-1",
        name: "사용자",
        email: "user@example.com",
        profileImageUrl: null,
        onboardingCompleted: true,
        bookmarkedMovieCount: 3,
        reviewCount: 2,
      },
    })
    expect(repository.getUserCounts).toHaveBeenCalledWith("user-1")
  })
})

