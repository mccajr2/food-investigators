import { Button } from "@/components/ui/button"

export const PARENT_NOTE_MAX_LENGTH = 2000

export const PARENT_NOTE_NOTES_PREFIX = "Notes:"
export const PARENT_NOTE_CHANGE_PREFIX = "Change next time:"

/**
 * Encode dual parent prompts into one parentNote string.
 * Omits blank sections; both blank → null.
 */
export function encodeParentNote(
  notes: string,
  changeNextTime: string,
): string | null {
  const trimmedNotes = notes.trim()
  const trimmedChange = changeNextTime.trim()
  const parts: string[] = []
  if (trimmedNotes.length > 0) {
    parts.push(`${PARENT_NOTE_NOTES_PREFIX} ${trimmedNotes}`)
  }
  if (trimmedChange.length > 0) {
    parts.push(`${PARENT_NOTE_CHANGE_PREFIX} ${trimmedChange}`)
  }
  if (parts.length === 0) {
    return null
  }
  return parts.join("\n\n")
}

/**
 * Split a stored parentNote back into the two fields.
 * Unlabeled legacy text goes entirely into notes.
 */
export function decodeParentNote(stored: string | null | undefined): {
  notes: string
  changeNextTime: string
} {
  const raw = stored?.trim() ?? ""
  if (!raw) {
    return { notes: "", changeNextTime: "" }
  }

  const sections = raw.split(/\n\n+/).map((section) => section.trim()).filter(Boolean)
  let notes = ""
  let changeNextTime = ""
  let sawLabeled = false

  for (const section of sections) {
    if (section.startsWith(PARENT_NOTE_NOTES_PREFIX)) {
      notes = section.slice(PARENT_NOTE_NOTES_PREFIX.length).trim()
      sawLabeled = true
    } else if (section.startsWith(PARENT_NOTE_CHANGE_PREFIX)) {
      changeNextTime = section.slice(PARENT_NOTE_CHANGE_PREFIX.length).trim()
      sawLabeled = true
    }
  }

  if (sawLabeled) {
    return { notes, changeNextTime }
  }

  // Single block with both prefixes and no blank line
  const changeIndex = raw.indexOf(PARENT_NOTE_CHANGE_PREFIX)
  if (raw.startsWith(PARENT_NOTE_NOTES_PREFIX) && changeIndex > 0) {
    return {
      notes: raw.slice(PARENT_NOTE_NOTES_PREFIX.length, changeIndex).trim(),
      changeNextTime: raw.slice(changeIndex + PARENT_NOTE_CHANGE_PREFIX.length).trim(),
    }
  }
  if (raw.startsWith(PARENT_NOTE_CHANGE_PREFIX)) {
    return {
      notes: "",
      changeNextTime: raw.slice(PARENT_NOTE_CHANGE_PREFIX.length).trim(),
    }
  }

  return { notes: raw, changeNextTime: "" }
}

type ParentNotesStepProps = {
  notes: string
  changeNextTime: string
  busy?: boolean
  error?: string | null
  onNotesChange: (value: string) => void
  onChangeNextTimeChange: (value: string) => void
  onSave: () => void
  onSkip: () => void
}

export function ParentNotesStep({
  notes,
  changeNextTime,
  busy = false,
  error = null,
  onNotesChange,
  onChangeNextTimeChange,
  onSave,
  onSkip,
}: ParentNotesStepProps) {
  const encoded = encodeParentNote(notes, changeNextTime) ?? ""
  const remaining = PARENT_NOTE_MAX_LENGTH - encoded.length
  const overLimit = remaining < 0

  return (
    <div
      className="run-enter flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-8"
      aria-label="Parent notes"
    >
      <div className="flex max-w-2xl flex-col gap-2 text-center">
        <h2 className="run-prompt text-3xl leading-tight md:text-4xl">
          Parent notes
        </h2>
        <p className="text-muted-foreground">
          Optional — skip if nothing to add.
        </p>
      </div>
      <div className="flex w-full max-w-2xl flex-col gap-2">
        <label
          htmlFor="parent-session-notes"
          className="run-prompt text-left text-lg"
        >
          Anything else to note from this session?
        </label>
        <textarea
          id="parent-session-notes"
          aria-label="Session notes"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Mood, setting, or anything else useful…"
          disabled={busy}
          rows={4}
          className="run-placemat w-full resize-y border-[3px] bg-background px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="flex w-full max-w-2xl flex-col gap-2">
        <label
          htmlFor="parent-change-next"
          className="run-prompt text-left text-lg"
        >
          What could we change next time?
        </label>
        <textarea
          id="parent-change-next"
          aria-label="Change next time"
          value={changeNextTime}
          onChange={(event) => onChangeNextTimeChange(event.target.value)}
          placeholder="Prep, portion, timing, seating…"
          disabled={busy}
          rows={4}
          className="run-placemat w-full resize-y border-[3px] bg-background px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {overLimit
          ? `${Math.abs(remaining)} characters over the limit`
          : `${remaining} characters left`}
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          size="lg"
          className="min-h-14 min-w-32 text-lg"
          onClick={onSave}
          disabled={busy || overLimit}
        >
          {busy ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="min-h-14 min-w-32 text-lg"
          onClick={onSkip}
          disabled={busy}
        >
          Skip
        </Button>
      </div>
    </div>
  )
}
