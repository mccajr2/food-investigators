import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  decodeParentNote,
  encodeParentNote,
  ParentNotesStep,
} from "@/components/run/ParentNotesStep"

describe("encodeParentNote / decodeParentNote", () => {
  it("returns null when both fields blank", () => {
    expect(encodeParentNote("", "")).toBeNull()
    expect(encodeParentNote("  ", "\n")).toBeNull()
  })

  it("encodes notes only, change only, or both", () => {
    expect(encodeParentNote("Tired after school", "")).toBe(
      "Notes: Tired after school",
    )
    expect(encodeParentNote("", "less peel")).toBe(
      "Change next time: less peel",
    )
    expect(encodeParentNote("calm night", "smaller piece")).toBe(
      "Notes: calm night\n\nChange next time: smaller piece",
    )
  })

  it("decodes labeled sections and legacy unlabeled text", () => {
    expect(
      decodeParentNote("Notes: calm\n\nChange next time: warm it"),
    ).toEqual({
      notes: "calm",
      changeNextTime: "warm it",
    })
    expect(decodeParentNote("Change next time: only change")).toEqual({
      notes: "",
      changeNextTime: "only change",
    })
    expect(decodeParentNote("old freeform note")).toEqual({
      notes: "old freeform note",
      changeNextTime: "",
    })
    expect(decodeParentNote(null)).toEqual({ notes: "", changeNextTime: "" })
  })
})

describe("ParentNotesStep", () => {
  it("shows two text areas and calls save and skip handlers", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onSkip = vi.fn()
    const onNotesChange = vi.fn()
    const onChangeNextTimeChange = vi.fn()

    render(
      <ParentNotesStep
        notes=""
        changeNextTime=""
        onNotesChange={onNotesChange}
        onChangeNextTimeChange={onChangeNextTimeChange}
        onSave={onSave}
        onSkip={onSkip}
      />,
    )

    expect(screen.getByLabelText("Parent notes")).toBeInTheDocument()
    expect(screen.getByLabelText("Session notes")).toBeInTheDocument()
    expect(screen.getByLabelText("Change next time")).toBeInTheDocument()

    await user.type(screen.getByLabelText("Session notes"), "clinic")
    expect(onNotesChange).toHaveBeenCalled()
    await user.type(screen.getByLabelText("Change next time"), "warm")
    expect(onChangeNextTimeChange).toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(onSave).toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Skip" }))
    expect(onSkip).toHaveBeenCalled()
  })
})
