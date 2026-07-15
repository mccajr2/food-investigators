import { apiBaseUrl } from "@/config"
import { apiUrl } from "@/api/authClient"
import { defaultBrowserTokenStore, type TokenStore } from "@/api/tokenStore"
import type {
  CreateFoodRequest,
  ErrorMessage,
  FoodResponse,
  UpdateFoodRequest,
} from "@/api/types"

export class FoodsClient {
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

  async list(includeArchived: boolean = false): Promise<FoodResponse[]> {
    const path = includeArchived
      ? "/api/foods?includeArchived=true"
      : "/api/foods"
    const response = await this.authorized(path)
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "List foods failed"))
    }
    return (await response.json()) as FoodResponse[]
  }

  async create(request: CreateFoodRequest): Promise<FoodResponse> {
    const response = await this.authorized("/api/foods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Create food failed"))
    }
    return (await response.json()) as FoodResponse
  }

  async update(foodId: string, request: UpdateFoodRequest): Promise<FoodResponse> {
    const response = await this.authorized(`/api/foods/${foodId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Update food failed"))
    }
    return (await response.json()) as FoodResponse
  }

  async archive(foodId: string): Promise<FoodResponse> {
    const response = await this.authorized(`/api/foods/${foodId}/archive`, {
      method: "POST",
    })
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Archive food failed"))
    }
    return (await response.json()) as FoodResponse
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
      // Surface a clear message; body may also say Unauthorized
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
