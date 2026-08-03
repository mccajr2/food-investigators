import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

describe("Command + Popover combobox primitives", () => {
  it("opens a popover and filters command items by typed query", async () => {
    const user = userEvent.setup()
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline">
            Choose food
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Search foods…" aria-label="Search foods" />
            <CommandList>
              <CommandEmpty>No foods match</CommandEmpty>
              <CommandGroup>
                <CommandItem value="Apples">Apples</CommandItem>
                <CommandItem value="Bagel">Bagel</CommandItem>
                <CommandItem value="Strawberries">Strawberries</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>,
    )

    expect(screen.queryByText("Apples")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Choose food" }))
    expect(screen.getByText("Apples")).toBeInTheDocument()
    expect(screen.getByText("Bagel")).toBeInTheDocument()
    expect(screen.getByText("Strawberries")).toBeInTheDocument()

    await user.type(screen.getByLabelText("Search foods"), "bag")
    expect(screen.getByText("Bagel")).toBeInTheDocument()
    expect(screen.queryByText("Apples")).not.toBeInTheDocument()
    expect(screen.queryByText("Strawberries")).not.toBeInTheDocument()
  })

  it("shows empty state when nothing matches", async () => {
    const user = userEvent.setup()
    render(
      <Command>
        <CommandInput placeholder="Search foods…" aria-label="Search foods" />
        <CommandList>
          <CommandEmpty>No foods match</CommandEmpty>
          <CommandGroup>
            <CommandItem value="Apples">Apples</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    )

    await user.type(screen.getByLabelText("Search foods"), "zzz")
    expect(screen.getByText("No foods match")).toBeInTheDocument()
  })
})
