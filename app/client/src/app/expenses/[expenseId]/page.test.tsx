import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { getExpenseById } from "@/app/expenses/_types/expense-demo"
import { ExpenseDetailView } from "./_components/expense-detail-view"

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

describe("detalle de gasto", () => {
  it("distingue un gasto existente de una ruta inexistente", () => {
    expect(getExpenseById("cena-puerto")?.participants).toHaveLength(10)
    expect(getExpenseById("inexistente")).toBeUndefined()
  })

  it("abre el flujo visual para saldar una parte pendiente", async () => {
    const user = userEvent.setup()
    const expense = getExpenseById("cena-puerto")
    if (!expense) throw new Error("Se esperaba gasto demo")
    render(<ExpenseDetailView eventId="demo-event" expense={expense} />)

    await user.click(screen.getByRole("button", { name: /saldar mi parte/i }))
    expect(await screen.findByRole("heading", { name: "Selecciona un método de pago" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /pagar con qr/i }))
    expect(await screen.findByRole("button", { name: "Confirmar demostración" })).toBeInTheDocument()
  })
})
