import { useMemo } from "react"
import type { Matcher } from "react-day-picker"

import { Calendar } from "@/components/ui/calendar"

export type PlanDatePickerProps = {
  /** ISO date YYYY-MM-DD, or empty when none selected. */
  value: string
  onChange: (isoDate: string) => void
  /** Inclusive earliest selectable day (ISO). */
  minDate: string
  /** ISO dates that already have a planned night. */
  occupiedDates?: string[]
  /** When editing, this night’s own date stays selectable. */
  allowDate?: string
  disabled?: boolean
  "aria-label": string
}

/** Parse YYYY-MM-DD as a local calendar date (no UTC shift). */
export function parseIsoLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year!, month! - 1, day!)
}

/** Format a local Date as YYYY-MM-DD. */
export function toIsoLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatPlanDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  if (!year || !month || !day) {
    return isoDate
  }
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

/**
 * Month calendar for Plan / Suggest: greys past and occupied nights.
 */
export function PlanDatePicker({
  value,
  onChange,
  minDate,
  occupiedDates = [],
  allowDate,
  disabled = false,
  "aria-label": ariaLabel,
}: PlanDatePickerProps) {
  const selected = value ? parseIsoLocalDate(value) : undefined
  const min = parseIsoLocalDate(minDate)
  const occupiedSet = useMemo(() => new Set(occupiedDates), [occupiedDates])

  const disabledMatchers: Matcher[] = useMemo(
    () => [
      { before: min },
      (date: Date) => {
        const iso = toIsoLocalDate(date)
        if (allowDate && iso === allowDate) {
          return false
        }
        return occupiedSet.has(iso)
      },
      () => disabled,
    ],
    [allowDate, disabled, min, occupiedSet],
  )

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground" data-testid={`${ariaLabel} summary`}>
        {value ? formatPlanDateLabel(value) : "Pick a night on the calendar"}
      </p>
      <Calendar
        aria-label={ariaLabel}
        selected={selected}
        defaultMonth={selected ?? min}
        required
        disabled={disabledMatchers}
        onSelect={(date) => {
          if (!date) {
            return
          }
          onChange(toIsoLocalDate(date))
        }}
      />
    </div>
  )
}
