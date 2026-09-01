import { describe, expect, it } from "vitest"
import { EXPENSE_CATEGORIES } from "./expense"

describe("categorías de gastos", () => {
  it("contiene las 6 categorías canónicas con etiquetas y emojis", () => {
    expect(EXPENSE_CATEGORIES).toHaveLength(6)
    const ids = EXPENSE_CATEGORIES.map((c) => c.id)
    expect(ids).toEqual(["food", "lodging", "transport", "shopping", "entertainment", "other"])
  })
})
