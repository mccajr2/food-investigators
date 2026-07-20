import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AuthClient, FoodsClient, SessionsClient } from "@/api"
import { AuthShell } from "@/components/AuthShell"

afterEach(() => {
  vi.restoreAllMocks()
})

function mockFoodsClient(
  overrides: Partial<FoodsClient> = {},
): FoodsClient {
  return {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    ...overrides,
  } as FoodsClient
}

function mockSessionsClient(
  overrides: Partial<SessionsClient> = {},
): SessionsClient {
  return {
    listUpcoming: vi.fn().mockResolvedValue([]),
    listHistory: vi.fn().mockResolvedValue([]),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
    complete: vi.fn(),
    ...overrides,
  } as SessionsClient
}

function mockClient(
  overrides: Partial<AuthClient> = {},
): AuthClient {
  return {
    getStoredToken: () => null,
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    ...overrides,
  } as AuthClient
}

function renderShell(
  authOverrides: Partial<AuthClient> = {},
  foodsOverrides: Partial<FoodsClient> = {},
  sessionsOverrides: Partial<SessionsClient> = {},
) {
  return render(
    <AuthShell
      client={mockClient(authOverrides)}
      foodsClient={mockFoodsClient(foodsOverrides)}
      sessionsClient={mockSessionsClient(sessionsOverrides)}
    />,
  )
}

describe("AuthShell", () => {
  it("signs in and shows plan by default with foods navigation", async () => {
    const user = userEvent.setup()
    const login = vi.fn().mockResolvedValue({
      token: "tok",
      user: {
        id: "11111111-1111-1111-1111-111111111111",
        email: "parent@example.com",
        householdId: "22222222-2222-2222-2222-222222222222",
      },
    })

    renderShell({ login })

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Sign in" }),
      ).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText("Email"), "parent@example.com")
    await user.type(screen.getByLabelText("Password"), "password1")
    expect(screen.getByLabelText("Keep me logged in")).toBeChecked()
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByText("Signed in as parent@example.com")).toBeInTheDocument()
    expect(await screen.findByRole("heading", { name: "Plan" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Plan" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(login).toHaveBeenCalledWith("parent@example.com", "password1", true)

    await user.click(screen.getByRole("tab", { name: "Foods" }))
    expect(await screen.findByRole("heading", { name: "Foods" })).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "History" }))
    expect(await screen.findByRole("heading", { name: "History" })).toBeInTheDocument()
  })

  it("registers with keep-me-logged-in unchecked", async () => {
    const user = userEvent.setup()
    const register = vi.fn().mockResolvedValue({
      token: "tok",
      user: {
        id: "11111111-1111-1111-1111-111111111111",
        email: "new@example.com",
        householdId: "22222222-2222-2222-2222-222222222222",
      },
    })

    renderShell({ register })

    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: "Create account" }),
      ).toBeInTheDocument()
    })

    await user.click(screen.getByRole("tab", { name: "Create account" }))
    await user.type(screen.getByLabelText("Email"), "new@example.com")
    await user.type(screen.getByLabelText("Password"), "password1")
    await user.click(screen.getByLabelText("Keep me logged in"))
    await user.click(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("Signed in as new@example.com")).toBeInTheDocument()
    expect(register).toHaveBeenCalledWith("new@example.com", "password1", false)
  })

  it("shows API errors", async () => {
    const user = userEvent.setup()
    const login = vi.fn().mockRejectedValue(new Error("Invalid email or password"))

    renderShell({ login })

    await waitFor(() => {
      expect(screen.getByLabelText("Email")).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText("Email"), "parent@example.com")
    await user.type(screen.getByLabelText("Password"), "wrong-password")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password",
    )
  })

  it("restores a stored session via me()", async () => {
    const me = vi.fn().mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      email: "saved@example.com",
      householdId: "22222222-2222-2222-2222-222222222222",
    })

    const list = vi.fn().mockResolvedValue([])
    const listUpcoming = vi.fn().mockResolvedValue([])
    renderShell(
      {
        getStoredToken: () => "existing",
        me,
      },
      { list },
      { listUpcoming },
    )

    expect(
      await screen.findByText("Signed in as saved@example.com"),
    ).toBeInTheDocument()
    expect(await screen.findByRole("heading", { name: "Plan" })).toBeInTheDocument()
    expect(me).toHaveBeenCalledOnce()
    expect(listUpcoming).toHaveBeenCalledOnce()
    expect(list).toHaveBeenCalledOnce()
  })

  it("does not reload plan data in a loop with default clients", async () => {
    const listSpy = vi
      .spyOn(FoodsClient.prototype, "list")
      .mockResolvedValue([])
    const listUpcomingSpy = vi
      .spyOn(SessionsClient.prototype, "listUpcoming")
      .mockResolvedValue([])
    const meSpy = vi.spyOn(AuthClient.prototype, "me").mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      email: "saved@example.com",
      householdId: "22222222-2222-2222-2222-222222222222",
    })
    vi.spyOn(AuthClient.prototype, "getStoredToken").mockReturnValue("existing")

    render(<AuthShell />)

    expect(
      await screen.findByText("Signed in as saved@example.com"),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(listUpcomingSpy).toHaveBeenCalled()
      expect(listSpy).toHaveBeenCalled()
    })

    const listCalls = listSpy.mock.calls.length
    const upcomingCalls = listUpcomingSpy.mock.calls.length
    const meCalls = meSpy.mock.calls.length
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(listSpy).toHaveBeenCalledTimes(listCalls)
    expect(listUpcomingSpy).toHaveBeenCalledTimes(upcomingCalls)
    expect(meSpy).toHaveBeenCalledTimes(meCalls)
    expect(listCalls).toBeLessThanOrEqual(2)
    expect(upcomingCalls).toBeLessThanOrEqual(2)
    expect(meCalls).toBeLessThanOrEqual(2)
  })
})
