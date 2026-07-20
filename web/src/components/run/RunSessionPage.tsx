import { useEffect, useRef, useState } from "react"

import { SessionsClient } from "@/api"
import type {
  CompleteSessionRequest,
  FoodOutcomeRequest,
  Liked,
  SessionResponse,
  Smell,
  Temperature,
  Texture,
} from "@/api/types"
import { FoodIcon } from "@/components/food/FoodIcon"
import { RewardFlow } from "@/components/run/RewardFlow"
import { IconChoiceStep, SpeechNoteStep } from "@/components/run/RunSteps"
import {
  initialRewardPhase,
  type RewardPhase,
} from "@/components/run/rewardFoods"
import { Button } from "@/components/ui/button"
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  transcriptFromEvent,
} from "@/lib/speechRecognition"

export const RUN_STEPS = [
  "liked",
  "texture",
  "temperature",
  "smell",
  "why",
  "change",
  "ateEnough",
] as const

export type RunStepKind = (typeof RUN_STEPS)[number]

type FoodOutcomeDraft = {
  position: 1 | 2
  liked?: Liked | null
  texture?: Texture | null
  temperature?: Temperature | null
  smell?: Smell | null
  whyNote?: string | null
  changeNote?: string | null
  ateEnough?: boolean
}

type RunSessionPageProps = {
  session: SessionResponse
  sessionsClient?: SessionsClient
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

const TEMPERATURE_OPTIONS = [
  { value: "cold" as const, label: "Cold", symbol: "❄️" },
  { value: "warm" as const, label: "Warm", symbol: "☀️" },
  { value: "hot" as const, label: "Hot", symbol: "🔥" },
]

const SMELL_OPTIONS = [
  { value: "mild" as const, label: "Mild", symbol: "🌸" },
  { value: "strong" as const, label: "Strong", symbol: "💨" },
]

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
    const change = draft.changeNote?.trim()
    if (draft.ateEnough === undefined) {
      throw new Error("Each food needs ateEnough before completing")
    }
    return {
      position: draft.position,
      liked: draft.liked ?? null,
      texture: draft.texture ?? null,
      temperature: draft.temperature ?? null,
      smell: draft.smell ?? null,
      whyNote: why && why.length > 0 ? why : null,
      changeNote: change && change.length > 0 ? change : null,
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
  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState<RunStatus>({ kind: "running" })
  const [completedSession, setCompletedSession] = useState<SessionResponse | null>(
    null,
  )
  const [rewardPhase, setRewardPhase] = useState<RewardPhase | null>(null)
  const speechSupported = isSpeechRecognitionSupported()
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition>>(null)
  const onUnauthorizedRef = useRef(onUnauthorized)
  onUnauthorizedRef.current = onUnauthorized

  const currentFood =
    session.foods.find((food) => food.position === foodIndex + 1) ??
    session.foods[foodIndex]
  const step = RUN_STEPS[stepIndex] ?? "liked"
  const currentDraft = outcomes[foodIndex]
  const inReward = rewardPhase !== null && completedSession !== null

  function advance(nextOutcomes?: [FoodOutcomeDraft, FoodOutcomeDraft]) {
    if (stepIndex < RUN_STEPS.length - 1) {
      setStepIndex((current) => current + 1)
      setNoteDraft("")
      return
    }
    if (foodIndex < 1) {
      setFoodIndex(1)
      setStepIndex(0)
      setNoteDraft("")
      return
    }
    void submit(nextOutcomes)
  }

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

  function confirmNote(field: "whyNote" | "changeNote") {
    const trimmed = noteDraft.trim()
    patchDraft({ [field]: trimmed.length > 0 ? trimmed : null })
    advance()
  }

  function skipNote(field: "whyNote" | "changeNote") {
    patchDraft({ [field]: null })
    advance()
  }

  const busy = status.kind === "submitting"

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-label="Run tasting session"
      aria-modal="true"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {!inReward && currentFood ? (
            <FoodIcon
              iconKey={currentFood.iconKey}
              name={currentFood.name}
              className="size-10 shrink-0"
            />
          ) : null}
          <div className="min-w-0">
            {inReward ? (
              <p className="truncate text-lg font-semibold">Reward</p>
            ) : (
              <>
                <p className="truncate text-sm text-muted-foreground">
                  Food {foodIndex + 1} of 2
                </p>
                <p className="truncate text-lg font-semibold">
                  {currentFood?.name ?? "Tasting"}
                  {currentFood?.variantNote
                    ? ` (${currentFood.variantNote})`
                    : ""}
                </p>
              </>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onExit}
          disabled={busy}
        >
          Exit
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto">
        {inReward && rewardPhase ? (
          <RewardFlow
            phase={rewardPhase}
            onPick={(food) => setRewardPhase({ kind: "catch", food })}
            onFinished={finishReward}
          />
        ) : null}

        {!inReward && status.kind === "error" ? (
          <p role="alert" className="px-4 py-3 text-sm text-destructive">
            {status.message}
          </p>
        ) : null}

        {!inReward && step === "liked" ? (
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

        {!inReward && step === "texture" ? (
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

        {!inReward && step === "temperature" ? (
          <IconChoiceStep
            prompt="What was the temperature?"
            options={TEMPERATURE_OPTIONS}
            onChoose={(value) => {
              patchDraft({ temperature: value })
              advance()
            }}
            onSkip={() => {
              patchDraft({ temperature: null })
              advance()
            }}
          />
        ) : null}

        {!inReward && step === "smell" ? (
          <IconChoiceStep
            prompt="How did it smell?"
            options={SMELL_OPTIONS}
            onChoose={(value) => {
              patchDraft({ smell: value })
              advance()
            }}
            onSkip={() => {
              patchDraft({ smell: null })
              advance()
            }}
          />
        ) : null}

        {!inReward && step === "why" ? (
          <SpeechNoteStep
            prompt={whyPrompt(currentDraft.liked)}
            note={noteDraft}
            listening={listening}
            speechSupported={speechSupported}
            onNoteChange={setNoteDraft}
            onStartListening={onStartListening}
            onConfirm={() => confirmNote("whyNote")}
            onSkip={() => skipNote("whyNote")}
          />
        ) : null}

        {!inReward && step === "change" ? (
          <SpeechNoteStep
            prompt="Is there something we could change next time?"
            note={noteDraft}
            listening={listening}
            speechSupported={speechSupported}
            onNoteChange={setNoteDraft}
            onStartListening={onStartListening}
            onConfirm={() => confirmNote("changeNote")}
            onSkip={() => skipNote("changeNote")}
          />
        ) : null}

        {!inReward && step === "ateEnough" ? (
          <IconChoiceStep
            prompt="Did they eat enough?"
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
