import { useEffect, useRef, useState } from "react"

import { InsightsClient } from "@/api"
import type { InsightsResponse, Liked, Texture } from "@/api/types"
import { TASTE_BASIC_LABELS } from "@/components/run/tasteBasics"
import { Button } from "@/components/ui/button"

type Status =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "error"; message: string }

type InsightsPageProps = {
  client?: InsightsClient
  onUnauthorized?: () => void
  /** Switch AuthShell to Plan (no new routes). */
  onGoToPlan?: () => void
  /** After Plan is shown, optionally start Suggest (AuthShell bumps Plan). */
  onSuggestNext?: () => void
}

const TEXTURE_LABELS: Record<Texture, string> = {
  soft: "Soft",
  crunchy: "Crunchy",
  chewy: "Chewy",
  wet: "Wet",
}

const LIKED_LABELS: Record<Liked, string> = {
  like: "Like",
  so_so: "So-so",
  no: "No",
}

const READY_THRESHOLD = 3

export function InsightsPage({
  client: clientProp,
  onUnauthorized,
  onGoToPlan,
  onSuggestNext,
}: InsightsPageProps) {
  const [client] = useState(() => clientProp ?? new InsightsClient())
  const [insights, setInsights] = useState<InsightsResponse | null>(null)
  const [status, setStatus] = useState<Status>({ kind: "loading" })
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const onUnauthorizedRef = useRef(onUnauthorized)
  onUnauthorizedRef.current = onUnauthorized

  function onPlanSuggestedNight() {
    onGoToPlan?.()
    onSuggestNext?.()
  }

  const showPlanSuggestCta = onGoToPlan != null || onSuggestNext != null

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus({ kind: "loading" })
      try {
        const loaded = await client.get()
        if (!cancelled) {
          setInsights(loaded)
          setStatus({ kind: "ready" })
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Could not load insights"
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
  }, [client])

  async function onDismiss(tipId: string) {
    setDismissingId(tipId)
    try {
      await client.dismissTip(tipId)
      setInsights((current) =>
        current
          ? {
              ...current,
              tips: current.tips.filter((tip) => tip.id !== tipId),
            }
          : current,
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not dismiss tip"
      if (isUnauthorizedMessage(message)) {
        onUnauthorizedRef.current?.()
        return
      }
      setStatus({ kind: "error", message })
    } finally {
      setDismissingId(null)
    }
  }

  return (
    <section aria-labelledby="insights-heading" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="insights-heading"
            className="text-xl font-semibold tracking-tight"
          >
            Insights
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Patterns from tasting nights and snacks — gentle tips you can ignore.
          </p>
        </div>
        {showPlanSuggestCta ? (
          <Button
            type="button"
            onClick={onPlanSuggestedNight}
            data-testid="insights plan suggest cta"
          >
            Plan a suggested night
          </Button>
        ) : null}
      </div>

      {status.kind === "loading" ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading insights…
        </p>
      ) : null}

      {status.kind === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {status.message}
        </p>
      ) : null}

      {status.kind === "ready" && insights && !insights.ready ? (
        <div
          role="status"
          className="rounded-lg border border-border bg-card p-4"
        >
          <p className="text-sm font-medium">Not enough tasting nights yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete {READY_THRESHOLD} tasting nights to unlock insights and
            tips. You’ve finished {insights.completedSessionCount} so far
            {insights.snackCount > 0
              ? ` (plus ${insights.snackCount} snack${insights.snackCount === 1 ? "" : "s"} tracked)`
              : ""}
            .
          </p>
        </div>
      ) : null}

      {status.kind === "ready" && insights?.ready ? (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat
              label="Nights completed"
              value={String(insights.completedSessionCount)}
            />
            <Stat
              label="Ate enough"
              value={`${insights.ateEnoughYes} yes · ${insights.ateEnoughNo} no`}
            />
            <Stat
              label="Liked"
              value={`${insights.likedLike} like · ${insights.likedSoSo} so-so · ${insights.likedNo} no`}
            />
            <Stat
              label="Skipped liked"
              value={String(insights.likedSkipped)}
            />
            <Stat
              label="Familiarity"
              value={`${insights.familiaritySafe} Safe · ${insights.familiarityFamiliarButNew} Familiar but new · ${insights.familiarityTrulyNew} Truly new`}
            />
            <Stat label="Snacks tracked" value={String(insights.snackCount)} />
            <Stat
              label="Textures liked most"
              value={
                insights.topLikedTextures.length > 0
                  ? insights.topLikedTextures
                      .map((texture) => TEXTURE_LABELS[texture] ?? texture)
                      .join(", ")
                  : "None yet"
              }
            />
            <Stat
              label="Tastes liked most"
              value={
                insights.topLikedTastes.length > 0
                  ? insights.topLikedTastes
                      .map((taste) => TASTE_BASIC_LABELS[taste] ?? taste)
                      .join(", ")
                  : "None yet"
              }
            />
            <Stat
              label="Parent notes"
              value={insights.hasParentNotes ? "Some nights have notes" : "None yet"}
            />
          </dl>

          <section
            aria-labelledby="insights-recent-whys-heading"
            className="flex flex-col gap-3"
          >
            <h3
              id="insights-recent-whys-heading"
              className="text-sm font-medium uppercase tracking-wide text-muted-foreground"
            >
              Recent whys
            </h3>
            {insights.recentWhyNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No why notes yet — they’ll show up after tasting nights.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {insights.recentWhyNotes.map((note) => (
                  <li
                    key={`${note.scheduledOn}-${note.foodName}-${note.whyNote}`}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <p className="text-sm font-medium leading-snug">
                      {note.foodName}
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {note.scheduledOn}
                        {note.liked
                          ? ` · ${LIKED_LABELS[note.liked] ?? note.liked}`
                          : ""}
                      </span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{note.whyNote}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="insights-tips-heading" className="flex flex-col gap-3">
            <h3
              id="insights-tips-heading"
              className="text-sm font-medium uppercase tracking-wide text-muted-foreground"
            >
              Tips
            </h3>
            {insights.tips.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tips right now — you’re all caught up.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {insights.tips.map((tip) => (
                  <li
                    key={tip.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <p className="text-sm leading-relaxed">{tip.message}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label={`Dismiss tip: ${tip.id}`}
                      disabled={dismissingId !== null}
                      onClick={() => void onDismiss(tip.id)}
                    >
                      {dismissingId === tip.id ? "Dismissing…" : "Dismiss"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium leading-snug">{value}</dd>
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
