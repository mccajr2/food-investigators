import { apiBaseUrl } from "@/config"
import { defaultBrowserTokenStore, type TokenStore } from "@/api/tokenStore"
import type {
  AuthResponse,
  ErrorMessage,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from "@/api/types"

export class AuthClient {
  private readonly baseUrl: string
  private readonly fetchFn: typeof fetch
  private readonly tokens: TokenStore

  constructor(
    baseUrl: string = apiBaseUrl,
    fetchFn: typeof fetch = globalThis.fetch.bind(globalThis),
    tokens: TokenStore = defaultBrowserTokenStore(),
  ) {
    this.baseUrl = baseUrl
    this.fetchFn = fetchFn
    this.tokens = tokens
  }

  getStoredToken(): string | null {
    return this.tokens.get()
  }

  async register(
    email: string,
    password: string,
    rememberMe: boolean = true,
  ): Promise<AuthResponse> {
    const body: RegisterRequest = { email, password, rememberMe }
    const response = await this.postJson("/api/auth/register", body)
    return this.storeAuth(response, rememberMe)
  }

  async login(
    email: string,
    password: string,
    rememberMe: boolean = true,
  ): Promise<AuthResponse> {
    const body: LoginRequest = { email, password, rememberMe }
    const response = await this.postJson("/api/auth/login", body)
    return this.storeAuth(response, rememberMe)
  }

  async logout(): Promise<void> {
    const token = this.tokens.get()
    if (!token) {
      return
    }
    const response = await this.fetchFn(apiUrl(this.baseUrl, "/api/auth/logout"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
    this.tokens.clear()
    if (!response.ok && response.status !== 401) {
      throw new Error(await readErrorMessage(response, "Sign out failed"))
    }
  }

  async me(): Promise<UserResponse> {
    const token = this.tokens.get()
    if (!token) {
      throw new Error("Not signed in")
    }
    const response = await this.fetchFn(apiUrl(this.baseUrl, "/api/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      if (response.status === 401) {
        this.tokens.clear()
      }
      throw new Error(await readErrorMessage(response, "Session check failed"))
    }
    return (await response.json()) as UserResponse
  }

  private async storeAuth(
    response: Response,
    rememberMe: boolean,
  ): Promise<AuthResponse> {
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Auth request failed"))
    }
    const body = (await response.json()) as AuthResponse
    if (typeof body.token !== "string" || !body.user?.email) {
      throw new Error("Invalid auth response")
    }
    this.tokens.set(body.token, rememberMe)
    return body
  }

  private postJson(path: string, body: unknown): Promise<Response> {
    return this.fetchFn(apiUrl(this.baseUrl, path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }
}

export function apiUrl(baseUrl: string, path: string): string {
  if (!baseUrl) {
    return path
  }
  return new URL(path, `${baseUrl}/`).toString()
}

async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as ErrorMessage
    if (typeof body.message === "string" && body.message.length > 0) {
      return body.message
    }
  } catch {
    // ignore non-JSON bodies
  }
  return `${fallback} (${response.status})`
}
