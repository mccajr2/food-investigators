import { useCallback, useEffect, useState, type FormEvent } from "react"

import { AuthClient, FoodsClient, InsightsClient, SessionsClient } from "@/api"
import { apiBaseUrl } from "@/config"
import { defaultBrowserTokenStore } from "@/api/tokenStore"
import type { UserResponse } from "@/api/types"
import { BrandLogo } from "@/components/BrandLogo"
import { FoodsPage } from "@/components/food/FoodsPage"
import { HistoryPage } from "@/components/history/HistoryPage"
import { InsightsPage } from "@/components/insights/InsightsPage"
import { PlanPage } from "@/components/plan/PlanPage"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type AuthMode = "sign-in" | "register"
type SignedInView = "plan" | "history" | "foods" | "insights"

type Status =
  | { kind: "idle" }
  | { kind: "bootstrapping" }
  | { kind: "loading" }
  | { kind: "error"; message: string }

type AuthShellProps = {
  client?: AuthClient
  foodsClient?: FoodsClient
  sessionsClient?: SessionsClient
  insightsClient?: InsightsClient
}

const CHILD_NAME_MAX = 40

export function AuthShell({
  client: clientProp,
  foodsClient: foodsClientProp,
  sessionsClient: sessionsClientProp,
  insightsClient: insightsClientProp,
}: AuthShellProps) {
  // Create clients once. Share one token store so auth + foods + sessions see
  // the same session.
  const [client] = useState(() => {
    if (clientProp) {
      return clientProp
    }
    return new AuthClient(
      apiBaseUrl,
      globalThis.fetch.bind(globalThis),
      defaultBrowserTokenStore(),
    )
  })
  const [foodsClient] = useState(() => {
    if (foodsClientProp) {
      return foodsClientProp
    }
    return new FoodsClient(
      apiBaseUrl,
      globalThis.fetch.bind(globalThis),
      defaultBrowserTokenStore(),
    )
  })
  const [sessionsClient] = useState(() => {
    if (sessionsClientProp) {
      return sessionsClientProp
    }
    return new SessionsClient(
      apiBaseUrl,
      globalThis.fetch.bind(globalThis),
      defaultBrowserTokenStore(),
    )
  })
  const [insightsClient] = useState(() => {
    if (insightsClientProp) {
      return insightsClientProp
    }
    return new InsightsClient(
      apiBaseUrl,
      globalThis.fetch.bind(globalThis),
      defaultBrowserTokenStore(),
    )
  })
  const [mode, setMode] = useState<AuthMode>("sign-in")
  const [view, setView] = useState<SignedInView>("plan")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [childDisplayName, setChildDisplayName] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [user, setUser] = useState<UserResponse | null>(null)
  const [status, setStatus] = useState<Status>({ kind: "bootstrapping" })
  const [profileNameDraft, setProfileNameDraft] = useState("")
  const [profileStatus, setProfileStatus] = useState<Status>({ kind: "idle" })

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      if (!client.getStoredToken()) {
        if (!cancelled) {
          setStatus({ kind: "idle" })
        }
        return
      }
      try {
        const me = await client.me()
        if (!cancelled) {
          setUser(me)
          setProfileNameDraft(me.childDisplayName ?? "")
          setStatus({ kind: "idle" })
        }
      } catch {
        if (!cancelled) {
          setUser(null)
          setStatus({ kind: "idle" })
        }
      }
    }

    void restoreSession()
    return () => {
      cancelled = true
    }
  }, [client])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus({ kind: "loading" })
    try {
      const auth =
        mode === "register"
          ? await client.register(
              email.trim(),
              password,
              rememberMe,
              childDisplayName.trim() || null,
            )
          : await client.login(email.trim(), password, rememberMe)
      setUser(auth.user)
      setProfileNameDraft(auth.user.childDisplayName ?? "")
      setPassword("")
      setChildDisplayName("")
      setStatus({ kind: "idle" })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong"
      setStatus({ kind: "error", message })
    }
  }

  async function onSignOut() {
    setStatus({ kind: "loading" })
    try {
      await client.logout()
      setUser(null)
      setProfileNameDraft("")
      setStatus({ kind: "idle" })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong"
      setStatus({ kind: "error", message })
    }
  }

  async function onSaveChildDisplayName() {
    setProfileStatus({ kind: "loading" })
    try {
      const trimmed = profileNameDraft.trim()
      const updated = await client.updateMe(trimmed.length > 0 ? trimmed : null)
      setUser(updated)
      setProfileNameDraft(updated.childDisplayName ?? "")
      setProfileStatus({ kind: "idle" })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong"
      setProfileStatus({ kind: "error", message })
    }
  }

  async function onClearChildDisplayName() {
    setProfileStatus({ kind: "loading" })
    try {
      const updated = await client.updateMe(null)
      setUser(updated)
      setProfileNameDraft("")
      setProfileStatus({ kind: "idle" })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong"
      setProfileStatus({ kind: "error", message })
    }
  }

  const onSessionExpired = useCallback(() => {
    setUser(null)
    setStatus({
      kind: "error",
      message: "Session expired. Please sign in again.",
    })
  }, [])

  if (status.kind === "bootstrapping") {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <BrandLogo variant="full" className="mx-auto max-w-xs" />
          <CardDescription>Checking session…</CardDescription>
        </CardHeader>
        <CardContent>
          <p role="status" className="text-sm text-muted-foreground">
            Loading…
          </p>
        </CardContent>
      </Card>
    )
  }

  if (user) {
    return (
      <div className="flex w-full flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <BrandLogo variant="compact" className="shrink-0" />
            <p role="status" className="mt-1 text-sm text-muted-foreground">
              Signed in as {user.email}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void onSignOut()}
            disabled={status.kind === "loading"}
          >
            {status.kind === "loading" ? "Signing out…" : "Sign out"}
          </Button>
        </header>
        <section
          aria-label="Child display name"
          className="flex flex-col gap-2 rounded-lg border border-border bg-card/40 p-3"
        >
          <label
            htmlFor="signed-in-child-display-name"
            className="text-sm font-medium"
          >
            Child&apos;s first name
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="signed-in-child-display-name"
              aria-label="Child's first name"
              value={profileNameDraft}
              onChange={(event) => setProfileNameDraft(event.target.value)}
              placeholder="Optional"
              maxLength={CHILD_NAME_MAX}
              disabled={profileStatus.kind === "loading"}
              className="max-w-xs"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => void onSaveChildDisplayName()}
              disabled={profileStatus.kind === "loading"}
            >
              {profileStatus.kind === "loading" ? "Saving…" : "Save name"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void onClearChildDisplayName()}
              disabled={
                profileStatus.kind === "loading" || !user.childDisplayName
              }
            >
              Clear
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Used in Plan and Run copy only — not on therapist PDF.
          </p>
          {profileStatus.kind === "error" ? (
            <p role="alert" className="text-sm text-destructive">
              {profileStatus.message}
            </p>
          ) : null}
        </section>
        {status.kind === "error" ? (
          <p role="alert" className="text-sm text-destructive">
            {status.message}
          </p>
        ) : null}
        <nav aria-label="Signed-in sections" className="flex gap-2">
          <Button
            type="button"
            role="tab"
            aria-selected={view === "plan"}
            variant={view === "plan" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("plan")}
          >
            Plan
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={view === "history"}
            variant={view === "history" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("history")}
          >
            History
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={view === "insights"}
            variant={view === "insights" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("insights")}
          >
            Insights
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={view === "foods"}
            variant={view === "foods" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("foods")}
          >
            Foods
          </Button>
        </nav>
        {view === "plan" ? (
          <PlanPage
            sessionsClient={sessionsClient}
            foodsClient={foodsClient}
            childDisplayName={user.childDisplayName}
            onUnauthorized={onSessionExpired}
          />
        ) : null}
        {view === "history" ? (
          <HistoryPage
            sessionsClient={sessionsClient}
            onUnauthorized={onSessionExpired}
          />
        ) : null}
        {view === "insights" ? (
          <InsightsPage
            client={insightsClient}
            onUnauthorized={onSessionExpired}
          />
        ) : null}
        {view === "foods" ? (
          <FoodsPage client={foodsClient} onUnauthorized={onSessionExpired} />
        ) : null}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <BrandLogo variant="full" className="mx-auto max-w-xs sm:max-w-sm" />
        <CardDescription>
          {mode === "sign-in"
            ? "Sign in to plan tasting sessions from your laptop."
            : "Create a parent account for this household."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={(e) => void onSubmit(e)}>
          <div role="tablist" aria-label="Account mode" className="flex gap-2">
            <Button
              type="button"
              role="tab"
              aria-selected={mode === "sign-in"}
              variant={mode === "sign-in" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("sign-in")}
              disabled={status.kind === "loading"}
            >
              Sign in
            </Button>
            <Button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              variant={mode === "register" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("register")}
              disabled={status.kind === "loading"}
            >
              Create account
            </Button>
          </div>

          <Input
            aria-label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            disabled={status.kind === "loading"}
          />
          <Input
            aria-label="Password"
            type="password"
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            minLength={8}
            disabled={status.kind === "loading"}
          />
          {mode === "register" ? (
            <Input
              aria-label="Child's first name"
              type="text"
              autoComplete="off"
              value={childDisplayName}
              onChange={(event) => setChildDisplayName(event.target.value)}
              placeholder="Child's first name (optional)"
              maxLength={CHILD_NAME_MAX}
              disabled={status.kind === "loading"}
            />
          ) : null}

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              disabled={status.kind === "loading"}
            />
            Keep me logged in
          </label>

          {status.kind === "loading" ? (
            <p role="status" className="text-sm text-muted-foreground">
              {mode === "register" ? "Creating account…" : "Signing in…"}
            </p>
          ) : null}

          {status.kind === "error" ? (
            <p role="alert" className="text-sm text-destructive">
              {status.message}
            </p>
          ) : null}

          <Button type="submit" disabled={status.kind === "loading"}>
            {mode === "register" ? "Create account" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
