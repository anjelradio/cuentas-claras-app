import { describe, expect, it } from "vitest"

import { formatEventDate } from "./format-event-date"

describe("formatEventDate", () => {
  it("formatea la fecha en español sin desfase de zona horaria", () => {
    expect(formatEventDate("2025-11-05T00:00:00.000Z")).toBe("5 de noviembre de 2025")
  })
})
