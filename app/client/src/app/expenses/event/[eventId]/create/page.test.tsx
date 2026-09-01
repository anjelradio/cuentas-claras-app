import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ExpenseForm } from "@/app/expenses/_components/expense-form"

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

describe("formulario de creación de gastos", () => {
  it("renderiza el formulario con miembros iniciales", () => {
    const members = [
      { id: "member-1", name: "Ana" },
      { id: "member-2", name: "Carlos" },
    ]
    render(<ExpenseForm eventId="event-123" mode="create" members={members} />)

    expect(screen.getByRole("heading", { name: "Registrar gasto" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Registrar gasto" })).toBeInTheDocument()
  })
})
