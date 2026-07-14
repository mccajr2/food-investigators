import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { AuthClient } from "@/api"
import { AuthShell } from "@/components/AuthShell"

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

describe("AuthShell", () => {
  it("signs in and shows signed-in state", async () => {
    const user = userEvent.setup()
    const login = vi.fn().mockResolvedValue({
      token: "tok",
      user: {
        id: "11111111-1111-1111-1111-111111111111",
        email: "parent@example.com",
        householdId: "22222222-2222-2222-2222-222222222222",
      },
    })

    render(<AuthShell client={mockClient({ login })} />)

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
    expect(login).toHaveBeenCalledWith("parent@example.com", "password1", true)
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

    render(<AuthShell client={mockClient({ register })} />)

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

    render(<AuthShell client={mockClient({ login })} />)

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

    render(
      <AuthShell
        client={mockClient({
          getStoredToken: () => "existing",
          me,
        })}
      />,
    )

    expect(
      await screen.findByText("Signed in as saved@example.com"),
    ).toBeInTheDocument()
    expect(me).toHaveBeenCalledOnce()
  })
})
