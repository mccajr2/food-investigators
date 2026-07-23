import { useEffect, useRef, useState, type FormEvent } from "react"

import { FoodsClient, SessionsClient } from "@/api"
import type {
  Familiarity,
  FoodResponse,
  SessionFoodRequest,
  SessionResponse,
} from "@/api/types"
import { RunSessionPage } from "@/components/run/RunSessionPage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const FAMILIARITY_OPTIONS: { value: Familiarity; label: string }[] = [
  { value: "likes", label: "Likes" },
  { value: "familiar_but_new", label: "Familiar but new" },
  { value: "truly_new", label: "Truly new" },
]

type FoodSlot = {
  foodId: string
  familiarity: Familiarity
  variantNote: string
}

type Status =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "saving" }
  | { kind: "error"; message: string }

type Editor =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; session: SessionResponse }

type PlanPageProps = {
  sessionsClient?: SessionsClient
  foodsClient?: FoodsClient
  onUnauthorized?: () => void
  /** ISO date (YYYY-MM-DD) for the date picker's min — defaults to local today. */
  todayIso?: string
}

const emptySlot = (): FoodSlot => ({
  foodId: "",
  familiarity: "likes",
  variantNote: "",
})

/** Local calendar today as YYYY-MM-DD for `<input type="date" min>`. */
export function localTodayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Client-side same-food / variant rule (mirrors backend). */
export function sameFoodVariantError(
  first: FoodSlot,
  second: FoodSlot,
): string | null {
  if (!first.foodId || !second.foodId || first.foodId !== second.foodId) {
    return null
  }
  const a = first.variantNote.trim()
  const b = second.variantNote.trim()
  if (!a || !b || a.toLowerCase() === b.toLowerCase()) {
    return "Same food needs two different brand/variety notes"
  }
  return null
}

export function PlanPage({
  sessionsClient: sessionsClientProp,
  foodsClient: foodsClientProp,
  onUnauthorized,
  todayIso,
}: PlanPageProps) {
  const [sessionsClient] = useState(
    () => sessionsClientProp ?? new SessionsClient(),
  )
  const [foodsClient] = useState(() => foodsClientProp ?? new FoodsClient())
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [foods, setFoods] = useState<FoodResponse[]>([])
  const [status, setStatus] = useState<Status>({ kind: "loading" })
  const [editor, setEditor] = useState<Editor>({ mode: "closed" })
  const [scheduledOn, setScheduledOn] = useState("")
  const [slot1, setSlot1] = useState<FoodSlot>(emptySlot)
  const [slot2, setSlot2] = useState<FoodSlot>(emptySlot)
  const [runningSession, setRunningSession] = useState<SessionResponse | null>(
    null,
  )
  const onUnauthorizedRef = useRef(onUnauthorized)
  onUnauthorizedRef.current = onUnauthorized
  const minDate = todayIso ?? localTodayIsoDate()
  const sameFoodSelected =
    Boolean(slot1.foodId) && slot1.foodId === slot2.foodId

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus({ kind: "loading" })
      try {
        const [listedSessions, listedFoods] = await Promise.all([
          sessionsClient.listUpcoming(),
          foodsClient.list(),
        ])
        if (!cancelled) {
          setSessions(listedSessions)
          setFoods(listedFoods)
          setStatus({ kind: "ready" })
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Could not load plan"
          if (isUnauthorizedMessage(message)) {
            onUnauthorizedRef.current?.()
          }
          setStatus({ kind: "error", message })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [sessionsClient, foodsClient])

  function openCreate() {
    setScheduledOn("")
    setSlot1(emptySlot())
    setSlot2(emptySlot())
    setEditor({ mode: "create" })
  }

  function openEdit(session: SessionResponse) {
    const first = session.foods.find((food) => food.position === 1) ?? session.foods[0]
    const second = session.foods.find((food) => food.position === 2) ?? session.foods[1]
    setScheduledOn(session.scheduledOn)
    setSlot1({
      foodId: first?.foodId ?? "",
      familiarity: first?.familiarity ?? "likes",
      variantNote: first?.variantNote ?? "",
    })
    setSlot2({
      foodId: second?.foodId ?? "",
      familiarity: second?.familiarity ?? "likes",
      variantNote: second?.variantNote ?? "",
    })
    setEditor({ mode: "edit", session })
  }

  function closeEditor() {
    setEditor({ mode: "closed" })
  }

  function toFoodRequest(slot: FoodSlot): SessionFoodRequest {
    const note = slot.variantNote.trim()
    return {
      foodId: slot.foodId,
      familiarity: slot.familiarity,
      variantNote: note.length > 0 ? note : null,
    }
  }

  function plannedNightOccupiesDate(date: string): boolean {
    return sessions.some((session) => {
      if (session.scheduledOn !== date) {
        return false
      }
      if (editor.mode === "edit" && editor.session.id === session.id) {
        return false
      }
      return true
    })
  }

  async function onSave(event: FormEvent) {
    event.preventDefault()
    if (!scheduledOn || !slot1.foodId || !slot2.foodId) {
      setStatus({
        kind: "error",
        message: "Pick a date and two foods before saving.",
      })
      return
    }
    if (scheduledOn < minDate) {
      setStatus({
        kind: "error",
        message: "Scheduled date can't be in the past",
      })
      return
    }
    const variantError = sameFoodVariantError(slot1, slot2)
    if (variantError) {
      setStatus({ kind: "error", message: variantError })
      return
    }
    if (plannedNightOccupiesDate(scheduledOn)) {
      setStatus({
        kind: "error",
        message: "A session already exists on that date",
      })
      return
    }
    const foodsPair: [SessionFoodRequest, SessionFoodRequest] = [
      toFoodRequest(slot1),
      toFoodRequest(slot2),
    ]
    setStatus({ kind: "saving" })
    try {
      if (editor.mode === "create") {
        const created = await sessionsClient.create({
          scheduledOn,
          foods: foodsPair,
        })
        setSessions((current) =>
          [...current, created].sort((a, b) =>
            a.scheduledOn.localeCompare(b.scheduledOn),
          ),
        )
      } else if (editor.mode === "edit") {
        const updated = await sessionsClient.update(editor.session.id, {
          scheduledOn,
          foods: foodsPair,
        })
        setSessions((current) =>
          current
            .map((session) => (session.id === updated.id ? updated : session))
            .sort((a, b) => a.scheduledOn.localeCompare(b.scheduledOn)),
        )
      }
      setEditor({ mode: "closed" })
      setStatus({ kind: "ready" })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed"
      if (isUnauthorizedMessage(message)) {
        onUnauthorizedRef.current?.()
        return
      }
      setStatus({ kind: "error", message })
    }
  }

  async function onCancel(session: SessionResponse) {
    setStatus({ kind: "saving" })
    try {
      await sessionsClient.cancel(session.id)
      setSessions((current) => current.filter((item) => item.id !== session.id))
      if (editor.mode === "edit" && editor.session.id === session.id) {
        setEditor({ mode: "closed" })
      }
      setStatus({ kind: "ready" })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cancel failed"
      if (isUnauthorizedMessage(message)) {
        onUnauthorizedRef.current?.()
        return
      }
      setStatus({ kind: "error", message })
    }
  }

  const busy = status.kind === "loading" || status.kind === "saving"

  function onRunComplete(completed: SessionResponse) {
    setRunningSession(null)
    setSessions((current) => current.filter((item) => item.id !== completed.id))
  }

  return (
    <section aria-labelledby="plan-heading" className="flex flex-col gap-6">
      {runningSession ? (
        <RunSessionPage
          session={runningSession}
          sessionsClient={sessionsClient}
          onComplete={onRunComplete}
          onExit={() => setRunningSession(null)}
          onUnauthorized={onUnauthorized}
        />
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="plan-heading" className="text-xl font-semibold tracking-tight">
            Plan
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule tasting nights with two foods and how familiar each is.
          </p>
        </div>
        <Button type="button" onClick={openCreate} disabled={busy}>
          Plan a night
        </Button>
      </div>

      {status.kind === "loading" ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading plan…
        </p>
      ) : null}

      {status.kind === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {status.message}
        </p>
      ) : null}

      {editor.mode !== "closed" ? (
        <form
          className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4"
          onSubmit={(event) => void onSave(event)}
          aria-label={editor.mode === "create" ? "Plan a night" : "Edit night"}
        >
          <Input
            aria-label="Date"
            type="date"
            value={scheduledOn}
            min={minDate}
            onChange={(event) => setScheduledOn(event.target.value)}
            required
            disabled={status.kind === "saving"}
          />

          <FoodSlotFields
            label="Food 1"
            slot={slot1}
            foods={foods}
            disabled={status.kind === "saving"}
            variantRequired={sameFoodSelected}
            onChange={setSlot1}
          />
          <FoodSlotFields
            label="Food 2"
            slot={slot2}
            foods={foods}
            disabled={status.kind === "saving"}
            variantRequired={sameFoodSelected}
            onChange={setSlot2}
          />

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={status.kind === "saving"}>
              {status.kind === "saving"
                ? "Saving…"
                : editor.mode === "create"
                  ? "Save night"
                  : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeEditor}
              disabled={status.kind === "saving"}
            >
              Close
            </Button>
          </div>
        </form>
      ) : null}

      <section className="flex flex-col gap-3" aria-labelledby="upcoming-heading">
        <h3
          id="upcoming-heading"
          className="text-sm font-medium uppercase tracking-wide text-muted-foreground"
        >
          Upcoming
        </h3>
        {sessions.length === 0 && status.kind !== "loading" ? (
          <p className="text-sm text-muted-foreground">
            No planned nights yet. Plan one to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{formatDate(session.scheduledOn)}</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {session.foods.map((food) => (
                        <li key={`${session.id}-${food.position}`}>
                          {food.name}
                          {food.variantNote ? ` (${food.variantNote})` : ""} —{" "}
                          {familiarityLabel(food.familiarity)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setRunningSession(session)}
                      disabled={busy}
                    >
                      Run
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(session)}
                      disabled={busy}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void onCancel(session)}
                      disabled={busy}
                    >
                      Cancel night
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}

type FoodSlotFieldsProps = {
  label: string
  slot: FoodSlot
  foods: FoodResponse[]
  disabled: boolean
  variantRequired: boolean
  onChange: (slot: FoodSlot) => void
}

function FoodSlotFields({
  label,
  slot,
  foods,
  disabled,
  variantRequired,
  onChange,
}: FoodSlotFieldsProps) {
  return (
    <fieldset disabled={disabled} className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      <select
        aria-label={`${label} picker`}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        value={slot.foodId}
        onChange={(event) => onChange({ ...slot, foodId: event.target.value })}
        required
      >
        <option value="">Choose a food…</option>
        {foods.map((food) => (
          <option key={food.id} value={food.id}>
            {food.name}
          </option>
        ))}
      </select>
      <select
        aria-label={`${label} familiarity`}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        value={slot.familiarity}
        onChange={(event) =>
          onChange({
            ...slot,
            familiarity: event.target.value as Familiarity,
          })
        }
        required
      >
        {FAMILIARITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Input
        aria-label={`${label} variant note`}
        value={slot.variantNote}
        onChange={(event) =>
          onChange({ ...slot, variantNote: event.target.value })
        }
        placeholder={
          variantRequired
            ? "Brand or variety (required)"
            : "Optional brand, variety, or prep"
        }
        required={variantRequired}
        maxLength={200}
      />
    </fieldset>
  )
}

function familiarityLabel(value: Familiarity): string {
  return (
    FAMILIARITY_OPTIONS.find((option) => option.value === value)?.label ?? value
  )
}

function formatDate(isoDate: string): string {
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

function isUnauthorizedMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized === "unauthorized" ||
    normalized === "not signed in" ||
    normalized.includes("session expired")
  )
}
