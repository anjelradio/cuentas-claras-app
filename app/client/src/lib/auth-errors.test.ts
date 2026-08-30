import { describe, expect, it } from "vitest"

import { getAuthErrorMessage } from "@/lib/auth-errors"

describe("getAuthErrorMessage", () => {
  it("traduce fallos conocidos sin devolver información técnica", () => {
    expect(getAuthErrorMessage({ code: "EMAIL_NOT_VERIFIED" })).toContain("todavía no está verificado")
    expect(getAuthErrorMessage({ code: "INVALID_TOKEN" })).toContain("enlace")
    expect(getAuthErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).not.toContain("INVALID_EMAIL")
  })
})
