import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { toast } from "sonner"

import { forgotPasswordSchema } from "@/app/auth/auth-schemas"
import ForgotPasswordPage from "@/app/auth/forgot-password/page"
import { authClient } from "@/lib/auth-client"

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    requestPasswordReset: vi.fn(),
  },
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

describe("solicitud de recuperación", () => {
  it("acepta una dirección válida sin modelar la existencia de una cuenta", () => {
    expect(forgotPasswordSchema.safeParse({ email: "persona@ejemplo.com" }).success).toBe(true)
  })

  it("rechaza solo el formato inválido", () => {
    expect(forgotPasswordSchema.safeParse({ email: "incorrecto" }).success).toBe(false)
  })

  it("presenta un mensaje de éxito público idéntico tanto para éxito como para error del cliente", async () => {
    // Simula éxito del backend
    vi.mocked(authClient.requestPasswordReset).mockResolvedValueOnce({ data: null, error: null })
    const user = userEvent.setup()
    
    const { unmount } = render(<ForgotPasswordPage />)
    await user.type(screen.getByLabelText(/correo/i), "existe@ejemplo.com")
    await user.click(screen.getByRole("button", { name: /enviar/i }))
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Si existe una cuenta asociada, recibirás instrucciones para continuar.")
      )
    })
    unmount()
    
    vi.clearAllMocks() // Clear mocks before second flow

    // Simula error del backend (correo no existente u otro error que Better Auth pudiera reportar)
    vi.mocked(authClient.requestPasswordReset).mockResolvedValueOnce({ 
      data: null, 
      error: { status: 400, code: "USER_NOT_FOUND", message: "User not found" } 
    })
    
    render(<ForgotPasswordPage />)
    await user.type(screen.getByLabelText(/correo/i), "no-existe@ejemplo.com")
    await user.click(screen.getByRole("button", { name: /enviar/i }))
    
    await waitFor(() => {
      // El mensaje público debe ser idéntico al del caso de éxito, 
      // evitando enumeración de cuentas.
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Si existe una cuenta asociada, recibirás instrucciones para continuar.")
      )
    })
  })
})
