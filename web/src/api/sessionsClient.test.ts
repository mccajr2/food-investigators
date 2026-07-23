import { describe, expect, it, vi } from "vitest"

import { SessionsClient } from "@/api/sessionsClient"
import type { TokenStore } from "@/api/tokenStore"
import type {
  CompleteSessionRequest,
  CreateSessionRequest,
  SessionResponse,
} from "@/api/types"

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

  it("lists completed session history", async () => {
    const completed = { ...sampleSession, status: "completed" as const }
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([completed]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const client = new SessionsClient(
      "http://localhost:8080",
      fetchFn,
      memoryStore(),
    )

    const history = await client.listHistory()

    expect(history).toHaveLength(1)
    expect(history[0].status).toBe("completed")
    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/api/sessions/history",
    )
  })

  it("downloads history PDF with optional from/to query params", async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46])
    const fetchFn = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(pdfBytes, {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        }),
      ),
    )
    const client = new SessionsClient(
      "http://localhost:8080",
      fetchFn,
      memoryStore(),
    )

    const full = await client.downloadHistoryPdf()
    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/api/sessions/history.pdf",
    )
    expect(new Uint8Array(await full.arrayBuffer())).toEqual(pdfBytes)

    await client.downloadHistoryPdf({ from: "2026-07-01", to: "2026-07-31" })
    expect(String(fetchFn.mock.calls[1]?.[0])).toBe(
      "http://localhost:8080/api/sessions/history.pdf?from=2026-07-01&to=2026-07-31",
    )

    await client.downloadHistoryPdf({ from: "2026-07-15" })
    expect(String(fetchFn.mock.calls[2]?.[0])).toBe(
      "http://localhost:8080/api/sessions/history.pdf?from=2026-07-15",
    )
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

  it("completes a session with outcomes", async () => {
    const completed = {
      ...sampleSession,
      status: "completed" as const,
      foods: sampleSession.foods.map((food, index) => ({
        ...food,
        liked: index === 0 ? ("like" as const) : null,
        ateEnough: index === 0,
      })),
    }
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(completed), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const client = new SessionsClient(
      "http://localhost:8080",
      fetchFn,
      memoryStore(),
    )
    const request: CompleteSessionRequest = {
      foods: [
        {
          position: 1,
          liked: "like",
          texture: "crunchy",
          temperature: "cold",
          smell: "like",
          whyNote: "crunchy",
          changeNote: "less peel",
          ateEnough: true,
        },
        {
          position: 2,
          liked: "no",
          texture: null,
          temperature: "warm",
          smell: null,
          whyNote: null,
          changeNote: null,
          ateEnough: false,
        },
      ],
    }

    const result = await client.complete(sampleSession.id, request)

    expect(result.status).toBe("completed")
    const init = fetchFn.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe("POST")
    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      `http://localhost:8080/api/sessions/${sampleSession.id}/complete`,
    )
    expect(init.body).toBe(JSON.stringify(request))
  })

  it("patches parent note on a completed session", async () => {
    const withNote = {
      ...sampleSession,
      status: "completed" as const,
      parentNote: "Tired after school",
    }
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(withNote), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const client = new SessionsClient(
      "http://localhost:8080",
      fetchFn,
      memoryStore(),
    )
    const request = { parentNote: "Tired after school" }

    const result = await client.updateParentNote(sampleSession.id, request)

    expect(result.parentNote).toBe("Tired after school")
    const init = fetchFn.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe("PATCH")
    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      `http://localhost:8080/api/sessions/${sampleSession.id}/parent-note`,
    )
    expect(init.body).toBe(JSON.stringify(request))
  })

  it("surfaces API errors and requires a token", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "Exactly two foods are required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "A session already exists on that date" }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "Scheduled date can't be in the past" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
    const client = new SessionsClient(
      "http://localhost:8080",
      fetchFn,
      memoryStore(),
    )

    const request: CreateSessionRequest = {
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
    }

    await expect(client.create(request)).rejects.toThrow(
      "Exactly two foods are required",
    )
    await expect(client.create(request)).rejects.toThrow(
      "A session already exists on that date",
    )
    await expect(client.create(request)).rejects.toThrow(
      "Scheduled date can't be in the past",
    )

    const unsigned = new SessionsClient(
      "http://localhost:8080",
      vi.fn(),
      memoryStore(null),
    )
    await expect(unsigned.listUpcoming()).rejects.toThrow("Not signed in")
  })
})
