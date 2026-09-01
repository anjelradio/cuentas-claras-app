import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import type { ExpenseSummary } from "@/app/expenses/_types/expense"
import { ExpensesList } from "./expenses-list"

vi.mock("@/app/expenses/_services/expense-api", () => ({
  ExpenseApi: {
    listEventExpenses: vi.fn().mockResolvedValue([]),
  },
}))

describe("ExpensesList", () => {
  const mockExpenses: ExpenseSummary[] = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      event_id: "22222222-2222-2222-2222-222222222222",
      name: "Cena de bienvenida",
      description: "Parrilla",
      amount: "150.00",
      category: "food",
      split_type: "equal",
      expense_date: "2026-08-18T12:00:00Z",
      paid_by_member_id: "33333333-3333-3333-3333-333333333333",
      paid_by_member_name: "Ana López",
      has_receipt: true,
      created_at: "2026-08-18T12:00:00Z",
    },
  ]

  it("renderiza los gastos iniciales y filtros", () => {
    render(<ExpensesList eventId="22222222-2222-2222-2222-222222222222" initialExpenses={mockExpenses} />)

    expect(screen.getByRole("tab", { name: "Todos" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Mis gastos" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Gastos de otros" })).toBeInTheDocument()

    expect(screen.getByText("Cena de bienvenida")).toBeInTheDocument()
    expect(screen.getByText("Bs. 150.00")).toBeInTheDocument()
    expect(screen.getByText("Ana López")).toBeInTheDocument()
  })

  it("muestra estado vacío cuando no hay gastos", () => {
    render(<ExpensesList eventId="22222222-2222-2222-2222-222222222222" initialExpenses={[]} />)

    expect(screen.getByText("No hay gastos en este filtro")).toBeInTheDocument()
  })

  it("cambia de filtro al hacer click en 'Mis gastos'", async () => {
    const user = userEvent.setup()
    render(<ExpensesList eventId="22222222-2222-2222-2222-222222222222" initialExpenses={mockExpenses} />)

    const mineTab = screen.getByRole("tab", { name: "Mis gastos" })
    await user.click(mineTab)

    expect(mineTab).toHaveAttribute("aria-selected", "true")
  })
})
