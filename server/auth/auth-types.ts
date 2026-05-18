export type RequestContext = {
  requestId: string
  user: {
    id: string
    email: string
  } | null
}

export type AuthenticatedRequestContext = RequestContext & {
  user: {
    id: string
    email: string
  }
}

export type AuthUser = {
  id: string
  email: string | null
  userMetadata?: Record<string, unknown>
}
