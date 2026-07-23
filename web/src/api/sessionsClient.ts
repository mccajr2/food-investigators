import { apiBaseUrl } from "@/config"
import { apiUrl } from "@/api/authClient"
import { defaultBrowserTokenStore, type TokenStore } from "@/api/tokenStore"
import type {
  CompleteSessionRequest,
  CreateSessionRequest,
  ErrorMessage,
  SessionResponse,
  UpdateParentNoteRequest,
  UpdateSessionRequest,
} from "@/api/types"

export class SessionsClient {
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

  async listUpcoming(): Promise<SessionResponse[]> {
    const response = await this.authorized("/api/sessions")
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "List sessions failed"))
    }
    return (await response.json()) as SessionResponse[]
  }

  async listHistory(): Promise<SessionResponse[]> {
    const response = await this.authorized("/api/sessions/history")
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "List history failed"))
    }
    return (await response.json()) as SessionResponse[]
  }

  async downloadHistoryPdf(range?: {
    from?: string
    to?: string
  }): Promise<Blob> {
    const params = new URLSearchParams()
    if (range?.from) {
      params.set("from", range.from)
    }
    if (range?.to) {
      params.set("to", range.to)
    }
    const query = params.toString()
    const path = query
      ? `/api/sessions/history.pdf?${query}`
      : "/api/sessions/history.pdf"
    const response = await this.authorized(path)
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "Download history PDF failed"),
      )
    }
    return response.blob()
  }

  async get(sessionId: string): Promise<SessionResponse> {
    const response = await this.authorized(`/api/sessions/${sessionId}`)
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Get session failed"))
    }
    return (await response.json()) as SessionResponse
  }

  async create(request: CreateSessionRequest): Promise<SessionResponse> {
    const response = await this.authorized("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Create session failed"))
    }
    return (await response.json()) as SessionResponse
  }

  async update(
    sessionId: string,
    request: UpdateSessionRequest,
  ): Promise<SessionResponse> {
    const response = await this.authorized(`/api/sessions/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Update session failed"))
    }
    return (await response.json()) as SessionResponse
  }

  async cancel(sessionId: string): Promise<SessionResponse> {
    const response = await this.authorized(`/api/sessions/${sessionId}/cancel`, {
      method: "POST",
    })
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Cancel session failed"))
    }
    return (await response.json()) as SessionResponse
  }

  async complete(
    sessionId: string,
    request: CompleteSessionRequest,
  ): Promise<SessionResponse> {
    const response = await this.authorized(`/api/sessions/${sessionId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Complete session failed"))
    }
    return (await response.json()) as SessionResponse
  }

  async updateParentNote(
    sessionId: string,
    request: UpdateParentNoteRequest,
  ): Promise<SessionResponse> {
    const response = await this.authorized(
      `/api/sessions/${sessionId}/parent-note`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      },
    )
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "Update parent note failed"),
      )
    }
    return (await response.json()) as SessionResponse
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
