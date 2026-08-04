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
  exposures: [],
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

  it("upserts and clears exposures", async () => {
    const exposure = {
      foodId: sampleFood.id,
      variantKey: "bagelsaurus",
      familiarity: "safe" as const,
      source: "manual" as const,
      attemptCount: null,
      lastTriedOn: null,
      lastLiked: null,
    }
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(exposure), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    const client = new FoodsClient("http://localhost:8080", fetchFn, memoryStore())
    const upserted = await client.upsertExposure(sampleFood.id, {
      variantKey: "Bagelsaurus",
      familiarity: "safe",
    })
    await client.clearExposure(sampleFood.id, "Bagelsaurus")

    expect(upserted.variantKey).toBe("bagelsaurus")
    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      `http://localhost:8080/api/foods/${sampleFood.id}/exposures`,
    )
    expect((fetchFn.mock.calls[0]?.[1] as RequestInit).method).toBe("PUT")
    expect(String(fetchFn.mock.calls[1]?.[0])).toBe(
      `http://localhost:8080/api/foods/${sampleFood.id}/exposures?variantKey=Bagelsaurus`,
    )
    expect((fetchFn.mock.calls[1]?.[1] as RequestInit).method).toBe("DELETE")
  })

  it("bootstraps safes via POST /api/foods/bootstrap-safes", async () => {
    const exposures = [
      {
        foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
        variantKey: "honeycrisp",
        familiarity: "safe",
        source: "signup",
      },
    ]
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(exposures), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const client = new FoodsClient("http://localhost:8080", fetchFn, memoryStore())

    const result = await client.bootstrapSafes({
      items: [
        { name: "Apples", variantKey: "Honeycrisp", sessionEligible: true },
        { name: "Goldfish", sessionEligible: false },
      ],
    })

    expect(result).toEqual(exposures)
    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/api/foods/bootstrap-safes",
    )
    expect((fetchFn.mock.calls[0]?.[1] as RequestInit).method).toBe("POST")
    expect((fetchFn.mock.calls[0]?.[1] as RequestInit).body).toBe(
      JSON.stringify({
        items: [
          { name: "Apples", variantKey: "Honeycrisp", sessionEligible: true },
          { name: "Goldfish", sessionEligible: false },
        ],
      }),
    )
  })

  it("surfaces bootstrap validation errors", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "At most 10 safe foods can be bootstrapped",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    )
    const client = new FoodsClient("http://localhost:8080", fetchFn, memoryStore())

    await expect(
      client.bootstrapSafes({
        items: Array.from({ length: 11 }, (_, i) => ({ name: `Food ${i}` })),
      }),
    ).rejects.toThrow("At most 10 safe foods can be bootstrapped")
  })

  it("lists adds and removes stretch targets", async () => {
    const target = {
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      foodId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa24",
      foodName: "Broccoli",
      variantKey: "steamed",
      createdAt: "2026-08-03T18:00:00Z",
    }
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([target]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(target), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    const client = new FoodsClient("http://localhost:8080", fetchFn, memoryStore())
    const listed = await client.listStretchTargets()
    const created = await client.addStretchTarget({
      foodId: target.foodId,
      variantKey: "Steamed",
    })
    await client.removeStretchTarget(target.foodId, "Steamed")

    expect(listed).toEqual([target])
    expect(created.foodName).toBe("Broccoli")
    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/api/foods/stretch-targets",
    )
    expect(String(fetchFn.mock.calls[1]?.[0])).toBe(
      "http://localhost:8080/api/foods/stretch-targets",
    )
    expect((fetchFn.mock.calls[1]?.[1] as RequestInit).method).toBe("POST")
    expect(String(fetchFn.mock.calls[2]?.[0])).toBe(
      `http://localhost:8080/api/foods/stretch-targets/${target.foodId}?variantKey=Steamed`,
    )
    expect((fetchFn.mock.calls[2]?.[1] as RequestInit).method).toBe("DELETE")
  })

  it("surfaces stretch target cap errors", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ message: "At most 5 stretch targets can be active" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    )
    const client = new FoodsClient("http://localhost:8080", fetchFn, memoryStore())

    await expect(
      client.addStretchTarget({ name: "One too many" }),
    ).rejects.toThrow("At most 5 stretch targets can be active")
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

  it("parses optional iconUrl when present or absent", async () => {
    const withUrl = {
      ...sampleFood,
      iconUrl: "https://cdn.example.com/foods/custom_cucumber.png",
    }
    const withoutUrl = { ...sampleFood, id: "dddddddd-dddd-dddd-dddd-dddddddddddd" }
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([withUrl, withoutUrl]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const client = new FoodsClient("http://localhost:8080", fetchFn, memoryStore())
    const foods = await client.list()

    expect(foods[0]?.iconUrl).toBe(
      "https://cdn.example.com/foods/custom_cucumber.png",
    )
    expect(foods[1]?.iconUrl).toBeUndefined()
  })
})
