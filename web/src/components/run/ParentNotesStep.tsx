import { Button } from "@/components/ui/button"

export const PARENT_NOTE_MAX_LENGTH = 2000

type ParentNotesStepProps = {
  note: string
  busy?: boolean
  error?: string | null
  onNoteChange: (value: string) => void
  onSave: () => void
  onSkip: () => void
}

export function ParentNotesStep({
  note,
  busy = false,
  error = null,
  onNoteChange,
  onSave,
  onSkip,
}: ParentNotesStepProps) {
  const remaining = PARENT_NOTE_MAX_LENGTH - note.length

  return (
    <div
      className="run-enter flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-8"
      aria-label="Parent notes"
    >
      <div className="flex max-w-2xl flex-col gap-2 text-center">
        <h2 className="run-prompt text-3xl leading-tight md:text-4xl">
          Anything to note for therapy?
        </h2>
        <p className="text-muted-foreground">
          Optional — mood, setting, or anything else useful. Skip if nothing to
          add.
        </p>
      </div>
      <textarea
        aria-label="Optional parent note"
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder="Optional notes for your therapist…"
        maxLength={PARENT_NOTE_MAX_LENGTH}
        disabled={busy}
        rows={6}
        className="run-placemat w-full max-w-2xl resize-y border-[3px] bg-background px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {remaining} characters left
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
          disabled={busy}
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
