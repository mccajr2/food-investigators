import { FoodIcon } from "@/components/food/FoodIcon"
import { WhyChipIcon } from "@/components/run/whyChipIcons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { FoodIconKey } from "@/api/types"
import { cn } from "@/lib/utils"

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
    <div
      key={prompt}
      className="run-enter flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4 py-8"
    >
      <h2 className="run-prompt text-center text-3xl leading-tight md:text-4xl lg:text-5xl">
        {prompt}
      </h2>
      <div
        className="grid w-full max-w-2xl grid-cols-2 gap-5 md:grid-cols-3"
        role="listbox"
        aria-label={prompt}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-label={option.label}
            className="run-placemat flex min-h-36 flex-col items-center justify-center gap-3 p-5 text-center hover:brightness-[1.03] md:min-h-44"
            onClick={() => onChoose(option.value)}
          >
            <span className="text-5xl md:text-6xl" aria-hidden>
              {option.symbol}
            </span>
            <span className="run-prompt text-xl md:text-2xl">{option.label}</span>
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

type TasteMultiOption<T extends string> = {
  value: T
  label: string
  exampleIconKeys: FoodIconKey[]
}

type TasteMultiChoiceStepProps<T extends string> = {
  prompt: string
  options: TasteMultiOption<T>[]
  selected: T[]
  onToggle: (value: T) => void
  onConfirm: () => void
  onSkip: () => void
}

export function TasteMultiChoiceStep<T extends string>({
  prompt,
  options,
  selected,
  onToggle,
  onConfirm,
  onSkip,
}: TasteMultiChoiceStepProps<T>) {
  return (
    <div
      key={prompt}
      className="run-enter flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4 py-8"
    >
      <h2 className="run-prompt text-center text-3xl leading-tight md:text-4xl lg:text-5xl">
        {prompt}
      </h2>
      <p className="max-w-xl text-center text-base text-muted-foreground md:text-lg">
        Tap all that fit — examples show foods that often taste this way.
      </p>
      <div
        className="grid w-full max-w-2xl grid-cols-2 gap-4"
        role="group"
        aria-label={prompt}
      >
        {options.map((option) => {
          const isSelected = selected.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              aria-label={option.label}
              className={cn(
                "run-placemat flex min-h-40 flex-col items-center justify-center gap-3 p-4 text-center transition hover:brightness-[1.03]",
                isSelected && "run-placemat--selected",
              )}
              onClick={() => onToggle(option.value)}
            >
              <span className="run-prompt text-xl md:text-2xl">{option.label}</span>
              <span className="flex items-center justify-center gap-1.5" aria-hidden>
                {option.exampleIconKeys.map((iconKey) => (
                  <span key={iconKey} className="size-12 overflow-hidden rounded-xl md:size-14">
                    <FoodIcon iconKey={iconKey} />
                  </span>
                ))}
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" size="lg" onClick={onConfirm}>
          Done
        </Button>
        <Button type="button" size="lg" variant="ghost" onClick={onSkip}>
          Skip
        </Button>
      </div>
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
  confirmLabel?: string
  confirmDisabled?: boolean
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
  confirmLabel = "Use this",
  confirmDisabled = false,
}: SpeechNoteStepProps) {
  return (
    <div
      key={prompt}
      className="run-enter flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-8"
    >
      <h2 className="run-prompt max-w-2xl text-center text-3xl leading-tight md:text-4xl lg:text-5xl">
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
        className="run-placemat max-w-2xl border-[3px] text-lg"
        maxLength={500}
      />
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          size="lg"
          onClick={onConfirm}
          disabled={confirmDisabled}
        >
          {confirmLabel}
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={onSkip}>
          Skip
        </Button>
      </div>
    </div>
  )
}

type WhyNoteStepProps = {
  prompt: string
  chips: readonly string[]
  selectedChips: string[]
  onToggleChip: (chip: string) => void
  note: string
  listening: boolean
  speechSupported: boolean
  onNoteChange: (value: string) => void
  onStartListening: () => void
  onConfirm: () => void
  onSkip: () => void
  confirmDisabled: boolean
}

export function WhyNoteStep({
  prompt,
  chips,
  selectedChips,
  onToggleChip,
  note,
  listening,
  speechSupported,
  onNoteChange,
  onStartListening,
  onConfirm,
  onSkip,
  confirmDisabled,
}: WhyNoteStepProps) {
  return (
    <div
      key={prompt}
      className="run-enter flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-8"
      aria-label="Why note"
    >
      <h2 className="run-prompt max-w-2xl text-center text-3xl leading-tight md:text-4xl lg:text-5xl">
        {prompt}
      </h2>
      <p className="max-w-xl text-center text-base text-muted-foreground md:text-lg">
        Tap all that fit — you can also add a short note.
      </p>
      <div
        className="flex w-full max-w-2xl flex-wrap justify-center gap-3"
        role="group"
        aria-label="Why chips"
      >
        {chips.map((chip) => {
          const isSelected = selectedChips.includes(chip)
          return (
            <button
              key={chip}
              type="button"
              aria-pressed={isSelected}
              aria-label={chip}
              className={cn(
                "run-placemat flex min-h-20 min-w-[9rem] flex-col items-center justify-center gap-2 px-3 py-3 text-center transition hover:brightness-[1.03]",
                isSelected && "run-placemat--selected",
              )}
              onClick={() => onToggleChip(chip)}
            >
              <WhyChipIcon chip={chip} />
              {/* Visible label required — backup when art is unclear (why-chip-illustrations). */}
              <span className="run-prompt text-base leading-tight md:text-lg">
                {chip}
              </span>
            </button>
          )
        })}
      </div>
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
        placeholder="Anything else? (optional)"
        className="run-placemat max-w-2xl border-[3px] text-lg"
        maxLength={500}
      />
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          size="lg"
          onClick={onConfirm}
          disabled={confirmDisabled}
        >
          Continue
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={onSkip}>
          Skip
        </Button>
      </div>
    </div>
  )
}
