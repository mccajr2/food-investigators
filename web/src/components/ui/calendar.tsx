import { DayPicker } from "react-day-picker"
import type { Matcher } from "react-day-picker"

import { cn } from "@/lib/utils"

import "react-day-picker/style.css"

export type CalendarProps = {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: Matcher | Matcher[]
  defaultMonth?: Date
  /** When true, selection cannot be cleared by clicking the selected day. */
  required?: boolean
  className?: string
  "aria-label"?: string
}

/** Thin DayPicker wrapper styled to match Plan forms. */
export function Calendar({
  selected,
  onSelect,
  disabled,
  defaultMonth,
  required = false,
  className,
  "aria-label": ariaLabel,
}: CalendarProps) {
  return (
    <DayPicker
      mode="single"
      required={required}
      selected={selected}
      onSelect={onSelect}
      disabled={disabled}
      defaultMonth={defaultMonth ?? selected}
      className={cn("plan-calendar text-sm", className)}
      aria-label={ariaLabel}
    />
  )
}
