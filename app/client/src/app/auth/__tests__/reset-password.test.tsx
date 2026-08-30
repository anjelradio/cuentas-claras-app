import { describe, expect, it } from "vitest"

import { resetPasswordSchema } from "@/app/auth/auth-schemas"
import { getAuthErrorMessage } from "@/lib/auth-errors"

describe("restablecimiento de contraseña", () => {
  it("solo admite contraseñas que cumplen la política", () => {
    expect(resetPasswordSchema.safeParse({ password: "solo-letras-largas" }).success).toBe(false)
    expect(resetPasswordSchema.safeParse({ password: "válida-contraseña-12" }).success).toBe(true)
  })

  it("traduce enlaces inválidos, expirados o reutilizados", () => {
    expect(getAuthErrorMessage({ code: "TOKEN_EXPIRED" })).toContain("enlace")
  })
})
