import { describe, expect, it } from "vitest"

import { getAuthErrorMessage } from "@/lib/auth-errors"

describe("verificación de correo", () => {
  it.each(["INVALID_TOKEN", "TOKEN_EXPIRED", "TOKEN_USED"])("informa un enlace %s sin exponerlo", (code) => {
    const message = getAuthErrorMessage({ code })
    expect(message).toContain("enlace")
    expect(message).not.toContain("ey")
  })
})
