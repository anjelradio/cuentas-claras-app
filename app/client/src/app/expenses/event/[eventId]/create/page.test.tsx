import { describe, expect, it } from "vitest"

import { getExpensesByFilter } from "@/app/expenses/_types/expense-demo"

describe("ruta de registro de gastos", () => {
  it("puede componerse con el evento demo", () => {
    expect(getExpensesByFilter("demo-event", "all")).not.toHaveLength(0)
  })
})
