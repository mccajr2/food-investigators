import { useEffect, useRef, useState } from "react"

import { InsightsClient } from "@/api"
import type { InsightsResponse, Texture } from "@/api/types"
import { Button } from "@/components/ui/button"

type Status =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "error"; message: string }

type InsightsPageProps = {
  client?: InsightsClient
  onUnauthorized?: () => void
}

const TEXTURE_LABELS: Record<Texture, string> = {
  soft: "Soft",
  crunchy: "Crunchy",
  chewy: "Chewy",
  wet: "Wet",
}

const READY_THRESHOLD = 3

export function InsightsPage({
  client: clientProp,
  onUnauthorized,
}: InsightsPageProps) {
  const [client] = useState(() => clientProp ?? new InsightsClient())
  const [insights, setInsights] = useState<InsightsResponse | null>(null)
  const [status, setStatus] = useState<Status>({ kind: "loading" })
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const onUnauthorizedRef = useRef(onUnauthorized)
  onUnauthorizedRef.current = onUnauthorized

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
              value={`${insights.familiarityLikes} likes · ${insights.familiarityFamiliarButNew} familiar-new · ${insights.familiarityTrulyNew} truly new`}
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
              label="Parent notes"
              value={insights.hasParentNotes ? "Some nights have notes" : "None yet"}
            />
          </dl>

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
