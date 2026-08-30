import { describe, expect, it, vi } from "vitest"

const { FakePool } = vi.hoisted(() => {
  class FakePool {
    query = vi.fn()
    connect = vi.fn()
    on = vi.fn()
    end = vi.fn()
  }
  return { FakePool }
})

vi.mock("server-only", () => ({}))
vi.mock("next/server", () => ({ after: vi.fn() }))
vi.mock("pg", () => ({ Pool: FakePool }))

import { auth } from "@/lib/auth"

describe("JWT Plugin", () => {
  it("está configurado en la instancia de better-auth", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jwtPlugin = (auth.options.plugins as any[])?.find((p: any) => p.id === "jwt")
    expect(jwtPlugin).toBeDefined()
  })

  // The code we wrote explicitly drops `audience` if not present.
  // The test asserts that the plugin was successfully registered.
})
