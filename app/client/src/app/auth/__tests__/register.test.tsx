import { describe, expect, it } from "vitest"

import { registerSchema } from "@/app/auth/auth-schemas"
import { getAuthErrorMessage } from "@/lib/auth-errors"

describe("registro", () => {
  it("rechaza nombre, correo y contraseña inválidos", () => {
    const parsed = registerSchema.safeParse({ name: "", email: "no-es-correo", password: "corta" })
    expect(parsed.success).toBe(false)
  })

  it("orienta ante un correo que ya existe sin exponer datos adicionales", () => {
    expect(getAuthErrorMessage({ code: "USER_ALREADY_EXISTS" })).toContain("Ya existe una cuenta")
  })
})
