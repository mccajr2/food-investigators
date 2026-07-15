import { useEffect, useRef, useState, type FormEvent } from "react"

import { FoodsClient } from "@/api"
import { FOOD_ICON_KEYS, type FoodIconKey, type FoodResponse } from "@/api/types"
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
  const mine = foods.filter((food) => !food.system)
  const previewIconKey =
    iconChoice === "fromName"
      ? customIconKeyFromName(name || "food")
      : iconChoice

  function openCreate() {
    setName("")
    setIconChoice("fromName")
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

  async function onSave(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      return
    }
    const iconKey = resolveIconKey(trimmed)
    setStatus({ kind: "saving" })
    try {
      if (editor.mode === "create") {
        const created = await client.create({ name: trimmed, iconKey })
        setFoods((current) =>
          [...current, created].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
          ),
        )
      } else if (editor.mode === "edit") {
        const updated = await client.update(editor.food.id, {
          name: trimmed,
          iconKey,
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
            Starter library and foods for this household.
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
        title="My foods"
        foods={mine}
        empty="No household foods yet. Add one to get started."
        onEdit={openEdit}
        onArchive={(food) => void onArchive(food)}
        busy={status.kind === "saving"}
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
}

function isUnauthorizedMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized === "unauthorized" ||
    normalized === "not signed in" ||
    normalized.includes("session expired")
  )
}

function FoodSection({
  title,
  foods,
  empty,
  onEdit,
  onArchive,
  busy,
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
          {foods.map((food) => (
            <li
              key={food.id}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center"
            >
              <div className="size-20 sm:size-24">
                <FoodIcon iconKey={food.iconKey} name={food.name} />
              </div>
              <p className="text-sm font-medium leading-snug">{food.name}</p>
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
          ))}
        </ul>
      )}
    </section>
  )
}
