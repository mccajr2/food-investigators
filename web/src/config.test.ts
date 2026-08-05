import { describe, expect, it } from "vitest"
import { resolveApiBaseUrl } from "@/config"

describe("resolveApiBaseUrl", () => {
  it("uses empty base in DEV when env is unset (Vite /api proxy)", () => {
    expect(resolveApiBaseUrl({ viteApiBaseUrl: undefined, isDev: true })).toBe("")
    expect(resolveApiBaseUrl({ viteApiBaseUrl: "  ", isDev: true })).toBe("")
  })

  it("strips trailing slash when env is set", () => {
    expect(
      resolveApiBaseUrl({
        viteApiBaseUrl: "https://api.example.com/",
        isDev: false,
      }),
    ).toBe("https://api.example.com")
    expect(
      resolveApiBaseUrl({
        viteApiBaseUrl: "https://api.example.com/",
        isDev: true,
      }),
    ).toBe("https://api.example.com")
  })

  it("fails closed in production when env is missing or blank", () => {
    expect(() =>
      resolveApiBaseUrl({ viteApiBaseUrl: undefined, isDev: false }),
    ).toThrow(/VITE_API_BASE_URL must be set/)
    expect(() =>
      resolveApiBaseUrl({ viteApiBaseUrl: "", isDev: false }),
    ).toThrow(/VITE_API_BASE_URL must be set/)
    expect(() =>
      resolveApiBaseUrl({ viteApiBaseUrl: "   ", isDev: false }),
    ).toThrow(/VITE_API_BASE_URL must be set/)
  })
})
