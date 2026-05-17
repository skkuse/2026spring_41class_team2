import { describe, expect, it, vi } from "vitest"
import { createAuthService } from "./auth-service"
import type { UserRepository } from "@/server/users/user-types"

function createRepository(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findProfileById: vi.fn(),
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    getUserCounts: vi.fn(),
    ...overrides,
  }
}

describe("authService.ensureProfile", () => {
  it("creates a profile from auth metadata when missing", async () => {
    const repository = createRepository({
      findProfileById: vi.fn().mockResolvedValue(null),
      createProfile: vi.fn().mockImplementation(async (input) => input),
    })
    const service = createAuthService({ userRepository: repository })

    const profile = await service.ensureProfile({
      id: "user-1",
      email: "user@example.com",
      userMetadata: { name: "사용자", avatar_url: "https://example.com/avatar.png" },
    })

    expect(repository.createProfile).toHaveBeenCalledWith({
      id: "user-1",
      name: "사용자",
      email: "user@example.com",
      profileImageUrl: "https://example.com/avatar.png",
      onboardingCompleted: false,
    })
    expect(profile.name).toBe("사용자")
  })

  it("uses email local-part when metadata name is missing", async () => {
    const repository = createRepository({
      findProfileById: vi.fn().mockResolvedValue(null),
      createProfile: vi.fn().mockImplementation(async (input) => input),
    })
    const service = createAuthService({ userRepository: repository })

    await service.ensureProfile({ id: "user-1", email: "member@example.com", userMetadata: {} })

    expect(repository.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({ name: "member" }),
    )
  })

  it("updates email and avatar without overwriting an existing name", async () => {
    const repository = createRepository({
      findProfileById: vi.fn().mockResolvedValue({
        id: "user-1",
        name: "직접 수정한 이름",
        email: "old@example.com",
        profileImageUrl: null,
        onboardingCompleted: true,
      }),
      updateProfile: vi.fn().mockResolvedValue({
        id: "user-1",
        name: "직접 수정한 이름",
        email: "new@example.com",
        profileImageUrl: "https://example.com/new.png",
        onboardingCompleted: true,
      }),
    })
    const service = createAuthService({ userRepository: repository })

    const profile = await service.ensureProfile({
      id: "user-1",
      email: "new@example.com",
      userMetadata: { name: "OAuth 이름", picture: "https://example.com/new.png" },
    })

    expect(repository.updateProfile).toHaveBeenCalledWith("user-1", {
      email: "new@example.com",
      profileImageUrl: "https://example.com/new.png",
    })
    expect(profile.name).toBe("직접 수정한 이름")
  })
})

