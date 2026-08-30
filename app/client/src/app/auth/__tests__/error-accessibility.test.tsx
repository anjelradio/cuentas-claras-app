import { describe, expect, it } from "vitest"

import { getAuthErrorMessage } from "@/lib/auth-errors"

describe("mensajes seguros de autenticación", () => {
  it("no expone contraseñas, tokens, enlaces ni identificadores internos", () => {
    const messages = [
      getAuthErrorMessage({ code: "INVALID_PASSWORD" }),
      getAuthErrorMessage({ code: "INVALID_TOKEN" }),
      getAuthErrorMessage({ code: "EMAIL_NOT_VERIFIED" }),
    ].join(" ").toLowerCase()

    expect(messages).not.toMatch(/password=|token=|https?:\/\/|user_id/)
  })
})
