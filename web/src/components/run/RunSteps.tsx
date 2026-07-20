import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type IconChoiceOption<T extends string> = {
  value: T
  label: string
  symbol: string
}

type IconChoiceStepProps<T extends string> = {
  prompt: string
  options: IconChoiceOption<T>[]
  onChoose: (value: T) => void
  onSkip?: () => void
  showSkip?: boolean
}

export function IconChoiceStep<T extends string>({
  prompt,
  options,
  onChoose,
  onSkip,
  showSkip = true,
}: IconChoiceStepProps<T>) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4 py-8">
      <h2 className="text-center text-3xl font-semibold leading-tight md:text-4xl">
        {prompt}
      </h2>
      <div
        className="grid w-full max-w-2xl grid-cols-2 gap-4 md:grid-cols-3"
        role="listbox"
        aria-label={prompt}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-label={option.label}
            className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-border bg-card p-4 text-center transition hover:border-primary hover:bg-accent active:scale-[0.98] md:min-h-40"
            onClick={() => onChoose(option.value)}
          >
            <span className="text-5xl md:text-6xl" aria-hidden>
              {option.symbol}
            </span>
            <span className="text-xl font-medium md:text-2xl">{option.label}</span>
          </button>
        ))}
      </div>
      {showSkip && onSkip ? (
        <Button type="button" variant="ghost" size="lg" onClick={onSkip}>
          Skip
        </Button>
      ) : null}
    </div>
  )
}

type SpeechNoteStepProps = {
  prompt: string
  note: string
  listening: boolean
  speechSupported: boolean
  onNoteChange: (value: string) => void
  onStartListening: () => void
  onConfirm: () => void
  onSkip: () => void
}

export function SpeechNoteStep({
  prompt,
  note,
  listening,
  speechSupported,
  onNoteChange,
  onStartListening,
  onConfirm,
  onSkip,
}: SpeechNoteStepProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-8">
      <h2 className="max-w-2xl text-center text-3xl font-semibold leading-tight md:text-4xl">
        {prompt}
      </h2>
      {speechSupported ? (
        <Button
          type="button"
          size="lg"
          variant={listening ? "secondary" : "default"}
          onClick={onStartListening}
          disabled={listening}
          aria-label="Tap to talk"
        >
          {listening ? "Listening…" : "Tap to talk"}
        </Button>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Speech not available here — type the answer below.
        </p>
      )}
      <Input
        aria-label="Answer"
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder="What did you say?"
        className="max-w-2xl text-lg"
        maxLength={500}
      />
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" size="lg" onClick={onConfirm}>
          Use this
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={onSkip}>
          Skip
        </Button>
      </div>
    </div>
  )
}
