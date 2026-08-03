import { Check, ChevronsUpDown } from "lucide-react"
import { useState } from "react"

import type { FoodResponse } from "@/api/types"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"

export type PlanFoodComboboxProps = {
  /** Slot label used in aria-label, e.g. "Food 1". */
  label: string
  foods: FoodResponse[]
  value: string
  disabled?: boolean
  onChange: (foodId: string) => void
}

export function PlanFoodCombobox({
  label,
  foods,
  value,
  disabled = false,
  onChange,
}: PlanFoodComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = foods.find((food) => food.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={`${label} picker`}
          disabled={disabled}
          className="h-9 w-full justify-between px-3 font-normal shadow-xs"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected?.name ?? "Choose a food…"}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search foods…"
            aria-label={`${label} search`}
          />
          <CommandList>
            <CommandEmpty>No foods match</CommandEmpty>
            <CommandGroup>
              {foods.map((food) => (
                <CommandItem
                  key={food.id}
                  value={food.name}
                  onSelect={() => {
                    onChange(food.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      value === food.id ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                  {food.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
