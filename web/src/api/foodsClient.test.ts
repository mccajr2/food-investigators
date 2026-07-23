import { describe, expect, it, vi } from "vitest"

import { FoodsClient } from "@/api/foodsClient"
import type { TokenStore } from "@/api/tokenStore"

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

const sampleFood = {
  id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  name: "Extra apple mash",
  iconKey: "apple",
  householdId: "22222222-2222-2222-2222-222222222222",
  system: false,
  sessionEligible: true,
  liked: null,
  texture: null,
  tasteNote: null,
  archivedAt: null,
}

describe("FoodsClient", () => {
  it("lists foods with bearer auth", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([sampleFood]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const client = new FoodsClient("http://localhost:8080", fetchFn, memoryStore())
    const foods = await client.list()

    expect(foods).toHaveLength(1)
    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/api/foods",
    )
    const init = fetchFn.mock.calls[0]?.[1] as RequestInit
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok")
  })

  it("lists with includeArchived query", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const client = new FoodsClient("http://localhost:8080", fetchFn, memoryStore())
    await client.list(true)

    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/api/foods?includeArchived=true",
    )
  })

  it("creates a household food", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(sampleFood), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const client = new FoodsClient("http://localhost:8080", fetchFn, memoryStore())
    const created = await client.create({ name: "Extra apple mash", iconKey: "apple" })

    expect(created.name).toBe("Extra apple mash")
    const init = fetchFn.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe("POST")
    expect(init.body).toBe(
      JSON.stringify({ name: "Extra apple mash", iconKey: "apple" }),
    )
  })

  it("creates a snack with preferences", async () => {
    const snack = {
      ...sampleFood,
      name: "Salt chips",
      sessionEligible: false,
      liked: "like" as const,
      texture: "crunchy" as const,
      tasteNote: "salt & vinegar",
    }
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(snack), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const client = new FoodsClient("http://localhost:8080", fetchFn, memoryStore())
    const request = {
      name: "Salt chips",
      iconKey: "custom_chips",
      sessionEligible: false,
      liked: "like" as const,
      texture: "crunchy" as const,
      tasteNote: "salt & vinegar",
    }

    const created = await client.create(request)

    expect(created.sessionEligible).toBe(false)
    expect(created.tasteNote).toBe("salt & vinegar")
    expect((fetchFn.mock.calls[0]?.[1] as RequestInit).body).toBe(
      JSON.stringify(request),
    )
  })

  it("updates and archives by id", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...sampleFood, name: "Updated" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ...sampleFood, archivedAt: "2026-07-14T00:00:00Z" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )

    const client = new FoodsClient("http://localhost:8080", fetchFn, memoryStore())
    await client.update(sampleFood.id, { name: "Updated", iconKey: "sweet_potato" })
    await client.archive(sampleFood.id)

    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      `http://localhost:8080/api/foods/${sampleFood.id}`,
    )
    expect((fetchFn.mock.calls[0]?.[1] as RequestInit).method).toBe("PUT")
    expect(String(fetchFn.mock.calls[1]?.[0])).toBe(
      `http://localhost:8080/api/foods/${sampleFood.id}/archive`,
    )
  })

  it("surfaces invalid icon errors", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid icon key" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const client = new FoodsClient("http://localhost:8080", fetchFn, memoryStore())

    await expect(
      client.create({ name: "Bad", iconKey: "nope" }),
    ).rejects.toThrow("Invalid icon key")
  })

  it("surfaces duplicate name conflicts", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ message: "A food with that name already exists" }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        },
      ),
    )
    const client = new FoodsClient("http://localhost:8080", fetchFn, memoryStore())

    await expect(
      client.create({ name: "Watermelon", iconKey: "custom_watermelon" }),
    ).rejects.toThrow("A food with that name already exists")
  })

  it("requires a signed-in token", async () => {
    const client = new FoodsClient(
      "http://localhost:8080",
      vi.fn(),
      memoryStore(null),
    )
    await expect(client.list()).rejects.toThrow("Not signed in")
  })
})
