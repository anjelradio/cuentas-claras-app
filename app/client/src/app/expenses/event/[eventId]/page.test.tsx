import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { ExpenseSummary } from "@/app/expenses/_types/expense"
import { ExpensesList } from "./_components/expenses-list"

vi.mock("@/app/expenses/_services/expense-api", () => ({
  ExpenseApi: {
    listEventExpenses: vi.fn().mockResolvedValue([]),
  },
}))

describe("ExpensesListPage", () => {
  const mockExpenses: ExpenseSummary[] = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      event_id: "demo-event",
      name: "Cena en el puerto",
      description: "Cena compartida",
      amount: "360.00",
      refund_amount: "240.00",
      payer_contribution: "120.00",
      payer_participated: true,
      category: "food",
      split_type: "equal",
      expense_date: "2026-08-18T12:00:00Z",
      paid_by_member_id: "member-1",
      paid_by_member_name: "Ana López",
      has_receipt: false,
      created_at: "2026-08-18T12:00:00Z",
    },
  ]

  it("renderiza gastos y tabs de filtrado", () => {
    render(<ExpensesList eventId="demo-event" initialExpenses={mockExpenses} />)

    expect(screen.getByText("Cena en el puerto")).toBeInTheDocument()
    expect(screen.getByText("Bs. 360.00")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Todos" })).toHaveAttribute("aria-selected", "true")
  })

  it("permite cambiar a la pestaña 'Mis gastos'", async () => {
    const user = userEvent.setup()
    render(<ExpensesList eventId="demo-event" initialExpenses={mockExpenses} />)

    const mineTab = screen.getByRole("tab", { name: "Mis gastos" })
    await user.click(mineTab)
    expect(mineTab).toHaveAttribute("aria-selected", "true")
  })
})
