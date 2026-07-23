import { apiBaseUrl } from "@/config"
import { apiUrl } from "@/api/authClient"
import { defaultBrowserTokenStore, type TokenStore } from "@/api/tokenStore"
import type { ErrorMessage, InsightsResponse } from "@/api/types"

export class InsightsClient {
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

  async get(): Promise<InsightsResponse> {
    const response = await this.authorized("/api/insights")
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Get insights failed"))
    }
    return (await response.json()) as InsightsResponse
  }

  async dismissTip(tipId: string): Promise<void> {
    const response = await this.authorized(
      `/api/insights/tips/${encodeURIComponent(tipId)}/dismiss`,
      { method: "POST" },
    )
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Dismiss tip failed"))
    }
  }

  private async authorized(
    path: string,
    init: RequestInit = {},
  ): Promise<Response> {
    const token = this.tokens.get()
    if (!token) {
      throw new Error("Not signed in")
    }
    const headers = new Headers(init.headers)
    headers.set("Authorization", `Bearer ${token}`)
    const response = await this.fetchFn(apiUrl(this.baseUrl, path), {
      ...init,
      headers,
    })
    if (response.status === 401) {
      this.tokens.clear()
      throw new Error("Session expired. Please sign in again.")
    }
    return response
  }
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
