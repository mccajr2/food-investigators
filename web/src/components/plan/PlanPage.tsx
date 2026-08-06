import { useEffect, useRef, useState, type FormEvent } from "react"

import { FoodsClient, SessionsClient } from "@/api"
import type {
  Familiarity,
  FoodResponse,
  PacingCitation,
  SessionFoodRequest,
  SessionResponse,
  SessionSuggestionResponse,
  SuggestedSessionFood,
  SuggestionSource,
} from "@/api/types"
import { PlanDatePicker } from "@/components/plan/PlanDatePicker"
import { PlanFoodCombobox } from "@/components/plan/PlanFoodCombobox"
import { RunSessionPage } from "@/components/run/RunSessionPage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { planEmptyHint, planSectionBlurb } from "@/lib/childDisplayName"
import {
  autofillFamiliarity,
  variantKeysForFood,
} from "@/lib/foodExposures"
import {
  isInventSlot,
  resolveSuggestSlot,
  slotIsReady,
  type SuggestFoodSlot,
} from "@/lib/suggestInvent"

const FAMILIARITY_OPTIONS: { value: Familiarity; label: string }[] = [
  { value: "safe", label: "Safe" },
  { value: "familiar_but_new", label: "Familiar but new" },
  { value: "truly_new", label: "Truly new" },
  { value: "retrying", label: "Retrying" },
]

type FoodSlot = SuggestFoodSlot

/** Editable Suggest fields used for untouched / one-tap Approve. */
export type SuggestDraftSnapshot = {
  scheduledOn: string
  slot1: FoodSlot
  slot2: FoodSlot
}

type SuggestDraft = SuggestDraftSnapshot & {
  rationale: string | null
  source: SuggestionSource
  pacingNote: string | null
  citations: PacingCitation[]
}

type Status =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "saving" }
  | { kind: "suggesting" }
  | { kind: "error"; message: string }

type Editor =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; session: SessionResponse }

type PlanPageProps = {
  sessionsClient?: SessionsClient
  foodsClient?: FoodsClient
  /** Optional household child display name for Plan copy. */
  childDisplayName?: string | null
  onUnauthorized?: () => void
  /** ISO date (YYYY-MM-DD) for the calendar min — defaults to local today. */
  todayIso?: string
  /**
   * When bumped above 0 (e.g. Insights “Plan a suggested night”), run Suggest
   * once after Plan finishes loading. Same key is not re-fired.
   */
  autoSuggestKey?: number
  /** Called after an autoSuggestKey request is consumed (AuthShell clears it). */
  onAutoSuggestConsumed?: () => void
}

const emptySlot = (): FoodSlot => ({
  foodId: "",
  familiarity: "truly_new",
  variantNote: "",
  inventName: null,
})

/** True when the slot is a stretch ladder rung (not a safe anchor). */
export function isStretchFamiliarity(familiarity: Familiarity): boolean {
  return familiarity !== "safe"
}

/**
 * Calm Plan coaching from the two draft familiarities — no second Suggest call.
 */
export function safeStretchCoachingCopy(
  first: Familiarity,
  second: Familiarity,
): string {
  const firstStretch = isStretchFamiliarity(first)
  const secondStretch = isStretchFamiliarity(second)
  if (firstStretch !== secondStretch) {
    return "Nice mix — one safe food and one stretch keeps the night calmer."
  }
  if (firstStretch && secondStretch) {
    return "Both foods are stretches. On hard nights, swap one to a safe food so bedtime stays shorter."
  }
  return "Two safe foods is a calm night. When you're ready, swap one to a gentle stretch."
}

/** Always-on Plan tip near Suggest — complements draft-time coaching. */
export const SAFE_STRETCH_PLAN_HINT =
  "Aim for one safe food and one stretch (familiar-but-new, truly new, or retrying). Two stretches make Run longer."

export function cloneSuggestDraftSnapshot(
  draft: SuggestDraftSnapshot,
): SuggestDraftSnapshot {
  return {
    scheduledOn: draft.scheduledOn,
    slot1: { ...draft.slot1 },
    slot2: { ...draft.slot2 },
  }
}

export function foodSlotsEqual(a: FoodSlot, b: FoodSlot): boolean {
  return (
    a.foodId === b.foodId &&
    a.familiarity === b.familiarity &&
    a.variantNote === b.variantNote &&
    (a.inventName ?? null) === (b.inventName ?? null)
  )
}

/** True when date + slots still match the Suggest snapshot (untouched). */
export function isSuggestDraftUntouched(
  draft: SuggestDraftSnapshot,
  snapshot: SuggestDraftSnapshot,
): boolean {
  return (
    draft.scheduledOn === snapshot.scheduledOn &&
    foodSlotsEqual(draft.slot1, snapshot.slot1) &&
    foodSlotsEqual(draft.slot2, snapshot.slot2)
  )
}

/** Local calendar today as YYYY-MM-DD for the Plan calendar min. */
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

/** True when Run would record a future planned night early (snap to today). */
export function isEarlyRunNeeded(
  scheduledOn: string,
  todayIso: string,
): boolean {
  return scheduledOn > todayIso
}

/** Planned + completed `scheduledOn` values for calendar / occupancy checks. */
export function mergeOccupiedDates(
  plannedSessions: readonly { scheduledOn: string }[],
  completedScheduledOns: readonly string[],
): string[] {
  return [
    ...new Set([
      ...plannedSessions.map((session) => session.scheduledOn),
      ...completedScheduledOns,
    ]),
  ]
}

/** True when today already has a planned or completed night (blocks early-run snap). */
export function isTodayOccupied(
  todayIso: string,
  occupiedDates: readonly string[],
): boolean {
  return occupiedDates.includes(todayIso)
}

function suggestedFoodToSlot(food: SuggestedSessionFood): FoodSlot {
  if (food.foodId == null) {
    const inventName = (food.proposedName ?? food.name).trim()
    return {
      foodId: "",
      familiarity: food.familiarity,
      variantNote: food.proposedVariantNote?.trim() ?? "",
      inventName: inventName.length > 0 ? inventName : null,
    }
  }
  return {
    foodId: food.foodId,
    familiarity: food.familiarity,
    variantNote:
      food.variantNote?.trim() || food.proposedVariantNote?.trim() || "",
    inventName: null,
  }
}

function suggestionToDraft(suggestion: SessionSuggestionResponse): SuggestDraft {
  const first = suggestion.foods[0]
  const second = suggestion.foods[1]
  if (!first || !second) {
    throw new Error("Suggestion did not include two foods")
  }
  return {
    scheduledOn: suggestion.scheduledOn,
    slot1: suggestedFoodToSlot(first),
    slot2: suggestedFoodToSlot(second),
    rationale: suggestion.rationale?.trim() ? suggestion.rationale.trim() : null,
    source: suggestion.source,
    pacingNote: suggestion.pacingNote?.trim()
      ? suggestion.pacingNote.trim()
      : null,
    citations: suggestion.citations ?? [],
  }
}

function sessionToUpdatePayload(
  session: SessionResponse,
  scheduledOn: string,
): {
  scheduledOn: string
  foods: [SessionFoodRequest, SessionFoodRequest]
} {
  const first =
    session.foods.find((food) => food.position === 1) ?? session.foods[0]
  const second =
    session.foods.find((food) => food.position === 2) ?? session.foods[1]
  if (!first || !second) {
    throw new Error("Session did not include two foods")
  }
  return {
    scheduledOn,
    foods: [
      {
        foodId: first.foodId,
        familiarity: first.familiarity,
        variantNote: first.variantNote,
      },
      {
        foodId: second.foodId,
        familiarity: second.familiarity,
        variantNote: second.variantNote,
      },
    ],
  }
}

export function PlanPage({
  sessionsClient: sessionsClientProp,
  foodsClient: foodsClientProp,
  childDisplayName = null,
  onUnauthorized,
  todayIso,
  autoSuggestKey = 0,
  onAutoSuggestConsumed,
}: PlanPageProps) {
  const [sessionsClient] = useState(
    () => sessionsClientProp ?? new SessionsClient(),
  )
  const [foodsClient] = useState(() => foodsClientProp ?? new FoodsClient())
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [completedDates, setCompletedDates] = useState<string[]>([])
  const [foods, setFoods] = useState<FoodResponse[]>([])
  const [status, setStatus] = useState<Status>({ kind: "loading" })
  const [editor, setEditor] = useState<Editor>({ mode: "closed" })
  const [suggestDraft, setSuggestDraft] = useState<SuggestDraft | null>(null)
  const [suggestSnapshot, setSuggestSnapshot] =
    useState<SuggestDraftSnapshot | null>(null)
  const [suggestPreferEdit, setSuggestPreferEdit] = useState(false)
  const [scheduledOn, setScheduledOn] = useState("")
  const [slot1, setSlot1] = useState<FoodSlot>(emptySlot)
  const [slot2, setSlot2] = useState<FoodSlot>(emptySlot)
  const [runningSession, setRunningSession] = useState<SessionResponse | null>(
    null,
  )
  const [earlyRunSession, setEarlyRunSession] =
    useState<SessionResponse | null>(null)
  const onUnauthorizedRef = useRef(onUnauthorized)
  onUnauthorizedRef.current = onUnauthorized
  const onAutoSuggestConsumedRef = useRef(onAutoSuggestConsumed)
  onAutoSuggestConsumedRef.current = onAutoSuggestConsumed
  const handledAutoSuggestKeyRef = useRef(0)
  const suggestNextRef = useRef<() => void>(() => {})
  const minDate = todayIso ?? localTodayIsoDate()
  const selectableFoods = foods.filter((food) => food.sessionEligible !== false)
  const sameFoodSelected =
    Boolean(slot1.foodId) && slot1.foodId === slot2.foodId
  const suggestSameFoodSelected =
    Boolean(suggestDraft?.slot1.foodId) &&
    suggestDraft?.slot1.foodId === suggestDraft?.slot2.foodId
  const suggestHasInvent =
    suggestDraft != null &&
    (isInventSlot(suggestDraft.slot1) || isInventSlot(suggestDraft.slot2))
  const suggestDraftUntouched =
    suggestDraft != null &&
    suggestSnapshot != null &&
    isSuggestDraftUntouched(suggestDraft, suggestSnapshot)
  const showCompactSuggest =
    suggestDraft != null && suggestDraftUntouched && !suggestPreferEdit


  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus({ kind: "loading" })
      try {
        const [listedSessions, listedHistory, listedFoods] = await Promise.all([
          sessionsClient.listUpcoming(),
          sessionsClient.listHistory(),
          foodsClient.list(),
        ])
        if (!cancelled) {
          setSessions(listedSessions)
          setCompletedDates([
            ...new Set(listedHistory.map((session) => session.scheduledOn)),
          ])
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
    setSuggestDraft(null)
    setScheduledOn("")
    setSlot1(emptySlot())
    setSlot2(emptySlot())
    setEditor({ mode: "create" })
  }

  function openEdit(session: SessionResponse) {
    setSuggestDraft(null)
    const first = session.foods.find((food) => food.position === 1) ?? session.foods[0]
    const second = session.foods.find((food) => food.position === 2) ?? session.foods[1]
    setScheduledOn(session.scheduledOn)
    setSlot1({
      foodId: first?.foodId ?? "",
      familiarity: first?.familiarity ?? "safe",
      variantNote: first?.variantNote ?? "",
      inventName: null,
    })
    setSlot2({
      foodId: second?.foodId ?? "",
      familiarity: second?.familiarity ?? "safe",
      variantNote: second?.variantNote ?? "",
      inventName: null,
    })
    setEditor({ mode: "edit", session })
  }

  function closeEditor() {
    setEditor({ mode: "closed" })
  }

  function dismissSuggestion() {
    setSuggestDraft(null)
    setSuggestSnapshot(null)
    setSuggestPreferEdit(false)
    if (status.kind === "error") {
      setStatus({ kind: "ready" })
    }
  }

  function toFoodRequest(slot: FoodSlot): SessionFoodRequest {
    const note = slot.variantNote.trim()
    return {
      foodId: slot.foodId,
      familiarity: slot.familiarity,
      variantNote: note.length > 0 ? note : null,
    }
  }

  function plannedNightOccupiesDate(
    date: string,
    ignoreSessionId?: string,
  ): boolean {
    if (completedDates.includes(date)) {
      return true
    }
    return sessions.some((session) => {
      if (session.scheduledOn !== date) {
        return false
      }
      if (ignoreSessionId && session.id === ignoreSessionId) {
        return false
      }
      return true
    })
  }

  async function onSuggestNext() {
    setEditor({ mode: "closed" })
    setStatus({ kind: "suggesting" })
    try {
      const suggestion = await sessionsClient.suggestNext()
      if (!suggestion.foods || suggestion.foods.length !== 2) {
        setStatus({
          kind: "error",
          message: "Suggestion did not include two foods",
        })
        return
      }
      const draft = suggestionToDraft(suggestion)
      setSuggestDraft(draft)
      setSuggestSnapshot(cloneSuggestDraftSnapshot(draft))
      setSuggestPreferEdit(false)
      setStatus({ kind: "ready" })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Suggest next night failed"
      if (isUnauthorizedMessage(message)) {
        onUnauthorizedRef.current?.()
        return
      }
      setStatus({ kind: "error", message })
    }
  }
  suggestNextRef.current = () => {
    void onSuggestNext()
  }

  useEffect(() => {
    if (autoSuggestKey <= 0) {
      return
    }
    if (autoSuggestKey === handledAutoSuggestKeyRef.current) {
      return
    }
    if (status.kind !== "ready") {
      return
    }
    handledAutoSuggestKeyRef.current = autoSuggestKey
    onAutoSuggestConsumedRef.current?.()
    suggestNextRef.current()
  }, [autoSuggestKey, status.kind])

  async function onApproveSuggestion() {
    if (!suggestDraft) {
      return
    }
    if (
      !suggestDraft.scheduledOn ||
      !slotIsReady(suggestDraft.slot1) ||
      !slotIsReady(suggestDraft.slot2)
    ) {
      setStatus({
        kind: "error",
        message: "Pick a date and two foods before approving.",
      })
      return
    }
    if (suggestDraft.scheduledOn < minDate) {
      setStatus({
        kind: "error",
        message: "Scheduled date can't be in the past",
      })
      return
    }
    if (plannedNightOccupiesDate(suggestDraft.scheduledOn)) {
      setStatus({
        kind: "error",
        message: "A session already exists on that date",
      })
      return
    }
    setStatus({ kind: "saving" })
    try {
      let catalog = foods
      const resolved1 = await resolveSuggestSlot(
        suggestDraft.slot1,
        catalog,
        foodsClient,
      )
      if (resolved1.createdFood) {
        catalog = [...catalog, resolved1.createdFood]
        setFoods(catalog)
      }
      const resolved2 = await resolveSuggestSlot(
        suggestDraft.slot2,
        catalog,
        foodsClient,
      )
      if (resolved2.createdFood) {
        catalog = [...catalog, resolved2.createdFood]
        setFoods(catalog)
      }

      const resolvedSlots: [FoodSlot, FoodSlot] = [
        {
          foodId: resolved1.request.foodId,
          familiarity: resolved1.request.familiarity,
          variantNote: resolved1.request.variantNote ?? "",
          inventName: null,
        },
        {
          foodId: resolved2.request.foodId,
          familiarity: resolved2.request.familiarity,
          variantNote: resolved2.request.variantNote ?? "",
          inventName: null,
        },
      ]
      const variantError = sameFoodVariantError(
        resolvedSlots[0],
        resolvedSlots[1],
      )
      if (variantError) {
        setStatus({ kind: "error", message: variantError })
        return
      }

      const created = await sessionsClient.create({
        scheduledOn: suggestDraft.scheduledOn,
        foods: [resolved1.request, resolved2.request],
      })
      setSessions((current) =>
        [...current, created].sort((a, b) =>
          a.scheduledOn.localeCompare(b.scheduledOn),
        ),
      )
      setSuggestDraft(null)
      setSuggestSnapshot(null)
      setSuggestPreferEdit(false)
      setStatus({ kind: "ready" })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Approve failed"
      if (isUnauthorizedMessage(message)) {
        onUnauthorizedRef.current?.()
        return
      }
      setStatus({ kind: "error", message })
    }
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
    const ignoreId = editor.mode === "edit" ? editor.session.id : undefined
    if (plannedNightOccupiesDate(scheduledOn, ignoreId)) {
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

  const busy =
    status.kind === "loading" ||
    status.kind === "saving" ||
    status.kind === "suggesting"
  const occupiedDates = mergeOccupiedDates(sessions, completedDates)
  const editAllowDate =
    editor.mode === "edit" ? editor.session.scheduledOn : undefined

  function onRunComplete(completed: SessionResponse) {
    setRunningSession(null)
    setSessions((current) => current.filter((item) => item.id !== completed.id))
    setCompletedDates((current) =>
      current.includes(completed.scheduledOn)
        ? current
        : [...current, completed.scheduledOn],
    )
  }

  function requestRun(session: SessionResponse) {
    if (isEarlyRunNeeded(session.scheduledOn, minDate)) {
      if (isTodayOccupied(minDate, occupiedDates)) {
        setEarlyRunSession(null)
        setStatus({
          kind: "error",
          message:
            "Today already has a tasting night, so this future night can’t be recorded as today. Run today’s night instead, or keep this one for its planned date.",
        })
        return
      }
      setEarlyRunSession(session)
      return
    }
    setEarlyRunSession(null)
    setRunningSession(session)
  }

  function dismissEarlyRun() {
    setEarlyRunSession(null)
  }

  async function confirmEarlyRun() {
    if (!earlyRunSession) {
      return
    }
    const pending = earlyRunSession
    setStatus({ kind: "saving" })
    try {
      const updated = await sessionsClient.update(
        pending.id,
        sessionToUpdatePayload(pending, minDate),
      )
      setSessions((current) =>
        current
          .map((session) => (session.id === updated.id ? updated : session))
          .sort((a, b) => a.scheduledOn.localeCompare(b.scheduledOn)),
      )
      setEarlyRunSession(null)
      setRunningSession(updated)
      setStatus({ kind: "ready" })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not record as today"
      if (isUnauthorizedMessage(message)) {
        onUnauthorizedRef.current?.()
        return
      }
      setEarlyRunSession(null)
      setStatus({ kind: "error", message })
    }
  }

  return (
    <section aria-labelledby="plan-heading" className="flex flex-col gap-6">
      {runningSession ? (
        <RunSessionPage
          session={runningSession}
          sessionsClient={sessionsClient}
          childDisplayName={childDisplayName}
          onComplete={onRunComplete}
          onExit={() => setRunningSession(null)}
          onUnauthorized={onUnauthorized}
        />
      ) : null}
      {earlyRunSession && !runningSession ? (
        <div
          role="dialog"
          aria-labelledby="early-run-heading"
          aria-describedby="early-run-copy"
          className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex flex-col gap-1">
            <h3
              id="early-run-heading"
              className="text-base font-semibold tracking-tight"
            >
              Run this night early?
            </h3>
            <p id="early-run-copy" className="text-sm text-muted-foreground">
              This night was planned for {formatDate(earlyRunSession.scheduledOn)}.
              Record it as today instead so History and Plan stay in sync?
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void confirmEarlyRun()}
              disabled={status.kind === "saving"}
            >
              {status.kind === "saving"
                ? "Updating…"
                : "Record as today and run"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={dismissEarlyRun}
              disabled={status.kind === "saving"}
            >
              Not now
            </Button>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="plan-heading" className="text-xl font-semibold tracking-tight">
            Plan
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {planSectionBlurb(childDisplayName)}
          </p>
          <p
            className="mt-2 text-sm text-muted-foreground"
            data-testid="safe-stretch plan hint"
          >
            {SAFE_STRETCH_PLAN_HINT}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void onSuggestNext()}
            disabled={busy}
          >
            {status.kind === "suggesting" ? "Suggesting…" : "Suggest next night"}
          </Button>
          <Button type="button" onClick={openCreate} disabled={busy}>
            Plan a night
          </Button>
        </div>
      </div>

      {status.kind === "loading" ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading plan…
        </p>
      ) : null}

      {status.kind === "suggesting" ? (
        <p role="status" className="text-sm text-muted-foreground">
          Suggesting a calm next night…
        </p>
      ) : null}

      {status.kind === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {status.message}
        </p>
      ) : null}

      {suggestDraft ? (
        <form
          className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4"
          onSubmit={(event) => {
            event.preventDefault()
            void onApproveSuggestion()
          }}
          aria-label="Suggested next night"
        >
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Suggested next night</p>
            {showCompactSuggest ? (
              <p className="text-xs text-muted-foreground">
                Looks good? Approve to add it to Upcoming, or edit if you want to
                swap foods or the date.
                {suggestDraft.source === "ai" ? " Drawn with AI help." : null}
                {suggestHasInvent
                  ? " One food is new — Approve adds it to your catalog."
                  : null}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Review, swap foods if you like, then approve to add it to Upcoming.
                {suggestDraft.source === "ai" ? " Drawn with AI help." : null}
                {suggestHasInvent
                  ? " One food is new — Approve adds it to your catalog."
                  : null}
              </p>
            )}
            <p
              className="mt-2 rounded-md bg-muted/60 px-3 py-2 text-sm text-foreground"
              data-testid="safe-stretch draft coaching"
              role="status"
            >
              {safeStretchCoachingCopy(
                suggestDraft.slot1.familiarity,
                suggestDraft.slot2.familiarity,
              )}
            </p>
            {suggestDraft.rationale ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {suggestDraft.rationale}
              </p>
            ) : null}
            {suggestDraft.pacingNote ? (
              <div
                className="mt-2 flex flex-col gap-1"
                data-testid="suggest pacing evidence"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Why this pace
                </p>
                <p className="text-sm text-foreground">{suggestDraft.pacingNote}</p>
                {suggestDraft.citations.length > 0 ? (
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                    {suggestDraft.citations.map((citation) => (
                      <li key={`${citation.title}-${citation.source}`}>
                        <span className="font-medium text-foreground/80">
                          {citation.title}
                        </span>
                        {" — "}
                        {citation.source}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>

          {showCompactSuggest ? (
            <div
              className="flex flex-col gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-3"
              data-testid="suggest draft summary"
            >
              <p className="text-sm font-medium">
                {formatDate(suggestDraft.scheduledOn)}
              </p>
              <ul className="flex flex-col gap-1 text-sm text-foreground">
                <li>
                  {formatSuggestSlotSummary(suggestDraft.slot1, selectableFoods)}
                </li>
                <li>
                  {formatSuggestSlotSummary(suggestDraft.slot2, selectableFoods)}
                </li>
              </ul>
            </div>
          ) : (
            <>
              <PlanDatePicker
                aria-label="Suggested date"
                value={suggestDraft.scheduledOn}
                minDate={minDate}
                occupiedDates={occupiedDates}
                disabled={status.kind === "saving"}
                onChange={(scheduledOnIso) =>
                  setSuggestDraft({
                    ...suggestDraft,
                    scheduledOn: scheduledOnIso,
                  })
                }
              />

              <FoodSlotFields
                label="Food 1"
                slot={suggestDraft.slot1}
                foods={selectableFoods}
                disabled={status.kind === "saving"}
                variantRequired={Boolean(suggestSameFoodSelected)}
                allowInvent
                onChange={(slot) =>
                  setSuggestDraft({ ...suggestDraft, slot1: slot })
                }
              />
              <FoodSlotFields
                label="Food 2"
                slot={suggestDraft.slot2}
                foods={selectableFoods}
                disabled={status.kind === "saving"}
                variantRequired={Boolean(suggestSameFoodSelected)}
                allowInvent
                onChange={(slot) =>
                  setSuggestDraft({ ...suggestDraft, slot2: slot })
                }
              />
            </>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={status.kind === "saving"}>
              {status.kind === "saving" ? "Approving…" : "Approve"}
            </Button>
            {showCompactSuggest ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setSuggestPreferEdit(true)}
                disabled={status.kind === "saving"}
              >
                Edit suggestion
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={dismissSuggestion}
              disabled={status.kind === "saving"}
            >
              Dismiss
            </Button>
          </div>
        </form>
      ) : null}

      {editor.mode !== "closed" ? (
        <form
          className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4"
          onSubmit={(event) => void onSave(event)}
          aria-label={editor.mode === "create" ? "Plan a night" : "Edit night"}
        >
          <PlanDatePicker
            aria-label="Date"
            value={scheduledOn}
            minDate={minDate}
            occupiedDates={occupiedDates}
            allowDate={editAllowDate}
            disabled={status.kind === "saving"}
            onChange={setScheduledOn}
          />

          <FoodSlotFields
            label="Food 1"
            slot={slot1}
            foods={selectableFoods}
            disabled={status.kind === "saving"}
            variantRequired={sameFoodSelected}
            onChange={setSlot1}
          />
          <FoodSlotFields
            label="Food 2"
            slot={slot2}
            foods={selectableFoods}
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
            {planEmptyHint(childDisplayName)}
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
                      onClick={() => requestRun(session)}
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

/** Apply food/variant changes with exposure-based familiarity autofill. */
export function applyPlanSlotChange(
  previous: FoodSlot,
  next: FoodSlot,
  foods: FoodResponse[],
): FoodSlot {
  const clearedInvent =
    next.foodId && next.inventName
      ? { ...next, inventName: null }
      : next
  const foodOrVariantChanged =
    previous.foodId !== clearedInvent.foodId ||
    previous.variantNote !== clearedInvent.variantNote ||
    previous.inventName !== clearedInvent.inventName
  if (!foodOrVariantChanged) {
    return clearedInvent
  }
  if (isInventSlot(clearedInvent)) {
    return clearedInvent
  }
  if (!clearedInvent.foodId) {
    return { ...clearedInvent, familiarity: "truly_new" }
  }
  const food = foods.find((item) => item.id === clearedInvent.foodId)
  const filled = autofillFamiliarity(food, clearedInvent.variantNote)
  return { ...clearedInvent, familiarity: filled ?? "truly_new" }
}

type FoodSlotFieldsProps = {
  label: string
  slot: FoodSlot
  foods: FoodResponse[]
  disabled: boolean
  variantRequired: boolean
  /** Suggest drafts may show invent slots; Plan create/edit does not. */
  allowInvent?: boolean
  onChange: (slot: FoodSlot) => void
}

function FoodSlotFields({
  label,
  slot,
  foods,
  disabled,
  variantRequired,
  allowInvent = false,
  onChange,
}: FoodSlotFieldsProps) {
  const invent = allowInvent && isInventSlot(slot)
  const retrying = slot.familiarity === "retrying"
  const selectedFood = foods.find((food) => food.id === slot.foodId)
  const knownVariants = variantKeysForFood(selectedFood)
  const variantListId = `${label.replace(/\s+/g, "-").toLowerCase()}-variants`
  const variantPlaceholder = variantRequired
    ? "Brand or variety (required)"
    : retrying
      ? "Optional — brand or prep helps when retrying"
      : "Optional brand, variety, or prep"

  function commit(next: FoodSlot) {
    onChange(applyPlanSlotChange(slot, next, foods))
  }

  return (
    <fieldset disabled={disabled} className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      {invent ? (
        <div
          className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-muted/30 p-3"
          data-testid={`${label} invent`}
        >
          <p className="text-sm">
            New suggestion:{" "}
            <span className="font-medium">{slot.inventName}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Not in your catalog yet. Approve will add it, or choose an existing
            food instead.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() =>
              commit({
                ...slot,
                foodId: "",
                inventName: null,
                familiarity: "truly_new",
              })
            }
          >
            Choose from catalog instead
          </Button>
        </div>
      ) : (
        <PlanFoodCombobox
          label={label}
          foods={foods}
          value={slot.foodId}
          disabled={disabled}
          onChange={(foodId) =>
            commit({ ...slot, foodId, inventName: null })
          }
        />
      )}
      <select
        aria-label={`${label} familiarity`}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        value={slot.familiarity}
        onChange={(event) =>
          commit({
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
          commit({ ...slot, variantNote: event.target.value })
        }
        placeholder={variantPlaceholder}
        required={variantRequired}
        maxLength={200}
        list={!invent && knownVariants.length > 0 ? variantListId : undefined}
      />
      {!invent && knownVariants.length > 0 ? (
        <datalist id={variantListId}>
          {knownVariants.map((key) => (
            <option key={key} value={key} />
          ))}
        </datalist>
      ) : null}
      {retrying && !variantRequired ? (
        <p
          className="text-xs text-muted-foreground"
          data-testid={`${label} retrying hint`}
        >
          Optional brand or prep note can help track what you&apos;re trying
          differently.
        </p>
      ) : null}
    </fieldset>
  )
}

function familiarityLabel(value: Familiarity): string {
  return (
    FAMILIARITY_OPTIONS.find((option) => option.value === value)?.label ?? value
  )
}

function formatSuggestSlotSummary(
  slot: FoodSlot,
  foods: FoodResponse[],
): string {
  const name =
    slot.inventName?.trim() ||
    foods.find((food) => food.id === slot.foodId)?.name ||
    "Food"
  const note = slot.variantNote.trim()
  const withNote = note.length > 0 ? `${name} (${note})` : name
  return `${withNote} — ${familiarityLabel(slot.familiarity)}`
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
