import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"

import { FoodsClient } from "@/api"
import {
  FOOD_ICON_KEYS,
  type Familiarity,
  type FoodIconKey,
  type FoodExposureResponse,
  type FoodResponse,
  type Liked,
  type StretchTargetResponse,
  type Texture,
} from "@/api/types"
import { FoodIcon, FOOD_ICON_LABELS } from "@/components/food/FoodIcon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  customIconKeyFromName,
  isCustomIconKey,
} from "@/lib/generatedFoodIcon"
import { normalizeVariantKey } from "@/lib/foodExposures"

type Status =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "saving" }
  | { kind: "error"; message: string }

type Editor =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; food: FoodResponse }

type ExposureEditor =
  | { mode: "closed" }
  | { mode: "open"; foodId: string }

type StretchEditor = { mode: "closed" } | { mode: "open" }

type StretchAddMode = "existing" | "invent"

const STRETCH_TARGETS_MAX = 5

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

const FAMILIARITY_OPTIONS: { value: Familiarity; label: string }[] = [
  { value: "safe", label: "Safe" },
  { value: "familiar_but_new", label: "Familiar but new" },
  { value: "truly_new", label: "Truly new" },
  { value: "retrying", label: "Retrying" },
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

const FAMILIARITY_LABELS: Record<Familiarity, string> = {
  safe: "Safe",
  familiar_but_new: "Familiar but new",
  truly_new: "Truly new",
  retrying: "Retrying",
}

export function variantLabel(variantKey: string): string {
  return variantKey === "" ? "Any / unspecified" : variantKey
}

export function mergeExposureIntoFoods(
  foods: FoodResponse[],
  exposure: FoodExposureResponse,
): FoodResponse[] {
  return foods.map((food) => {
    if (food.id !== exposure.foodId) {
      return food
    }
    const others = (food.exposures ?? []).filter(
      (row) => row.variantKey !== exposure.variantKey,
    )
    return {
      ...food,
      exposures: [...others, exposure].sort((a, b) =>
        a.variantKey.localeCompare(b.variantKey),
      ),
    }
  })
}

export function removeExposureFromFoods(
  foods: FoodResponse[],
  foodId: string,
  variantKey: string,
): FoodResponse[] {
  const key = normalizeVariantKey(variantKey)
  return foods.map((food) => {
    if (food.id !== foodId) {
      return food
    }
    return {
      ...food,
      exposures: (food.exposures ?? []).filter((row) => row.variantKey !== key),
    }
  })
}

type SafeRow = {
  food: FoodResponse
  exposure: FoodExposureResponse
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
  const [stretchTargets, setStretchTargets] = useState<StretchTargetResponse[]>(
    [],
  )
  const [status, setStatus] = useState<Status>({ kind: "loading" })
  const [editor, setEditor] = useState<Editor>({ mode: "closed" })
  const [exposureEditor, setExposureEditor] = useState<ExposureEditor>({
    mode: "closed",
  })
  const [stretchEditor, setStretchEditor] = useState<StretchEditor>({
    mode: "closed",
  })
  const [stretchAddMode, setStretchAddMode] =
    useState<StretchAddMode>("existing")
  const [stretchFoodId, setStretchFoodId] = useState("")
  const [stretchName, setStretchName] = useState("")
  const [stretchVariant, setStretchVariant] = useState("")
  const [exposureFoodId, setExposureFoodId] = useState("")
  const [exposureVariant, setExposureVariant] = useState("")
  const [exposureFamiliarity, setExposureFamiliarity] =
    useState<Familiarity>("safe")
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
        const [listed, targets] = await Promise.all([
          client.list(),
          client.listStretchTargets(),
        ])
        if (!cancelled) {
          setFoods(listed)
          setStretchTargets(targets)
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
  const tastingEligible = useMemo(
    () => foods.filter((food) => food.sessionEligible !== false),
    [foods],
  )
  const knownSafes = useMemo(() => {
    const rows: SafeRow[] = []
    for (const food of foods) {
      for (const exposure of food.exposures ?? []) {
        if (exposure.familiarity === "safe") {
          rows.push({ food, exposure })
        }
      }
    }
    return rows.sort((a, b) => {
      const byName = a.food.name.localeCompare(b.food.name, undefined, {
        sensitivity: "base",
      })
      if (byName !== 0) {
        return byName
      }
      return a.exposure.variantKey.localeCompare(b.exposure.variantKey)
    })
  }, [foods])

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
    setExposureEditor({ mode: "closed" })
    setStretchEditor({ mode: "closed" })
    setName("")
    setIconChoice("fromName")
    resetPreferenceFields()
    setEditor({ mode: "create" })
  }

  function openEdit(food: FoodResponse) {
    setExposureEditor({ mode: "closed" })
    setStretchEditor({ mode: "closed" })
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

  function openExposureEditor(foodId?: string) {
    setEditor({ mode: "closed" })
    setStretchEditor({ mode: "closed" })
    const initialId = foodId ?? foods[0]?.id ?? ""
    setExposureFoodId(initialId)
    setExposureVariant("")
    setExposureFamiliarity("safe")
    setExposureEditor({ mode: "open", foodId: initialId })
  }

  function closeExposureEditor() {
    setExposureEditor({ mode: "closed" })
  }

  function openStretchEditor() {
    setEditor({ mode: "closed" })
    setExposureEditor({ mode: "closed" })
    setStretchAddMode("existing")
    setStretchFoodId(tastingEligible[0]?.id ?? "")
    setStretchName("")
    setStretchVariant("")
    setStretchEditor({ mode: "open" })
  }

  function closeStretchEditor() {
    setStretchEditor({ mode: "closed" })
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

  async function onSaveExposure(event: FormEvent) {
    event.preventDefault()
    if (!exposureFoodId) {
      return
    }
    setStatus({ kind: "saving" })
    try {
      const upserted = await client.upsertExposure(exposureFoodId, {
        variantKey: exposureVariant,
        familiarity: exposureFamiliarity,
      })
      setFoods((current) => mergeExposureIntoFoods(current, upserted))
      setExposureEditor({ mode: "closed" })
      setStatus({ kind: "ready" })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save exposure"
      if (isUnauthorizedMessage(message)) {
        onUnauthorizedRef.current?.()
        return
      }
      setStatus({ kind: "error", message })
    }
  }

  async function onClearExposure(foodId: string, variantKey: string) {
    setStatus({ kind: "saving" })
    try {
      await client.clearExposure(foodId, variantKey)
      setFoods((current) =>
        removeExposureFromFoods(current, foodId, variantKey),
      )
      setStatus({ kind: "ready" })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not clear exposure"
      if (isUnauthorizedMessage(message)) {
        onUnauthorizedRef.current?.()
        return
      }
      setStatus({ kind: "error", message })
    }
  }

  async function onSaveStretchTarget(event: FormEvent) {
    event.preventDefault()
    if (stretchAddMode === "existing" && !stretchFoodId) {
      return
    }
    if (stretchAddMode === "invent" && stretchName.trim() === "") {
      return
    }
    setStatus({ kind: "saving" })
    try {
      const created = await client.addStretchTarget(
        stretchAddMode === "existing"
          ? { foodId: stretchFoodId, variantKey: stretchVariant }
          : { name: stretchName.trim(), variantKey: stretchVariant },
      )
      setStretchTargets((current) =>
        [...current, created].sort((a, b) => {
          const byName = a.foodName.localeCompare(b.foodName, undefined, {
            sensitivity: "base",
          })
          if (byName !== 0) {
            return byName
          }
          return a.variantKey.localeCompare(b.variantKey)
        }),
      )
      // Invent may have created a new tasting food — refresh list so it appears.
      if (stretchAddMode === "invent") {
        const listed = await client.list()
        setFoods(listed)
      }
      setStretchEditor({ mode: "closed" })
      setStatus({ kind: "ready" })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not add stretch target"
      if (isUnauthorizedMessage(message)) {
        onUnauthorizedRef.current?.()
        return
      }
      setStatus({ kind: "error", message })
    }
  }

  async function onRemoveStretchTarget(foodId: string, variantKey: string) {
    setStatus({ kind: "saving" })
    try {
      await client.removeStretchTarget(foodId, variantKey)
      const key = normalizeVariantKey(variantKey)
      setStretchTargets((current) =>
        current.filter(
          (row) => !(row.foodId === foodId && row.variantKey === key),
        ),
      )
      setStatus({ kind: "ready" })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not remove stretch target"
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
            Starter library, tasting foods, snacks, known safes, and stretch
            targets for Suggest.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => openStretchEditor()}
            disabled={
              status.kind === "loading" ||
              status.kind === "saving" ||
              stretchTargets.length >= STRETCH_TARGETS_MAX
            }
          >
            Add stretch target
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => openExposureEditor()}
            disabled={
              status.kind === "loading" ||
              status.kind === "saving" ||
              foods.length === 0
            }
          >
            Add exposure
          </Button>
          <Button
            type="button"
            onClick={openCreate}
            disabled={status.kind === "loading" || status.kind === "saving"}
          >
            Add food
          </Button>
        </div>
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

      {exposureEditor.mode === "open" ? (
        <form
          className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4"
          onSubmit={(event) => void onSaveExposure(event)}
          aria-label="Add or edit exposure"
        >
          <p className="text-sm text-muted-foreground">
            Mark how familiar a food presentation is (brand or prep). Starters
            keep their catalog row; this only saves a household overlay.
          </p>
          <div className="flex flex-col gap-1">
            <label htmlFor="exposure-food" className="text-sm font-medium">
              Food
            </label>
            <select
              id="exposure-food"
              aria-label="Exposure food"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={exposureFoodId}
              onChange={(event) => setExposureFoodId(event.target.value)}
              disabled={status.kind === "saving"}
              required
            >
              {foods.map((food) => (
                <option key={food.id} value={food.id}>
                  {food.name}
                  {food.system ? " (starter)" : ""}
                  {food.sessionEligible === false ? " (snack)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="exposure-variant" className="text-sm font-medium">
              Brand / prep note
            </label>
            <Input
              id="exposure-variant"
              aria-label="Brand / prep note"
              value={exposureVariant}
              onChange={(event) => setExposureVariant(event.target.value)}
              placeholder="e.g. Bagelsaurus (optional)"
              maxLength={200}
              disabled={status.kind === "saving"}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank for unspecified. Matching is case-insensitive.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="exposure-familiarity"
              className="text-sm font-medium"
            >
              Familiarity
            </label>
            <select
              id="exposure-familiarity"
              aria-label="Exposure familiarity"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={exposureFamiliarity}
              onChange={(event) =>
                setExposureFamiliarity(event.target.value as Familiarity)
              }
              disabled={status.kind === "saving"}
            >
              {FAMILIARITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={status.kind === "saving"}>
              {status.kind === "saving" ? "Saving…" : "Save exposure"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeExposureEditor}
              disabled={status.kind === "saving"}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {stretchEditor.mode === "open" ? (
        <form
          className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4"
          onSubmit={(event) => void onSaveStretchTarget(event)}
          aria-label="Add stretch target"
        >
          <p className="text-sm text-muted-foreground">
            Nominate a someday stretch food. Suggest will steer toward intermediate
            steps, then the destination when pace allows (Approve still required).
            At most {STRETCH_TARGETS_MAX} active targets.
          </p>
          <fieldset className="flex flex-col gap-2" disabled={status.kind === "saving"}>
            <legend className="text-sm font-medium">How to add</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="stretch-add-mode"
                checked={stretchAddMode === "existing"}
                onChange={() => setStretchAddMode("existing")}
              />
              Pick from tasting foods
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="stretch-add-mode"
                checked={stretchAddMode === "invent"}
                onChange={() => setStretchAddMode("invent")}
              />
              Invent a new food name
            </label>
          </fieldset>
          {stretchAddMode === "existing" ? (
            <div className="flex flex-col gap-1">
              <label htmlFor="stretch-food" className="text-sm font-medium">
                Food
              </label>
              <select
                id="stretch-food"
                aria-label="Stretch target food"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={stretchFoodId}
                onChange={(event) => setStretchFoodId(event.target.value)}
                disabled={status.kind === "saving"}
                required
              >
                {tastingEligible.length === 0 ? (
                  <option value="">No tasting foods yet</option>
                ) : (
                  tastingEligible.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name}
                      {food.system ? " (starter)" : ""}
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label htmlFor="stretch-name" className="text-sm font-medium">
                Food name
              </label>
              <Input
                id="stretch-name"
                aria-label="Stretch target name"
                value={stretchName}
                onChange={(event) => setStretchName(event.target.value)}
                placeholder="e.g. Ground beef"
                maxLength={200}
                required
                disabled={status.kind === "saving"}
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="stretch-variant" className="text-sm font-medium">
              Brand / prep note
            </label>
            <Input
              id="stretch-variant"
              aria-label="Stretch brand / prep note"
              value={stretchVariant}
              onChange={(event) => setStretchVariant(event.target.value)}
              placeholder="e.g. taco night (optional)"
              maxLength={200}
              disabled={status.kind === "saving"}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={status.kind === "saving"}>
              {status.kind === "saving" ? "Saving…" : "Save stretch target"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeStretchEditor}
              disabled={status.kind === "saving"}
            >
              Cancel
            </Button>
          </div>
        </form>
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
                Listed snacks count as safe exposures.
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

      <section
        className="flex flex-col gap-3"
        aria-labelledby="known-safes-heading"
      >
        <h3
          id="known-safes-heading"
          className="text-sm font-medium uppercase tracking-wide text-muted-foreground"
        >
          Known safes
        </h3>
        {knownSafes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No safe presentations yet. Add an exposure or mark a snack.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {knownSafes.map(({ food, exposure }) => (
              <li
                key={`${food.id}:${exposure.variantKey}`}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 py-2 last:border-b-0"
              >
                <div>
                  <p className="text-sm font-medium">{food.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {variantLabel(exposure.variantKey)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Clear safe ${food.name} ${variantLabel(exposure.variantKey)}`}
                  onClick={() =>
                    void onClearExposure(food.id, exposure.variantKey)
                  }
                  disabled={status.kind === "saving"}
                >
                  Clear safe
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="flex flex-col gap-3"
        aria-labelledby="stretch-targets-heading"
      >
        <h3
          id="stretch-targets-heading"
          className="text-sm font-medium uppercase tracking-wide text-muted-foreground"
        >
          Stretch targets
        </h3>
        {stretchTargets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No stretch destinations yet. Add one so Suggest can pace toward it.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {stretchTargets.map((target) => (
              <li
                key={`${target.foodId}:${target.variantKey}`}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 py-2 last:border-b-0"
              >
                <div>
                  <p className="text-sm font-medium">{target.foodName}</p>
                  <p className="text-xs text-muted-foreground">
                    {variantLabel(target.variantKey)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Remove stretch ${target.foodName} ${variantLabel(target.variantKey)}`}
                  onClick={() =>
                    void onRemoveStretchTarget(target.foodId, target.variantKey)
                  }
                  disabled={status.kind === "saving"}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FoodSection
        title="Starter foods"
        foods={starters}
        onMarkPresentation={(food) => openExposureEditor(food.id)}
        busy={status.kind === "saving"}
      />

      <FoodSection
        title="Tasting foods"
        foods={tastingMine}
        empty="No tasting foods yet. Add one to get started."
        onEdit={openEdit}
        onArchive={(food) => void onArchive(food)}
        onMarkPresentation={(food) => openExposureEditor(food.id)}
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
  onMarkPresentation?: (food: FoodResponse) => void
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

function exposureSummary(food: FoodResponse): string | null {
  const rows = food.exposures ?? []
  if (rows.length === 0) {
    return null
  }
  return rows
    .map(
      (row) =>
        `${variantLabel(row.variantKey)} · ${FAMILIARITY_LABELS[row.familiarity]}`,
    )
    .join("; ")
}

function FoodSection({
  title,
  foods,
  empty,
  onEdit,
  onArchive,
  onMarkPresentation,
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
            const exposures = showSnackDetails
              ? null
              : exposureSummary(food)
            return (
              <li
                key={food.id}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center"
              >
                <div className="size-20 sm:size-24">
                  <FoodIcon
                    iconKey={food.iconKey}
                    iconUrl={food.iconUrl}
                    name={food.name}
                  />
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
                {exposures ? (
                  <p className="text-xs text-muted-foreground">{exposures}</p>
                ) : null}
                <div className="flex flex-wrap justify-center gap-2">
                  {onMarkPresentation ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkPresentation(food)}
                      disabled={busy}
                    >
                      Set familiarity
                    </Button>
                  ) : null}
                  {onEdit && onArchive ? (
                    <>
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
                    </>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
