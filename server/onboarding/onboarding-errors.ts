export class UnauthorizedOnboardingError extends Error {
  constructor() {
    super("Authentication is required for onboarding preferences")
    this.name = "UnauthorizedOnboardingError"
  }
}

export class InvalidPreferredMoviesError extends Error {
  constructor(message = "Preferred movies are invalid") {
    super(message)
    this.name = "InvalidPreferredMoviesError"
  }
}
