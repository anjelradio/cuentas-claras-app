import { describe, expect, it } from "vitest"

import { loginSchema } from "@/app/auth/auth-schemas"
import { getAuthErrorMessage } from "@/lib/auth-errors"

describe("inicio de sesión", () => {
  it("valida credenciales antes de enviarlas", () => {
    expect(loginSchema.safeParse({ email: "correo-inválido", password: "" }).success).toBe(false)
  })

  it("mantiene el error de credenciales genérico", () => {
    expect(getAuthErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).toContain("credenciales")
  })

  it("indica la verificación pendiente", () => {
    expect(getAuthErrorMessage({ code: "EMAIL_NOT_VERIFIED" })).toContain("verificado")
  })
})
