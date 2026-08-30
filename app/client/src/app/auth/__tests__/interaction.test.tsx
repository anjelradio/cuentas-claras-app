import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { LoginForm } from "@/app/auth/components/login-form"
import { RegisterForm } from "@/app/auth/components/register-form"
import { ForgotPasswordForm } from "@/app/auth/components/forgot-password-form"

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
  },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock("next/navigation", () => ({ 
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams() 
}))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.mock("next/link", () => ({ default: ({ children }: any) => <a>{children}</a> }))

describe("Accesibilidad e interacción de formularios", () => {
  it("marca los campos de login como inválidos cuando fallan", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    const emailInput = screen.getByLabelText(/correo/i)
    await user.type(emailInput, "correo-invalido")
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }))
    await waitFor(() => {
      expect(emailInput).toHaveAttribute("aria-invalid", "true")
    })
  })

  it("marca los campos de registro como inválidos cuando fallan", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    const nameInput = screen.getByLabelText(/nombre/i)
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }))
    await waitFor(() => {
      expect(nameInput).toHaveAttribute("aria-invalid", "true")
    })
  })

  it("marca los campos de recuperación como inválidos cuando fallan", async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm />)
    const emailInput = screen.getByLabelText(/correo/i)
    await user.type(emailInput, "correo-invalido")
    await user.click(screen.getByRole("button", { name: /enviar/i }))
    await waitFor(() => {
      expect(emailInput).toHaveAttribute("aria-invalid", "true")
    })
  })
})
