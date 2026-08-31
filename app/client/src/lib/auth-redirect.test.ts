import { describe, expect, it } from "vitest"

import { buildJoinPath, buildLoginPath } from "@/lib/auth-redirect"

describe("auth redirect paths", () => {
  it("codifica el token al construir la ruta de invitación", () => {
    expect(buildJoinPath("token+/=")).toBe("/join?redirect=token%2B%2F%3D")
  })

  it("no convierte el parámetro en una redirección abierta", () => {
    expect(buildJoinPath("https://example.com/path")).toBe(
      "/join?redirect=https%3A%2F%2Fexample.com%2Fpath",
    )
  })

  it("conserva el token junto con el error de OAuth", () => {
    expect(buildLoginPath("invite-token", "access_denied")).toBe(
      "/auth/login?redirect=invite-token&error=access_denied",
    )
  })
})
