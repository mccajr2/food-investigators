/** Mirrors auth schemas in `contracts/openapi.yaml`. */
export type UserResponse = {
  id: string
  email: string
  householdId: string
}

export type AuthResponse = {
  token: string
  user: UserResponse
}

export type RegisterRequest = {
  email: string
  password: string
  rememberMe?: boolean
}

export type LoginRequest = {
  email: string
  password: string
  rememberMe?: boolean
}

export type ErrorMessage = {
  message: string
}
