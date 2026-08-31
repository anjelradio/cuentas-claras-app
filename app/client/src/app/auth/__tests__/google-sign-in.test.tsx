import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GoogleSignInButton } from "@/app/auth/components/google-sign-in-button"

const { socialSignIn } = vi.hoisted(() => ({
  socialSignIn: vi.fn(),
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: { signIn: { social: socialSignIn } },
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("redirect=invite-token"),
}))

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }))

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    socialSignIn.mockReset()
    socialSignIn.mockResolvedValue({ data: null, error: null })
  })

  it("conserva la invitación en los callbacks de éxito y error", async () => {
    const user = userEvent.setup()
    render(<GoogleSignInButton />)

    await user.click(screen.getByRole("button", { name: /continuar con google/i }))

    await waitFor(() => {
      expect(socialSignIn).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "/join?redirect=invite-token",
        errorCallbackURL: "/auth/login?redirect=invite-token",
      })
    })
  })
})
