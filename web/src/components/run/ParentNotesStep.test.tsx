import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ParentNotesStep } from "@/components/run/ParentNotesStep"

describe("ParentNotesStep", () => {
  it("calls save and skip handlers", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onSkip = vi.fn()
    const onNoteChange = vi.fn()

    render(
      <ParentNotesStep
        note=""
        onNoteChange={onNoteChange}
        onSave={onSave}
        onSkip={onSkip}
      />,
    )

    expect(screen.getByLabelText("Parent notes")).toBeInTheDocument()
    await user.type(
      screen.getByRole("textbox", { name: "Optional parent note" }),
      "clinic",
    )
    expect(onNoteChange).toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(onSave).toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Skip" }))
    expect(onSkip).toHaveBeenCalled()
  })
})
