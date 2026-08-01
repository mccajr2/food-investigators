import { describe, expect, it, vi } from "vitest"

import { AuthClient, apiUrl } from "@/api/authClient"
import type { TokenStore } from "@/api/tokenStore"

function memoryStore(): TokenStore {
  let token: string | null = null
  let remember = true
  return {
    get: () => token,
    set: (value, rememberMe) => {
      token = value
      remember = rememberMe
    },
    clear: () => {
      token = null
    },
    // test helper access
    get rememberMe() {
      return remember
    },
  } as TokenStore & { rememberMe: boolean }
}

describe("AuthClient", () => {
  it("registers and stores a remember-me token", async () => {
    const store = memoryStore() as TokenStore & { rememberMe: boolean }
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          token: "abc",
          user: {
            id: "11111111-1111-1111-1111-111111111111",
            email: "parent@example.com",
            householdId: "22222222-2222-2222-2222-222222222222",
            childDisplayName: null,
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    )

    const client = new AuthClient("http://localhost:8080", fetchFn, store)
    const result = await client.register("parent@example.com", "password1", true)

    expect(result.user.email).toBe("parent@example.com")
    expect(store.get()).toBe("abc")
    expect(store.rememberMe).toBe(true)
    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/api/auth/register",
    )
    const init = fetchFn.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(String(init.body))).toEqual({
      email: "parent@example.com",
      password: "password1",
      rememberMe: true,
    })
  })

  it("registers with optional childDisplayName when provided", async () => {
    const store = memoryStore()
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          token: "abc",
          user: {
            id: "11111111-1111-1111-1111-111111111111",
            email: "parent@example.com",
            householdId: "22222222-2222-2222-2222-222222222222",
            childDisplayName: "Alex",
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    )

    const client = new AuthClient("http://localhost:8080", fetchFn, store)
    const result = await client.register(
      "parent@example.com",
      "password1",
      true,
      "  Alex  ",
    )

    expect(result.user.childDisplayName).toBe("Alex")
    const init = fetchFn.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(String(init.body))).toEqual({
      email: "parent@example.com",
      password: "password1",
      rememberMe: true,
      childDisplayName: "Alex",
    })
  })

  it("logs in with session-only rememberMe false", async () => {
    const store = memoryStore() as TokenStore & { rememberMe: boolean }
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          token: "session-token",
          user: {
            id: "11111111-1111-1111-1111-111111111111",
            email: "parent@example.com",
            householdId: "22222222-2222-2222-2222-222222222222",
            childDisplayName: null,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )

    const client = new AuthClient("http://localhost:8080", fetchFn, store)
    await client.login("parent@example.com", "password1", false)

    expect(store.get()).toBe("session-token")
    expect(store.rememberMe).toBe(false)
  })

  it("calls me with Authorization bearer header", async () => {
    const store = memoryStore()
    store.set("tok", true)
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "11111111-1111-1111-1111-111111111111",
          email: "parent@example.com",
          householdId: "22222222-2222-2222-2222-222222222222",
          childDisplayName: "Sam",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )

    const client = new AuthClient("http://localhost:8080", fetchFn, store)
    const me = await client.me()

    expect(me.email).toBe("parent@example.com")
    expect(me.childDisplayName).toBe("Sam")
    const init = fetchFn.mock.calls[0]?.[1] as RequestInit
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok")
  })

  it("patches me to set or clear childDisplayName", async () => {
    const store = memoryStore()
    store.set("tok", true)
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "11111111-1111-1111-1111-111111111111",
          email: "parent@example.com",
          householdId: "22222222-2222-2222-2222-222222222222",
          childDisplayName: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )

    const client = new AuthClient("http://localhost:8080", fetchFn, store)
    const updated = await client.updateMe(null)

    expect(updated.childDisplayName).toBeNull()
    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/api/auth/me",
    )
    const init = fetchFn.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe("PATCH")
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok")
    expect(JSON.parse(String(init.body))).toEqual({ childDisplayName: null })
  })

  it("updateMe maps 401 to session expired and clears the token", async () => {
    const store = memoryStore()
    store.set("tok", true)
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const client = new AuthClient("http://localhost:8080", fetchFn, store)
    await expect(client.updateMe("Alex")).rejects.toThrow(
      "Session expired. Please sign in again.",
    )
    expect(store.get()).toBeNull()
  })

  it("surfaces API error messages", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Email already registered" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const client = new AuthClient("http://localhost:8080", fetchFn, memoryStore())

    await expect(
      client.register("parent@example.com", "password1", true),
    ).rejects.toThrow("Email already registered")
  })

  it("logs out with bearer token and clears storage", async () => {
    const store = memoryStore()
    store.set("tok", true)
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))

    const client = new AuthClient("http://localhost:8080", fetchFn, store)
    await client.logout()

    expect(store.get()).toBeNull()
    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/api/auth/logout",
    )
    const init = fetchFn.mock.calls[0]?.[1] as RequestInit
    expect(init.headers).toEqual({ Authorization: "Bearer tok" })
  })

  it("builds same-origin and absolute api urls", () => {
    expect(apiUrl("", "/api/auth/me")).toBe("/api/auth/me")
    expect(apiUrl("http://localhost:8080", "/api/auth/me")).toBe(
      "http://localhost:8080/api/auth/me",
    )
  })
})
