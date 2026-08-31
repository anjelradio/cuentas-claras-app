import { describe, expect, it } from "vitest"

import { getExpenseById, getExpensesByFilter } from "./expense-demo"

describe("datos demo de gastos", () => {
  it("encuentra un gasto demo por su identificador", () => {
    expect(getExpenseById("cena-puerto")?.name).toBe("Cena en el puerto")
    expect(getExpenseById("inexistente")).toBeUndefined()
  })

  it("aplica filtros locales para gastos propios, ajenos y todos", () => {
    expect(getExpensesByFilter("demo-event", "all")).toHaveLength(4)
    expect(getExpensesByFilter("demo-event", "mine")).toHaveLength(1)
    expect(getExpensesByFilter("demo-event", "others")).toHaveLength(3)
  })
})
