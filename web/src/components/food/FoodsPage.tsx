import { useEffect, useRef, useState, type FormEvent } from "react"

import { FoodsClient } from "@/api"
import {
  FOOD_ICON_KEYS,
  type FoodIconKey,
  type FoodResponse,
  type Liked,
  type Texture,
} from "@/api/types"
import { FoodIcon, FOOD_ICON_LABELS } from "@/components/food/FoodIcon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  customIconKeyFromName,
  isCustomIconKey,
} from "@/lib/generatedFoodIcon"

type Status =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "saving" }
  | { kind: "error"; message: string }

type Editor =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; food: FoodResponse }

/** Library starters, or generate a custom icon from the food name. */
type IconChoice = "fromName" | FoodIconKey

const LIKED_OPTIONS: { value: Liked; label: string }[] = [
  { value: "like", label: "Like" },
  { value: "so_so", label: "So-so" },
  { value: "no", label: "No" },
]

const TEXTURE_OPTIONS: { value: Texture; label: string }[] = [
  { value: "soft", label: "Soft" },
  { value: "crunchy", label: "Crunchy" },
  { value: "chewy", label: "Chewy" },
  { value: "wet", label: "Wet" },
]

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

type FoodsPageProps = {
  client?: FoodsClient
  onUnauthorized?: () => void
}

export function FoodsPage({
  client: clientProp,
  onUnauthorized,
}: FoodsPageProps) {
  const [client] = useState(() => clientProp ?? new FoodsClient())
  const [foods, setFoods] = useState<FoodResponse[]>([])
  const [status, setStatus] = useState<Status>({ kind: "loading" })
  const [editor, setEditor] = useState<Editor>({ mode: "closed" })
  const [name, setName] = useState("")
  const [iconChoice, setIconChoice] = useState<IconChoice>("fromName")
  const [isSnack, setIsSnack] = useState(false)
  const [liked, setLiked] = useState<Liked | "">("")
  const [texture, setTexture] = useState<Texture | "">("")
  const [tasteNote, setTasteNote] = useState("")
  const onUnauthorizedRef = useRef(onUnauthorized)
  onUnauthorizedRef.current = onUnauthorized

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus({ kind: "loading" })
      try {
        const listed = await client.list()
        if (!cancelled) {
          setFoods(listed)
          setStatus({ kind: "ready" })
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Could not load foods"
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

  const starters = foods.filter((food) => food.system)
  const tastingMine = foods.filter(
    (food) => !food.system && food.sessionEligible !== false,
  )
  const snacks = foods.filter(
    (food) => !food.system && food.sessionEligible === false,
  )
  const previewIconKey =
    iconChoice === "fromName"
      ? customIconKeyFromName(name || "food")
      : iconChoice

  function resetPreferenceFields() {
    setIsSnack(false)
    setLiked("")
    setTexture("")
    setTasteNote("")
  }

  function openCreate() {
    setName("")
    setIconChoice("fromName")
    resetPreferenceFields()
    setEditor({ mode: "create" })
  }

  function openEdit(food: FoodResponse) {
    setName(food.name)
    if (
      isCustomIconKey(food.iconKey) ||
      !FOOD_ICON_KEYS.includes(food.iconKey as FoodIconKey)
    ) {
      setIconChoice("fromName")
    } else {
      setIconChoice(food.iconKey as FoodIconKey)
    }
    setIsSnack(food.sessionEligible === false)
    setLiked(food.liked ?? "")
    setTexture(food.texture ?? "")
    setTasteNote(food.tasteNote ?? "")
    setEditor({ mode: "edit", food })
  }

  function closeEditor() {
    setEditor({ mode: "closed" })
  }

  function resolveIconKey(trimmedName: string): string {
    if (iconChoice === "fromName") {
      return customIconKeyFromName(trimmedName)
    }
    return iconChoice
  }

  function preferencePayload() {
    const trimmedNote = tasteNote.trim()
    return {
      sessionEligible: !isSnack,
      liked: liked === "" ? null : liked,
      texture: texture === "" ? null : texture,
      tasteNote: trimmedNote === "" ? null : trimmedNote,
    }
  }

  async function onSave(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      return
    }
    const iconKey = resolveIconKey(trimmed)
    const prefs = preferencePayload()
    setStatus({ kind: "saving" })
    try {
      if (editor.mode === "create") {
        const created = await client.create({
          name: trimmed,
          iconKey,
          ...prefs,
        })
        setFoods((current) =>
          [...current, created].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
          ),
        )
      } else if (editor.mode === "edit") {
        const updated = await client.update(editor.food.id, {
          name: trimmed,
          iconKey,
          ...prefs,
        })
        setFoods((current) =>
          current
            .map((food) => (food.id === updated.id ? updated : food))
            .sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
            ),
        )
      }
      setEditor({ mode: "closed" })
      setStatus({ kind: "ready" })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed"
      if (isUnauthorizedMessage(message)) {
        onUnauthorizedRef.current?.()
        return
      }
      setStatus({ kind: "error", message })
    }
  }

  async function onArchive(food: FoodResponse) {
    setStatus({ kind: "saving" })
    try {
      await client.archive(food.id)
      setFoods((current) => current.filter((item) => item.id !== food.id))
      if (editor.mode === "edit" && editor.food.id === food.id) {
        setEditor({ mode: "closed" })
      }
      setStatus({ kind: "ready" })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Archive failed"
      if (isUnauthorizedMessage(message)) {
        onUnauthorizedRef.current?.()
        return
      }
      setStatus({ kind: "error", message })
    }
  }

  return (
    <section aria-labelledby="foods-heading" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="foods-heading" className="text-xl font-semibold tracking-tight">
            Foods
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Starter library, tasting foods, and snacks for this household.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          disabled={status.kind === "loading" || status.kind === "saving"}
        >
          Add food
        </Button>
      </div>

      {status.kind === "loading" ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading foods…
        </p>
      ) : null}

      {status.kind === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {status.message}
        </p>
      ) : null}

      {editor.mode !== "closed" ? (
        <form
          className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4"
          onSubmit={(event) => void onSave(event)}
          aria-label={editor.mode === "create" ? "Add food" : "Edit food"}
        >
          <Input
            aria-label="Food name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Food name"
            required
            maxLength={200}
            disabled={status.kind === "saving"}
          />

          <fieldset disabled={status.kind === "saving"}>
            <legend className="mb-2 text-sm font-medium">Icon</legend>
            <p className="mb-2 text-xs text-muted-foreground">
              Default generates an icon from the name. Or reuse a starter icon.
            </p>
            <div
              className="grid grid-cols-4 gap-2 sm:grid-cols-5"
              role="listbox"
              aria-label="Food icon"
            >
              <button
                type="button"
                role="option"
                aria-selected={iconChoice === "fromName"}
                aria-label="Generate from name"
                className={
                  iconChoice === "fromName"
                    ? "rounded-xl border-2 border-primary bg-secondary p-2"
                    : "rounded-xl border border-border bg-background p-2 hover:bg-accent"
                }
                onClick={() => setIconChoice("fromName")}
              >
                <div className="mx-auto size-14">
                  <FoodIcon
                    iconKey={previewIconKey}
                    name={name.trim() || "Food"}
                  />
                </div>
                <span className="mt-1 block text-[0.65rem] font-medium text-muted-foreground">
                  From name
                </span>
              </button>
              {FOOD_ICON_KEYS.map((key) => {
                const selected = iconChoice === key
                return (
                  <button
                    key={key}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    aria-label={FOOD_ICON_LABELS[key]}
                    className={
                      selected
                        ? "rounded-xl border-2 border-primary bg-secondary p-2"
                        : "rounded-xl border border-border bg-background p-2 hover:bg-accent"
                    }
                    onClick={() => setIconChoice(key)}
                  >
                    <div className="mx-auto size-14">
                      <FoodIcon iconKey={key} />
                    </div>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border border-input"
              checked={isSnack}
              onChange={(event) => setIsSnack(event.target.checked)}
              disabled={status.kind === "saving"}
              aria-label="Snack (not for tasting)"
            />
            <span>
              <span className="font-medium">Snack (not for tasting)</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Snacks stay in Foods but are not offered when planning a night.
              </span>
            </span>
          </label>

          {isSnack ? (
            <fieldset
              disabled={status.kind === "saving"}
              className="flex flex-col gap-3 rounded-md border border-border bg-background p-3"
            >
              <legend className="px-1 text-sm font-medium">
                Snack preferences
              </legend>
              <div className="flex flex-col gap-1">
                <label htmlFor="snack-liked" className="text-sm font-medium">
                  Liked
                </label>
                <select
                  id="snack-liked"
                  aria-label="Liked"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={liked}
                  onChange={(event) =>
                    setLiked(event.target.value as Liked | "")
                  }
                >
                  <option value="">Not set</option>
                  {LIKED_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="snack-texture" className="text-sm font-medium">
                  Texture
                </label>
                <select
                  id="snack-texture"
                  aria-label="Texture"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={texture}
                  onChange={(event) =>
                    setTexture(event.target.value as Texture | "")
                  }
                >
                  <option value="">Not set</option>
                  {TEXTURE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="snack-taste-note" className="text-sm font-medium">
                  Taste note
                </label>
                <Input
                  id="snack-taste-note"
                  aria-label="Taste note"
                  value={tasteNote}
                  onChange={(event) => setTasteNote(event.target.value)}
                  placeholder="e.g. salt & vinegar"
                  maxLength={100}
                />
              </div>
            </fieldset>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={status.kind === "saving"}>
              {status.kind === "saving"
                ? "Saving…"
                : editor.mode === "create"
                  ? "Save food"
                  : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeEditor}
              disabled={status.kind === "saving"}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <FoodSection title="Starter foods" foods={starters} />

      <FoodSection
        title="Tasting foods"
        foods={tastingMine}
        empty="No tasting foods yet. Add one to get started."
        onEdit={openEdit}
        onArchive={(food) => void onArchive(food)}
        busy={status.kind === "saving"}
      />

      <FoodSection
        title="Snacks"
        foods={snacks}
        empty="No snacks yet. Mark a food as a snack to track preferences."
        onEdit={openEdit}
        onArchive={(food) => void onArchive(food)}
        busy={status.kind === "saving"}
        showSnackDetails
      />
    </section>
  )
}

type FoodSectionProps = {
  title: string
  foods: FoodResponse[]
  empty?: string
  onEdit?: (food: FoodResponse) => void
  onArchive?: (food: FoodResponse) => void
  busy?: boolean
  showSnackDetails?: boolean
}

function isUnauthorizedMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized === "unauthorized" ||
    normalized === "not signed in" ||
    normalized.includes("session expired")
  )
}

function snackDetailLine(food: FoodResponse): string | null {
  const parts: string[] = []
  if (food.liked) {
    parts.push(LIKED_LABELS[food.liked])
  }
  if (food.texture) {
    parts.push(TEXTURE_LABELS[food.texture])
  }
  if (food.tasteNote?.trim()) {
    parts.push(food.tasteNote.trim())
  }
  return parts.length > 0 ? parts.join(" · ") : null
}

function FoodSection({
  title,
  foods,
  empty,
  onEdit,
  onArchive,
  busy,
  showSnackDetails,
}: FoodSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {foods.length === 0 && empty ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {foods.map((food) => {
            const details = showSnackDetails ? snackDetailLine(food) : null
            return (
              <li
                key={food.id}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center"
              >
                <div className="size-20 sm:size-24">
                  <FoodIcon iconKey={food.iconKey} name={food.name} />
                </div>
                <p className="text-sm font-medium leading-snug">{food.name}</p>
                {showSnackDetails ? (
                  <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Snack
                  </p>
                ) : null}
                {details ? (
                  <p className="text-xs text-muted-foreground">{details}</p>
                ) : null}
                {onEdit && onArchive ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(food)}
                      disabled={busy}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onArchive(food)}
                      disabled={busy}
                    >
                      Archive
                    </Button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
