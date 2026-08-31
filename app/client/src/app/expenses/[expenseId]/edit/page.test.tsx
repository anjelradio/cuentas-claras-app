import { describe, expect, it } from "vitest"

import { getExpenseById } from "@/app/expenses/_types/expense-demo"

describe("ruta de edición de gastos", () => {
  it("resuelve valores iniciales desde el gasto demo", () => {
    expect(getExpenseById("cena-puerto")?.amount).toBe("Bs. 360.00")
  })
})
