import { describe, expect, it, vi } from "vitest"

const { getSessionCookie } = vi.hoisted(() => ({ getSessionCookie: vi.fn<() => string | null>(() => null) }))

vi.mock("better-auth/cookies", () => ({ getSessionCookie }))

import { NextRequest } from "next/server"
import { proxy } from "@/proxy"

describe("protección de rutas", () => {
  it("redirige una solicitud sin cookie a login", () => {
    const response = proxy(new NextRequest("http://localhost:3000/"))
    expect(response.headers.get("location")).toBe("http://localhost:3000/auth/login")
  })

  it("redirige una sesión existente fuera de auth", () => {
    getSessionCookie.mockReturnValueOnce("session")
    const response = proxy(new NextRequest("http://localhost:3000/auth/login"))
    expect(response.headers.get("location")).toBe("http://localhost:3000/")
  })
})
