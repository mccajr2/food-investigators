import { Button } from "@/components/ui/button"

export type WelcomeOrientationPanelProps = {
  onDismiss: () => void
  dismissing?: boolean
  error?: string | null
}

/**
 * One-shot welcome for signed-in parents. Copy follows
 * docs/specs/active/welcome-orientation.md tone guide.
 */
export function WelcomeOrientationPanel({
  onDismiss,
  dismissing = false,
  error = null,
}: WelcomeOrientationPanelProps) {
  return (
    <div
      role="dialog"
      aria-labelledby="welcome-orientation-heading"
      aria-describedby="welcome-orientation-copy"
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex flex-col gap-2">
        <h2
          id="welcome-orientation-heading"
          className="text-lg font-semibold tracking-tight"
        >
          Welcome to Food Investigators
        </h2>
        <div
          id="welcome-orientation-copy"
          className="flex flex-col gap-3 text-sm text-muted-foreground"
        >
          <p>
            When a child eats only a few foods, travel and eating out can feel
            heavy. Specialist help can take a long time to get — or to stick.
            Food Investigators is a gentle home practice for those stretches:
            not a meal planner, and not a replacement for therapy or a diagnosis
            tool.
          </p>
          <p>
            We lean on curiosity — investigating foods like science — and simple
            tablet games they already enjoy, paced so screens stay a support, not
            a new fight. Small, calm next tries matter. When a food doesn’t land,
            kid-friendly words for taste, texture, smell, and look help you
            understand why.
          </p>
          <div>
            <p className="font-medium text-foreground">How it works</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                <span className="font-medium text-foreground">Plan</span> — pick
                two foods ahead on your laptop
              </li>
              <li>
                <span className="font-medium text-foreground">Run</span> — a short
                tasting ritual with large icons (often on an iPad)
              </li>
              <li>
                <span className="font-medium text-foreground">
                  History / Insights
                </span>{" "}
                — what you tried and what the senses said
              </li>
            </ul>
          </div>
          <p>
            Suggestions and pacing are guidance. You always Approve what goes on
            the calendar — you’re in charge.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={onDismiss}
          disabled={dismissing}
          className="self-start"
        >
          {dismissing ? "Saving…" : "Got it"}
        </Button>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
