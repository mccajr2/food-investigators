import { useEffect, useMemo, useRef, useState } from "react"

import { SessionsClient } from "@/api"
import type {
  Familiarity,
  Liked,
  SessionFoodResponse,
  SessionResponse,
  Smell,
  Temperature,
  Texture,
} from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Status =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "error"; message: string }

type DownloadStatus =
  | { kind: "idle" }
  | { kind: "downloading" }
  | { kind: "error"; message: string }

type HistoryPageProps = {
  sessionsClient?: SessionsClient
  onUnauthorized?: () => void
}

const FAMILIARITY_LABELS: Record<Familiarity, string> = {
  likes: "Likes",
  familiar_but_new: "Familiar but new",
  truly_new: "Truly new",
}

const LIKED_LABELS: Record<Liked, string> = {
  like: "Like",
  so_so: "So-so",
  no: "No",
}

const TEXTURE_LABELS: Record<Texture, string> = {
  soft: "Soft",
  crunchy: "Crunchy",
  chewy: "Chewy",
  wet: "Wet",
}

const TEMPERATURE_LABELS: Record<Temperature, string> = {
  cold: "Cold",
  warm: "Warm",
  hot: "Hot",
}

const SMELL_LABELS: Record<Smell, string> = {
  like: "Like",
  so_so: "So-so",
  no: "No",
}

export function HistoryPage({
  sessionsClient: sessionsClientProp,
  onUnauthorized,
}: HistoryPageProps) {
  const [sessionsClient] = useState(
    () => sessionsClientProp ?? new SessionsClient(),
  )
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [status, setStatus] = useState<Status>({ kind: "loading" })
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({
    kind: "idle",
  })
  const onUnauthorizedRef = useRef(onUnauthorized)
  onUnauthorizedRef.current = onUnauthorized

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus({ kind: "loading" })
      try {
        const history = await sessionsClient.listHistory()
        if (!cancelled) {
          setSessions(history)
          setSelectedId(null)
          setStatus({ kind: "ready" })
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Could not load history"
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
  }, [sessionsClient])

  const rangeInvalid = Boolean(fromDate && toDate && fromDate > toDate)

  const filteredSessions = useMemo(
    () => filterSessionsByScheduledOn(sessions, fromDate, toDate),
    [sessions, fromDate, toDate],
  )

  const selected =
    filteredSessions.find((session) => session.id === selectedId) ?? null

  async function onDownloadPdf() {
    if (rangeInvalid || downloadStatus.kind === "downloading") {
      return
    }
    setDownloadStatus({ kind: "downloading" })
    try {
      const blob = await sessionsClient.downloadHistoryPdf({
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
      })
      triggerPdfDownload(blob, "tasting-history.pdf")
      setDownloadStatus({ kind: "idle" })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not download PDF"
      if (isUnauthorizedMessage(message)) {
        onUnauthorizedRef.current?.()
      }
      setDownloadStatus({ kind: "error", message })
    }
  }

  function onClearFilter() {
    setFromDate("")
    setToDate("")
    setSelectedId(null)
  }

  return (
    <section aria-labelledby="history-heading" className="flex flex-col gap-6">
      <div>
        <h2 id="history-heading" className="text-xl font-semibold tracking-tight">
          History
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Past tasting nights and what was answered — read only.
        </p>
      </div>

      {status.kind !== "loading" && status.kind !== "error" ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium">Date range</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">From</span>
              <Input
                aria-label="From date"
                type="date"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(event.target.value)
                  setSelectedId(null)
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">To</span>
              <Input
                aria-label="To date"
                type="date"
                value={toDate}
                onChange={(event) => {
                  setToDate(event.target.value)
                  setSelectedId(null)
                }}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={onClearFilter}
              disabled={!fromDate && !toDate}
            >
              Clear
            </Button>
            <Button
              type="button"
              onClick={() => void onDownloadPdf()}
              disabled={rangeInvalid || downloadStatus.kind === "downloading"}
            >
              {downloadStatus.kind === "downloading"
                ? "Downloading…"
                : "Download PDF"}
            </Button>
          </div>
          {rangeInvalid ? (
            <p role="alert" className="text-sm text-destructive">
              From date must be on or before To date.
            </p>
          ) : null}
          {downloadStatus.kind === "error" ? (
            <p role="alert" className="text-sm text-destructive">
              {downloadStatus.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {status.kind === "loading" ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading history…
        </p>
      ) : null}

      {status.kind === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {status.message}
        </p>
      ) : null}

      {status.kind === "ready" && filteredSessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {sessions.length === 0
            ? "No completed nights yet. Run a planned session to see it here."
            : "No completed nights in this date range."}
        </p>
      ) : null}

      {filteredSessions.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <ul className="flex flex-col gap-3" aria-label="Completed sessions">
            {filteredSessions.map((session) => {
              const isSelected = session.id === selectedId
              return (
                <li key={session.id}>
                  <button
                    type="button"
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-primary bg-accent"
                        : "border-border bg-card hover:border-primary/60"
                    }`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedId(session.id)}
                  >
                    <p className="font-medium">{formatDate(session.scheduledOn)}</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {sortedFoods(session).map((food) => (
                        <li key={`${session.id}-${food.position}`}>
                          {foodSummary(food)}
                        </li>
                      ))}
                    </ul>
                  </button>
                </li>
              )
            })}
          </ul>

          <div
            className="rounded-xl border border-border bg-card p-4"
            aria-live="polite"
          >
            {selected ? (
              <SessionDetail session={selected} onClose={() => setSelectedId(null)} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a night to see answers and notes.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}

type SessionDetailProps = {
  session: SessionResponse
  onClose: () => void
}

function SessionDetail({ session, onClose }: SessionDetailProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{formatDate(session.scheduledOn)}</h3>
          <p className="text-sm text-muted-foreground">Completed night</p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        {sortedFoods(session).map((food) => (
          <article
            key={`${session.id}-detail-${food.position}`}
            className="flex flex-col gap-2 border-t border-border pt-4 first:border-t-0 first:pt-0"
            aria-label={`Food ${food.position}: ${food.name}`}
          >
            <h4 className="font-medium">
              Food {food.position}: {food.name}
              {food.variantNote ? ` (${food.variantNote})` : ""}
            </h4>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <DetailRow label="Familiarity" value={FAMILIARITY_LABELS[food.familiarity]} />
              <DetailRow label="Liked" value={labelOrSkipped(food.liked, LIKED_LABELS)} />
              <DetailRow
                label="Texture"
                value={labelOrSkipped(food.texture, TEXTURE_LABELS)}
              />
              <DetailRow
                label="Temperature"
                value={labelOrSkipped(food.temperature, TEMPERATURE_LABELS)}
              />
              <DetailRow label="Smell" value={labelOrSkipped(food.smell, SMELL_LABELS)} />
              <DetailRow
                label="Ate enough"
                value={
                  food.ateEnough === true
                    ? "Yes"
                    : food.ateEnough === false
                      ? "No"
                      : "—"
                }
              />
              <DetailRow label="Why" value={food.whyNote?.trim() || "Skipped"} wide />
              <DetailRow
                label="What could change"
                value={food.changeNote?.trim() || "Skipped"}
                wide
              />
            </dl>
          </article>
        ))}
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  wide = false,
}: {
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

function filterSessionsByScheduledOn(
  sessions: SessionResponse[],
  fromDate: string,
  toDate: string,
): SessionResponse[] {
  return sessions.filter((session) => {
    if (fromDate && session.scheduledOn < fromDate) {
      return false
    }
    if (toDate && session.scheduledOn > toDate) {
      return false
    }
    return true
  })
}

function triggerPdfDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function sortedFoods(session: SessionResponse): SessionFoodResponse[] {
  return [...session.foods].sort((a, b) => a.position - b.position)
}

function foodSummary(food: SessionFoodResponse): string {
  const note = food.variantNote ? ` (${food.variantNote})` : ""
  return `${food.name}${note} — ${FAMILIARITY_LABELS[food.familiarity]}`
}

function labelOrSkipped<T extends string>(
  value: T | null | undefined,
  labels: Record<T, string>,
): string {
  if (value == null) {
    return "Skipped"
  }
  return labels[value] ?? value
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
