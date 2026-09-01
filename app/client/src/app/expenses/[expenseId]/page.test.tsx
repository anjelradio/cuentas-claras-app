import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { ExpenseDetail } from "@/app/expenses/_types/expense"
import { ExpenseDetailView } from "./_components/expense-detail-view"

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock("@/app/expenses/_services/expense-api", () => ({
  ExpenseApi: {
    deleteExpense: vi.fn().mockResolvedValue(undefined),
  },
}))

describe("ExpenseDetailView", () => {
  const mockExpense: ExpenseDetail = {
    id: "11111111-1111-1111-1111-111111111111",
    event_id: "22222222-2222-2222-2222-222222222222",
    name: "Cena en el puerto",
    description: "Mariscos frescos",
    amount: "120.00",
    category: "food",
    split_type: "equal",
    expense_date: "2026-08-18T12:00:00Z",
    receipt_url: null,
    created_by_member_id: "33333333-3333-3333-3333-333333333333",
    created_by_member_name: "Ana López",
    paid_by_member_id: "33333333-3333-3333-3333-333333333333",
    paid_by_member_name: "Ana López",
    created_at: "2026-08-18T12:00:00Z",
    updated_at: "2026-08-18T12:00:00Z",
    splits: [
      {
        id: "44444444-4444-4444-4444-444444444444",
        member_id: "33333333-3333-3333-3333-333333333333",
        member_name: "Ana López",
        assigned_amount: "60.00",
      },
      {
        id: "55555555-5555-5555-5555-555555555555",
        member_id: "66666666-6666-6666-6666-666666666666",
        member_name: "Carlos Ruiz",
        assigned_amount: "60.00",
      },
    ],
  }

  it("renderiza información detallada del gasto y participantes", () => {
    render(<ExpenseDetailView eventId="22222222-2222-2222-2222-222222222222" expense={mockExpense} />)

    expect(screen.getByRole("heading", { name: "Cena en el puerto" })).toBeInTheDocument()
    expect(screen.getByText("Mariscos frescos")).toBeInTheDocument()
    expect(screen.getAllByText("Ana López").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Carlos Ruiz")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Anular gasto/i })).toBeInTheDocument()
  })

  it("abre diálogo de confirmación al hacer click en anular gasto", async () => {
    const user = userEvent.setup()
    render(<ExpenseDetailView eventId="22222222-2222-2222-2222-222222222222" expense={mockExpense} />)

    await user.click(screen.getByRole("button", { name: /Anular gasto/i }))
    expect(screen.getByText("¿Anular gasto?")).toBeInTheDocument()
  })
})
