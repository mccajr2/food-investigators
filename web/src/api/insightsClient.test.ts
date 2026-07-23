import { describe, expect, it, vi } from "vitest"

import { InsightsClient } from "@/api/insightsClient"
import type { TokenStore } from "@/api/tokenStore"
import type { InsightsResponse } from "@/api/types"

function memoryStore(token: string | null = "tok"): TokenStore {
  let stored = token
  return {
    get: () => stored,
    set: (value) => {
      stored = value
    },
    clear: () => {
      stored = null
    },
  }
}

const sampleInsights: InsightsResponse = {
  completedSessionCount: 3,
  ready: true,
  ateEnoughYes: 4,
  ateEnoughNo: 2,
  likedLike: 5,
  likedSoSo: 1,
  likedNo: 0,
  likedSkipped: 0,
  topLikedTextures: ["crunchy", "soft"],
  familiarityLikes: 4,
  familiarityFamiliarButNew: 2,
  familiarityTrulyNew: 0,
  snackCount: 1,
  hasParentNotes: false,
  tips: [
    {
      id: "mix_familiarity",
      message: "You've stuck to known foods — when you're ready, try one gentle familiar-but-new.",
    },
    {
      id: "keep_going",
      message: "You're building a tasting rhythm — keep going at a calm pace.",
    },
  ],
}

describe("InsightsClient", () => {
  it("gets insights with bearer auth", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(sampleInsights), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const client = new InsightsClient(
      "http://localhost:8080",
      fetchFn,
      memoryStore(),
    )
    const insights = await client.get()

    expect(insights.ready).toBe(true)
    expect(insights.tips).toHaveLength(2)
    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/api/insights",
    )
    const init = fetchFn.mock.calls[0]?.[1] as RequestInit
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok")
  })

  it("dismisses a tip by id", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const client = new InsightsClient(
      "http://localhost:8080",
      fetchFn,
      memoryStore(),
    )
    await client.dismissTip("keep_going")

    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/api/insights/tips/keep_going/dismiss",
    )
    const init = fetchFn.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe("POST")
  })

  it("surfaces dismiss errors for unknown tip ids", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Unknown tip id: nope" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const client = new InsightsClient(
      "http://localhost:8080",
      fetchFn,
      memoryStore(),
    )

    await expect(client.dismissTip("nope")).rejects.toThrow(
      "Unknown tip id: nope",
    )
  })
})
