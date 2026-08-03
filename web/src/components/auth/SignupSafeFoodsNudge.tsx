import type { BootstrapSafeItemRequest } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  BOOTSTRAP_SAFES_MAX,
  SIGNUP_TASTING_SLOT_COUNT,
  SYSTEM_STARTER_NAMES,
} from "@/lib/systemStarterNames"

export type SignupSafeFoodRow = {
  key: string
  name: string
  variantKey: string
  kind: "tasting" | "snack"
}

type SignupSafeFoodsNudgeProps = {
  rows: SignupSafeFoodRow[]
  onChange: (rows: SignupSafeFoodRow[]) => void
  childDisplayName: string
  disabled?: boolean
}

export function emptyTastingSlots(
  count: number = SIGNUP_TASTING_SLOT_COUNT,
): SignupSafeFoodRow[] {
  return Array.from({ length: count }, (_, index) => ({
    key: `tasting-${index}`,
    name: "",
    variantKey: "",
    kind: "tasting" as const,
  }))
}

export function collectBootstrapItems(
  rows: SignupSafeFoodRow[],
): BootstrapSafeItemRequest[] {
  return rows
    .map((row) => ({
      name: row.name.trim(),
      variantKey: row.variantKey.trim() || undefined,
      sessionEligible: row.kind === "tasting",
    }))
    .filter((item) => item.name.length > 0)
}

export function SignupSafeFoodsNudge({
  rows,
  onChange,
  childDisplayName,
  disabled = false,
}: SignupSafeFoodsNudgeProps) {
  const tastingRows = rows.filter((row) => row.kind === "tasting")
  const snackRows = rows.filter((row) => row.kind === "snack")
  const filledCount = collectBootstrapItems(rows).length
  const canAddMore = rows.length < BOOTSTRAP_SAFES_MAX
  const childLabel = childDisplayName.trim() || "they"
  const possessive =
    childDisplayName.trim().length > 0
      ? `${childDisplayName.trim()} already eats`
      : "they already eat"

  function updateRow(key: string, patch: Partial<SignupSafeFoodRow>) {
    onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function removeRow(key: string) {
    const next = rows.filter((row) => row.key !== key)
    // Keep at least the default tasting prompt slots when possible.
    if (next.filter((row) => row.kind === "tasting").length === 0) {
      onChange([...emptyTastingSlots(1), ...next])
      return
    }
    onChange(next)
  }

  function addTastingSlot() {
    if (!canAddMore) {
      return
    }
    onChange([
      ...rows,
      {
        key: `tasting-${crypto.randomUUID()}`,
        name: "",
        variantKey: "",
        kind: "tasting",
      },
    ])
  }

  function addSnackSlot() {
    if (!canAddMore) {
      return
    }
    onChange([
      ...rows,
      {
        key: `snack-${crypto.randomUUID()}`,
        name: "",
        variantKey: "",
        kind: "snack",
      },
    ])
  }

  return (
    <fieldset
      className="flex flex-col gap-3 rounded-md border border-border/60 p-3"
      disabled={disabled}
    >
      <legend className="px-1 text-sm font-medium">Safe foods</legend>
      <p className="text-sm text-muted-foreground">
        Safe foods {possessive} help plan tasting sessions — what to pair, pace,
        and suggest next. About five tasting foods is a great start; snacks are
        optional.
      </p>
      <p className="sr-only">
        Suggestions for {childLabel}. Type a food name; system starters appear
        as suggestions.
      </p>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Tasting foods
        </p>
        {tastingRows.map((row, index) => (
          <SafeFoodRowFields
            key={row.key}
            row={row}
            index={index}
            kindLabel="Tasting food"
            onChange={(patch) => updateRow(row.key, patch)}
            onRemove={
              tastingRows.length > 1 ? () => removeRow(row.key) : undefined
            }
            disabled={disabled}
          />
        ))}
        {canAddMore ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={addTastingSlot}
            disabled={disabled}
          >
            Add another tasting food
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Optional snacks
        </p>
        {snackRows.map((row, index) => (
          <SafeFoodRowFields
            key={row.key}
            row={row}
            index={index}
            kindLabel="Snack"
            onChange={(patch) => updateRow(row.key, patch)}
            onRemove={() => removeRow(row.key)}
            disabled={disabled}
          />
        ))}
        {canAddMore ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={addSnackSlot}
            disabled={disabled}
          >
            Add a snack
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {filledCount === 0
          ? "You can skip this and add foods later."
          : `${filledCount} of ${BOOTSTRAP_SAFES_MAX} ready to save.`}
      </p>
    </fieldset>
  )
}

type SafeFoodRowFieldsProps = {
  row: SignupSafeFoodRow
  index: number
  kindLabel: string
  onChange: (patch: Partial<SignupSafeFoodRow>) => void
  onRemove?: () => void
  disabled: boolean
}

function SafeFoodRowFields({
  row,
  index,
  kindLabel,
  onChange,
  onRemove,
  disabled,
}: SafeFoodRowFieldsProps) {
  const listId = `signup-starter-names-${row.key}`
  const nameLabel = `${kindLabel} ${index + 1} name`
  const variantLabel = `${kindLabel} ${index + 1} brand or prep`

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
      <Input
        aria-label={nameLabel}
        value={row.name}
        onChange={(event) => onChange({ name: event.target.value })}
        placeholder="Food name"
        maxLength={200}
        list={listId}
        disabled={disabled}
        className="sm:flex-1"
      />
      <datalist id={listId}>
        {SYSTEM_STARTER_NAMES.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <Input
        aria-label={variantLabel}
        value={row.variantKey}
        onChange={(event) => onChange({ variantKey: event.target.value })}
        placeholder="Brand / prep (optional)"
        maxLength={200}
        disabled={disabled}
        className="sm:flex-1"
      />
      {onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Remove ${kindLabel.toLowerCase()} ${index + 1}`}
          onClick={onRemove}
          disabled={disabled}
        >
          Remove
        </Button>
      ) : null}
    </div>
  )
}
