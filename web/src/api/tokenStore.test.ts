import { describe, expect, it } from "vitest"

import { createBrowserTokenStore } from "@/api/tokenStore"

describe("createBrowserTokenStore", () => {
  it("persists remember-me tokens in localStorage only", () => {
    const local = memoryStorage()
    const session = memoryStorage()
    const store = createBrowserTokenStore(local, session)

    store.set("remember-token", true)

    expect(local.getItem("quickapp.auth.token")).toBe("remember-token")
    expect(session.getItem("quickapp.auth.token.session")).toBeNull()
    expect(store.get()).toBe("remember-token")
  })

  it("stores session-only tokens in sessionStorage only", () => {
    const local = memoryStorage()
    const session = memoryStorage()
    const store = createBrowserTokenStore(local, session)

    store.set("session-token", false)

    expect(session.getItem("quickapp.auth.token.session")).toBe("session-token")
    expect(local.getItem("quickapp.auth.token")).toBeNull()
    expect(store.get()).toBe("session-token")
  })
})

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key) {
      return map.has(key) ? map.get(key)! : null
    },
    key(index) {
      return [...map.keys()][index] ?? null
    },
    removeItem(key) {
      map.delete(key)
    },
    setItem(key, value) {
      map.set(key, value)
    },
  }
}
