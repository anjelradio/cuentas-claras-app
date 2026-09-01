import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ExpenseForm } from "@/app/expenses/_components/expense-form"
import type { ExpenseDetail } from "@/app/expenses/_types/expense"

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

describe("formulario de gastos en modo edición", () => {
  const mockExpense: ExpenseDetail = {
    id: "11111111-1111-1111-1111-111111111111",
    event_id: "22222222-2222-2222-2222-222222222222",
    name: "Hospedaje Cabaña",
    description: "2 noches",
    amount: "400.00",
    refund_amount: "0.00",
    payer_contribution: "400.00",
    payer_participated: true,
    category: "lodging",
    split_type: "equal",
    expense_date: "2026-08-18T12:00:00Z",
    receipt_url: null,
    created_by_member_id: "33333333-3333-3333-3333-333333333333",
    created_by_member_name: "Ana",
    paid_by_member_id: "33333333-3333-3333-3333-333333333333",
    paid_by_member_name: "Ana",
    is_payer: true,
    created_at: "2026-08-18T12:00:00Z",
    updated_at: "2026-08-18T12:00:00Z",
    splits: [],
  }

  const members = [{ id: "33333333-3333-3333-3333-333333333333", name: "Ana" }]

  it("carga los valores iniciales del gasto a editar", () => {
    render(
      <ExpenseForm
        eventId="22222222-2222-2222-2222-222222222222"
        mode="edit"
        expense={mockExpense}
        members={members}
      />
    )

    expect(screen.getByRole("heading", { name: "Editar gasto" })).toBeInTheDocument()
    expect(screen.getByDisplayValue("Hospedaje Cabaña")).toBeInTheDocument()
    expect(screen.getByDisplayValue("400.00")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument()
  })
})
