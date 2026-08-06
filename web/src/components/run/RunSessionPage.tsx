import { useEffect, useRef, useState } from "react"

import { SessionsClient } from "@/api"
import type {
  CompleteSessionRequest,
  Familiarity,
  FoodOutcomeRequest,
  Liked,
  SessionResponse,
  TasteBasic,
  Texture,
} from "@/api/types"
import { FoodIcon } from "@/components/food/FoodIcon"
import { BrandLogo } from "@/components/BrandLogo"
import { encodeParentNote, ParentNotesStep } from "@/components/run/ParentNotesStep"
import { RewardFlow } from "@/components/run/RewardFlow"
import { IconChoiceStep, TasteMultiChoiceStep, WhyNoteStep } from "@/components/run/RunSteps"
import {
  TASTE_BASIC_LABELS,
  TASTE_BASIC_OPTIONS,
  TASTE_EXAMPLE_ICONS,
} from "@/components/run/tasteBasics"
import { RUN_THEME } from "@/components/run/runTheme"
import {
  eligibleRewardFoods,
  initialRewardPhase,
  phaseAfterFoodPick,
  previousRewardPhase,
  type RewardPhase,
} from "@/components/run/rewardFoods"
import {
  canConfirmWhy,
  decodeWhyNote,
  encodeWhyNote,
  whyChipsForLiked,
} from "@/components/run/whyChips"
import { Button } from "@/components/ui/button"
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  transcriptFromEvent,
} from "@/lib/speechRecognition"
import { ateEnoughPrompt } from "@/lib/childDisplayName"

/** All possible kid/parent survey steps (order depends on familiarity). */
export const RUN_STEP_KINDS = [
  "liked",
  "why",
  "texture",
  "tastes",
  "ateEnough",
] as const

export type RunStepKind = (typeof RUN_STEP_KINDS)[number]

/** Stretch = anything that is not safe (same rule as reward games). */
export function isStretchFamiliarity(familiarity: Familiarity): boolean {
  return familiarity !== "safe"
}

export function runStepsForFamiliarity(familiarity: Familiarity): RunStepKind[] {
  if (isStretchFamiliarity(familiarity)) {
    return ["liked", "why", "texture", "tastes", "ateEnough"]
  }
  return ["liked", "why", "ateEnough"]
}

/** Previous survey position, or null at the first step of food 1. */
export function previousRunPosition(
  foodIndex: number,
  stepIndex: number,
  familiarityForFood: (index: number) => Familiarity,
): { foodIndex: number; stepIndex: number } | null {
  if (stepIndex > 0) {
    return { foodIndex, stepIndex: stepIndex - 1 }
  }
  if (foodIndex > 0) {
    const prevSteps = runStepsForFamiliarity(familiarityForFood(foodIndex - 1))
    return { foodIndex: foodIndex - 1, stepIndex: prevSteps.length - 1 }
  }
  return null
}

type FoodOutcomeDraft = {
  position: 1 | 2
  liked?: Liked | null
  texture?: Texture | null
  tastes?: TasteBasic[] | null
  whyNote?: string | null
  ateEnough?: boolean
}

/** True when any outcome field was set (including explicit Skip → null). */
export function isFoodOutcomeDraftDirty(draft: FoodOutcomeDraft): boolean {
  return (
    draft.liked !== undefined ||
    draft.texture !== undefined ||
    draft.tastes !== undefined ||
    draft.whyNote !== undefined ||
    draft.ateEnough !== undefined
  )
}

/** True when either food has in-progress outcome answers. */
export function areRunOutcomesDirty(
  outcomes: readonly [FoodOutcomeDraft, FoodOutcomeDraft],
): boolean {
  return (
    isFoodOutcomeDraftDirty(outcomes[0]) || isFoodOutcomeDraftDirty(outcomes[1])
  )
}

type RunSessionPageProps = {
  session: SessionResponse
  sessionsClient?: SessionsClient
  /** Optional household child display name for Run / reward copy. */
  childDisplayName?: string | null
  onComplete: (session: SessionResponse) => void
  onExit: () => void
  onUnauthorized?: () => void
}

const LIKED_OPTIONS = [
  { value: "like" as const, label: "Like", symbol: "😊" },
  { value: "so_so" as const, label: "So-so", symbol: "😐" },
  { value: "no" as const, label: "No", symbol: "👎" },
]

const TEXTURE_OPTIONS = [
  { value: "soft" as const, label: "Soft", symbol: "🍞" },
  { value: "crunchy" as const, label: "Crunchy", symbol: "🥕" },
  { value: "chewy" as const, label: "Chewy", symbol: "🍬" },
  { value: "wet" as const, label: "Wet", symbol: "💧" },
]

const TASTE_OPTIONS = TASTE_BASIC_OPTIONS.map((value) => ({
  value,
  label: TASTE_BASIC_LABELS[value],
  exampleIconKeys: TASTE_EXAMPLE_ICONS[value],
}))

const ATE_ENOUGH_OPTIONS = [
  { value: "yes" as const, label: "Yes", symbol: "✅" },
  { value: "no" as const, label: "No", symbol: "✖️" },
]

function initialOutcomes(session: SessionResponse): [FoodOutcomeDraft, FoodOutcomeDraft] {
  const first =
    session.foods.find((food) => food.position === 1) ?? session.foods[0]
  const second =
    session.foods.find((food) => food.position === 2) ?? session.foods[1]
  return [
    { position: (first?.position ?? 1) as 1 | 2 },
    { position: (second?.position ?? 2) as 1 | 2 },
  ]
}

export function buildCompleteRequest(
  drafts: [FoodOutcomeDraft, FoodOutcomeDraft],
): CompleteSessionRequest {
  const toFood = (draft: FoodOutcomeDraft): FoodOutcomeRequest => {
    const why = draft.whyNote?.trim()
    if (draft.ateEnough === undefined) {
      throw new Error("Each food needs ateEnough before completing")
    }
    return {
      position: draft.position,
      liked: draft.liked ?? null,
      texture: draft.texture ?? null,
      // Demoted from kid path — stay on contract as null for new runs.
      temperature: null,
      smell: null,
      tastes:
        draft.tastes && draft.tastes.length > 0
          ? [...new Set(draft.tastes)]
          : null,
      whyNote: why && why.length > 0 ? why : null,
      changeNote: null,
      ateEnough: draft.ateEnough,
    }
  }
  return { foods: [toFood(drafts[0]), toFood(drafts[1])] }
}

function whyPrompt(liked?: Liked | null): string {
  if (liked === "like") {
    return "Why did you like it?"
  }
  if (liked === "no") {
    return "Why didn't you like it?"
  }
  if (liked === "so_so") {
    return "Why was it so-so?"
  }
  return "Why did you like it or not like it?"
}

type RunStatus =
  | { kind: "running" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }

export function RunSessionPage({
  session,
  sessionsClient: sessionsClientProp,
  childDisplayName = null,
  onComplete,
  onExit,
  onUnauthorized,
}: RunSessionPageProps) {
  const [sessionsClient] = useState(
    () => sessionsClientProp ?? new SessionsClient(),
  )
  const [foodIndex, setFoodIndex] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [outcomes, setOutcomes] = useState(() => initialOutcomes(session))
  const [noteDraft, setNoteDraft] = useState("")
  const [whyChips, setWhyChips] = useState<string[]>([])
  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState<RunStatus>({ kind: "running" })
  const [completedSession, setCompletedSession] = useState<SessionResponse | null>(
    null,
  )
  const [rewardPhase, setRewardPhase] = useState<RewardPhase | null>(null)
  const [showParentNotes, setShowParentNotes] = useState(false)
  const [parentNotesDraft, setParentNotesDraft] = useState("")
  const [parentChangeDraft, setParentChangeDraft] = useState("")
  const [parentNoteError, setParentNoteError] = useState<string | null>(null)
  const [savingParentNote, setSavingParentNote] = useState(false)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const speechSupported = isSpeechRecognitionSupported()
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition>>(null)
  const onUnauthorizedRef = useRef(onUnauthorized)
  onUnauthorizedRef.current = onUnauthorized

  const currentFood =
    session.foods.find((food) => food.position === foodIndex + 1) ??
    session.foods[foodIndex]
  const steps = runStepsForFamiliarity(currentFood?.familiarity ?? "safe")
  const step = steps[stepIndex] ?? "liked"
  const currentDraft = outcomes[foodIndex]
  const inParentNotes = showParentNotes && completedSession !== null
  const inReward =
    !inParentNotes && rewardPhase !== null && completedSession !== null

  function advance(nextOutcomes?: [FoodOutcomeDraft, FoodOutcomeDraft]) {
    if (stepIndex < steps.length - 1) {
      setStepIndex((current) => current + 1)
      setNoteDraft("")
      setWhyChips([])
      return
    }
    if (foodIndex < 1) {
      setFoodIndex(1)
      setStepIndex(0)
      setNoteDraft("")
      setWhyChips([])
      return
    }
    void submit(nextOutcomes)
  }

  function familiarityAt(index: number): Familiarity {
    const food =
      session.foods.find((entry) => entry.position === index + 1) ??
      session.foods[index]
    return food?.familiarity ?? "safe"
  }

  function syncWhyUiForDraft(draft: FoodOutcomeDraft) {
    const chips = whyChipsForLiked(draft.liked)
    const restored = decodeWhyNote(draft.whyNote, chips)
    setWhyChips(restored.chips)
    setNoteDraft(restored.note)
  }

  function goBack() {
    if (inParentNotes || busy || savingParentNote) {
      return
    }
    if (inReward && rewardPhase && completedSession) {
      const previous = previousRewardPhase(
        rewardPhase,
        eligibleRewardFoods(completedSession),
      )
      if (previous) {
        setRewardPhase(previous)
      }
      return
    }
    const previous = previousRunPosition(foodIndex, stepIndex, familiarityAt)
    if (!previous) {
      return
    }
    setFoodIndex(previous.foodIndex)
    setStepIndex(previous.stepIndex)
    const draft = outcomes[previous.foodIndex]
    const prevSteps = runStepsForFamiliarity(familiarityAt(previous.foodIndex))
    const prevStep = prevSteps[previous.stepIndex]
    if (prevStep === "why") {
      syncWhyUiForDraft(draft)
    } else {
      setNoteDraft("")
      setWhyChips([])
    }
  }

  const canGoBack = (() => {
    if (inParentNotes) {
      return false
    }
    if (inReward && rewardPhase && completedSession) {
      return (
        previousRewardPhase(
          rewardPhase,
          eligibleRewardFoods(completedSession),
        ) !== null
      )
    }
    return previousRunPosition(foodIndex, stepIndex, familiarityAt) !== null
  })()

  async function submit(nextOutcomes?: [FoodOutcomeDraft, FoodOutcomeDraft]) {
    setStatus({ kind: "submitting" })
    try {
      const request = buildCompleteRequest(nextOutcomes ?? outcomes)
      const completed = await sessionsClient.complete(session.id, request)
      setCompletedSession(completed)
      setRewardPhase(initialRewardPhase(completed))
      setStatus({ kind: "running" })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not finish session"
      if (isUnauthorizedMessage(message)) {
        onUnauthorizedRef.current?.()
        return
      }
      setStatus({ kind: "error", message })
    }
  }

  function finishReward() {
    setShowParentNotes(true)
    setParentNotesDraft("")
    setParentChangeDraft("")
    setParentNoteError(null)
  }

  async function saveParentNote() {
    if (!completedSession) {
      return
    }
    setSavingParentNote(true)
    setParentNoteError(null)
    try {
      const encoded = encodeParentNote(parentNotesDraft, parentChangeDraft)
      const updated = await sessionsClient.updateParentNote(completedSession.id, {
        parentNote: encoded,
      })
      onComplete(updated)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save parent note"
      if (isUnauthorizedMessage(message)) {
        onUnauthorizedRef.current?.()
        return
      }
      setParentNoteError(message)
      setSavingParentNote(false)
    }
  }

  function skipParentNote() {
    if (completedSession) {
      onComplete(completedSession)
    }
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  function nextOutcomes(
    patch: Partial<FoodOutcomeDraft>,
  ): [FoodOutcomeDraft, FoodOutcomeDraft] {
    const next = [...outcomes] as [FoodOutcomeDraft, FoodOutcomeDraft]
    next[foodIndex] = { ...next[foodIndex], ...patch }
    return next
  }

  function patchDraft(patch: Partial<FoodOutcomeDraft>) {
    setOutcomes(nextOutcomes(patch))
  }

  function onStartListening() {
    const recognition = createSpeechRecognition()
    if (!recognition) {
      return
    }
    recognitionRef.current?.abort()
    recognitionRef.current = recognition
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"
    recognition.onresult = (event) => {
      setNoteDraft(transcriptFromEvent(event))
    }
    recognition.onerror = () => {
      setListening(false)
    }
    recognition.onend = () => {
      setListening(false)
    }
    setListening(true)
    recognition.start()
  }

  function confirmWhy() {
    const chips = whyChipsForLiked(currentDraft.liked)
    patchDraft({
      whyNote: encodeWhyNote(whyChips, noteDraft, chips),
    })
    advance()
  }

  function skipWhy() {
    patchDraft({ whyNote: null })
    advance()
  }

  function hasUnsavedWhyDraft(): boolean {
    return noteDraft.trim().length > 0 || whyChips.length > 0
  }

  /**
   * Exit with no dialog when the survey is still empty (and why UI untouched),
   * or when the night already completed (answers saved). Otherwise confirm —
   * leave discards in-progress answers; session stays planned.
   */
  function requestExit() {
    if (completedSession != null) {
      onExit()
      return
    }
    if (areRunOutcomesDirty(outcomes) || hasUnsavedWhyDraft()) {
      setExitConfirmOpen(true)
      return
    }
    onExit()
  }

  function confirmDiscardExit() {
    setExitConfirmOpen(false)
    onExit()
  }

  function cancelDiscardExit() {
    setExitConfirmOpen(false)
  }

  function toggleWhyChip(chip: string) {
    setWhyChips((current) =>
      current.includes(chip)
        ? current.filter((value) => value !== chip)
        : [...current, chip],
    )
  }

  const busy = status.kind === "submitting"

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-label="Run tasting session"
      aria-modal="true"
      data-theme={RUN_THEME}
    >
      <header className="run-header flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo variant="compact" className="shrink-0" />
          {!inReward && !inParentNotes && currentFood ? (
            <FoodIcon
              iconKey={currentFood.iconKey}
              iconUrl={currentFood.iconUrl}
              name={currentFood.name}
              className="size-10 shrink-0"
            />
          ) : null}
          <div className="min-w-0">
            {inParentNotes ? (
              <p className="run-prompt truncate text-lg font-semibold">
                Parent notes
              </p>
            ) : inReward ? (
              <p className="run-prompt truncate text-lg font-semibold">Reward</p>
            ) : (
              <>
                <p className="truncate text-sm text-muted-foreground">
                  Food {foodIndex + 1} of 2
                </p>
                <p className="run-prompt truncate text-lg font-semibold">
                  {currentFood?.name ?? "Tasting"}
                  {currentFood?.variantNote
                    ? ` (${currentFood.variantNote})`
                    : ""}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={goBack}
            disabled={!canGoBack || busy || savingParentNote}
            aria-label="Back"
          >
            Back
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={requestExit}
            disabled={busy || savingParentNote}
          >
            Exit
          </Button>
        </div>
      </header>

      {exitConfirmOpen ? (
        <div
          role="dialog"
          aria-labelledby="run-exit-heading"
          aria-describedby="run-exit-copy"
          className="m-4 flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
          data-testid="run exit confirm"
        >
          <div className="flex flex-col gap-1">
            <h3
              id="run-exit-heading"
              className="text-base font-semibold tracking-tight"
            >
              Leave this night?
            </h3>
            <p id="run-exit-copy" className="text-sm text-muted-foreground">
              Tonight’s answers aren’t saved yet. Leaving discards them — the
              night stays planned so you can run it again later.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={confirmDiscardExit}>
              Leave and discard
            </Button>
            <Button type="button" variant="outline" onClick={cancelDiscardExit}>
              Keep going
            </Button>
          </div>
        </div>
      ) : null}

      <main className="flex-1 overflow-y-auto">
        {exitConfirmOpen ? null : (
          <>
        {inParentNotes ? (
          <ParentNotesStep
            notes={parentNotesDraft}
            changeNextTime={parentChangeDraft}
            busy={savingParentNote}
            error={parentNoteError}
            onNotesChange={setParentNotesDraft}
            onChangeNextTimeChange={setParentChangeDraft}
            onSave={() => void saveParentNote()}
            onSkip={skipParentNote}
          />
        ) : null}

        {inReward && rewardPhase ? (
          <RewardFlow
            phase={rewardPhase}
            childDisplayName={childDisplayName}
            onPick={(food) => setRewardPhase(phaseAfterFoodPick(food))}
            onChooseGame={setRewardPhase}
            onFinished={finishReward}
          />
        ) : null}

        {!inReward && !inParentNotes && status.kind === "error" ? (
          <p role="alert" className="px-4 py-3 text-sm text-destructive">
            {status.message}
          </p>
        ) : null}

        {!inReward && !inParentNotes && step === "liked" ? (
          <IconChoiceStep
            prompt="Did you like it?"
            options={LIKED_OPTIONS}
            onChoose={(value) => {
              const updated = nextOutcomes({ liked: value })
              setOutcomes(updated)
              advance()
            }}
            onSkip={() => {
              patchDraft({ liked: null })
              advance()
            }}
          />
        ) : null}

        {!inReward && !inParentNotes && step === "why" ? (
          <WhyNoteStep
            prompt={whyPrompt(currentDraft.liked)}
            chips={whyChipsForLiked(currentDraft.liked)}
            selectedChips={whyChips}
            onToggleChip={toggleWhyChip}
            note={noteDraft}
            listening={listening}
            speechSupported={speechSupported}
            onNoteChange={setNoteDraft}
            onStartListening={onStartListening}
            onConfirm={confirmWhy}
            onSkip={skipWhy}
            confirmDisabled={!canConfirmWhy(whyChips, noteDraft)}
          />
        ) : null}

        {!inReward && !inParentNotes && step === "texture" ? (
          <IconChoiceStep
            prompt="What was the texture?"
            options={TEXTURE_OPTIONS}
            onChoose={(value) => {
              patchDraft({ texture: value })
              advance()
            }}
            onSkip={() => {
              patchDraft({ texture: null })
              advance()
            }}
          />
        ) : null}

        {!inReward && !inParentNotes && step === "tastes" ? (
          <TasteMultiChoiceStep
            prompt="How did it taste?"
            options={TASTE_OPTIONS}
            selected={currentDraft.tastes ?? []}
            onToggle={(value) => {
              const current = currentDraft.tastes ?? []
              const next = current.includes(value)
                ? current.filter((taste) => taste !== value)
                : [...current, value]
              patchDraft({ tastes: next })
            }}
            onConfirm={() => {
              const selected = currentDraft.tastes ?? []
              patchDraft({ tastes: selected.length > 0 ? selected : null })
              advance()
            }}
            onSkip={() => {
              patchDraft({ tastes: null })
              advance()
            }}
          />
        ) : null}

        {!inReward && !inParentNotes && step === "ateEnough" ? (
          <IconChoiceStep
            prompt={ateEnoughPrompt(childDisplayName)}
            options={ATE_ENOUGH_OPTIONS}
            showSkip={false}
            onChoose={(value) => {
              const updated = nextOutcomes({ ateEnough: value === "yes" })
              setOutcomes(updated)
              advance(updated)
            }}
          />
        ) : null}

        {busy ? (
          <p role="status" className="px-4 py-3 text-center text-muted-foreground">
            Saving…
          </p>
        ) : null}
          </>
        )}
      </main>
    </div>
  )
}

function isUnauthorizedMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized === "unauthorized" ||
    normalized === "not signed in" ||
    normalized.includes("session expired")
  )
}
