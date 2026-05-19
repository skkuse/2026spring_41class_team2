export class UnauthorizedRecommendationError extends Error {
  constructor() {
    super("Authentication is required for recommendations")
    this.name = "UnauthorizedRecommendationError"
  }
}

export class OnboardingRequiredRecommendationError extends Error {
  constructor() {
    super("Onboarding is required for recommendations")
    this.name = "OnboardingRequiredRecommendationError"
  }
}
