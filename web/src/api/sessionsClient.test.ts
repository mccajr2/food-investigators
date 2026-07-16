import { describe, expect, it, vi } from "vitest"

import { SessionsClient } from "@/api/sessionsClient"
import type { TokenStore } from "@/api/tokenStore"
import type { SessionResponse } from "@/api/types"

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

const sampleSession: SessionResponse = {
  id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  scheduledOn: "2026-07-20",
  status: "planned",
  foods: [
    {
      foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
      name: "Apples",
      iconKey: "apple",
      familiarity: "likes",
      variantNote: "Honeycrisp",
      position: 1,
    },
    {
      foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
      name: "Strawberries",
      iconKey: "strawberry",
      familiarity: "truly_new",
      variantNote: null,
      position: 2,
    },
  ],
  createdAt: "2026-07-15T00:00:00Z",
  updatedAt: "2026-07-15T00:00:00Z",
}

describe("SessionsClient", () => {
  it("lists upcoming sessions with bearer auth", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([sampleSession]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const client = new SessionsClient(
      "http://localhost:8080",
      fetchFn,
      memoryStore(),
    )
    const sessions = await client.listUpcoming()

    expect(sessions).toHaveLength(1)
    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/api/sessions",
    )
    const init = fetchFn.mock.calls[0]?.[1] as RequestInit
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok")
  })

  it("creates a planned session", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(sampleSession), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const client = new SessionsClient(
      "http://localhost:8080",
      fetchFn,
      memoryStore(),
    )
    const request = {
      scheduledOn: "2026-07-20",
      foods: [
        {
          foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
          familiarity: "likes" as const,
          variantNote: "Honeycrisp",
        },
        {
          foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
          familiarity: "truly_new" as const,
          variantNote: null,
        },
      ] as [
        {
          foodId: string
          familiarity: "likes"
          variantNote: string
        },
        {
          foodId: string
          familiarity: "truly_new"
          variantNote: null
        },
      ],
    }

    const created = await client.create(request)

    expect(created.id).toBe(sampleSession.id)
    const init = fetchFn.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe("POST")
    expect(init.body).toBe(JSON.stringify(request))
  })

  it("updates, gets, and cancels by id", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(sampleSession), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ...sampleSession, scheduledOn: "2026-07-22" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ...sampleSession, status: "cancelled" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )

    const client = new SessionsClient(
      "http://localhost:8080",
      fetchFn,
      memoryStore(),
    )
    await client.get(sampleSession.id)
    await client.update(sampleSession.id, {
      scheduledOn: "2026-07-22",
      foods: [
        {
          foodId: sampleSession.foods[0].foodId,
          familiarity: "likes",
          variantNote: null,
        },
        {
          foodId: sampleSession.foods[1].foodId,
          familiarity: "likes",
          variantNote: null,
        },
      ],
    })
    await client.cancel(sampleSession.id)

    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      `http://localhost:8080/api/sessions/${sampleSession.id}`,
    )
    expect((fetchFn.mock.calls[1]?.[1] as RequestInit).method).toBe("PUT")
    expect(String(fetchFn.mock.calls[2]?.[0])).toBe(
      `http://localhost:8080/api/sessions/${sampleSession.id}/cancel`,
    )
  })

  it("surfaces API errors and requires a token", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Exactly two foods are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const client = new SessionsClient(
      "http://localhost:8080",
      fetchFn,
      memoryStore(),
    )

    await expect(
      client.create({
        scheduledOn: "2026-07-20",
        foods: [
          {
            foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
            familiarity: "likes",
          },
          {
            foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
            familiarity: "likes",
          },
        ],
      }),
    ).rejects.toThrow("Exactly two foods are required")

    const unsigned = new SessionsClient(
      "http://localhost:8080",
      vi.fn(),
      memoryStore(null),
    )
    await expect(unsigned.listUpcoming()).rejects.toThrow("Not signed in")
  })
})
