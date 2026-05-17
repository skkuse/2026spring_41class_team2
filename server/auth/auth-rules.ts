const DEFAULT_POST_LOGIN_PATH = "/"
const ONBOARDING_PATH = "/onboarding"

export function normalizeReturnTo(returnTo: string | null | undefined) {
  if (!returnTo) {
    return null
  }

  const trimmed = returnTo.trim()
  if (!trimmed || trimmed.includes("\\")) {
    return null
  }

  try {
    const decoded = decodeURIComponent(trimmed)
    if (/^[a-z][a-z\d+\-.]*:/i.test(decoded) || decoded.startsWith("//")) {
      return null
    }
  } catch {
    return null
  }

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null
  }

  return trimmed
}

export function resolvePostLoginRedirect(input: {
  returnTo?: string | null
  onboardingCompleted: boolean
}) {
  if (!input.onboardingCompleted) {
    return ONBOARDING_PATH
  }

  return normalizeReturnTo(input.returnTo) ?? DEFAULT_POST_LOGIN_PATH
}

