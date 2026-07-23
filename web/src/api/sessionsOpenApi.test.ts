import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

describe("sessions OpenAPI contract (session-plan-guards)", () => {
  const openapi = readFileSync(
    resolve(__dirname, "../../../contracts/openapi.yaml"),
    "utf8",
  )

  it("documents past-date, day-occupied, and same-food variant rules", () => {
    expect(openapi).toContain("Scheduled date can't be in the past")
    expect(openapi).toContain("A session already exists on that date")
    expect(openapi).toContain(
      "Same food needs two different brand/variety notes",
    )
    expect(openapi).toContain(
      "Session is not editable (cancelled or completed)",
    )
  })
})
