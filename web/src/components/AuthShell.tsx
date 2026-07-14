import { useEffect, useState, type FormEvent } from "react"

import { AuthClient } from "@/api"
import type { UserResponse } from "@/api/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type AuthMode = "sign-in" | "register"

type Status =
  | { kind: "idle" }
  | { kind: "bootstrapping" }
  | { kind: "loading" }
  | { kind: "error"; message: string }

type AuthShellProps = {
  client?: AuthClient
}

export function AuthShell({ client = new AuthClient() }: AuthShellProps) {
  const [mode, setMode] = useState<AuthMode>("sign-in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [user, setUser] = useState<UserResponse | null>(null)
  const [status, setStatus] = useState<Status>({ kind: "bootstrapping" })

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
          ? await client.register(email.trim(), password, rememberMe)
          : await client.login(email.trim(), password, rememberMe)
      setUser(auth.user)
      setPassword("")
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
      setStatus({ kind: "idle" })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong"
      setStatus({ kind: "error", message })
    }
  }

  if (status.kind === "bootstrapping") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>quickapp</CardTitle>
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
      <Card>
        <CardHeader>
          <CardTitle>quickapp</CardTitle>
          <CardDescription>Family account</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p role="status" className="text-sm text-foreground">
            Signed in as {user.email}
          </p>
          {status.kind === "error" ? (
            <p role="alert" className="text-sm text-destructive">
              {status.message}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => void onSignOut()}
            disabled={status.kind === "loading"}
          >
            {status.kind === "loading" ? "Signing out…" : "Sign out"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>quickapp</CardTitle>
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
