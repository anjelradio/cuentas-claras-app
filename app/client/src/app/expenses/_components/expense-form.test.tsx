import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ExpenseForm } from "./expense-form"

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

describe("ExpenseForm", () => {
  it("marca campos obligatorios como inválidos y conserva el formulario", async () => {
    const user = userEvent.setup()
    render(<ExpenseForm eventId="demo-event" mode="create" />)

    const name = screen.getByLabelText("Nombre del gasto")
    await user.click(screen.getByRole("button", { name: "Registrar gasto" }))
    expect(name).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByLabelText("Monto del gasto")).toHaveAttribute("aria-invalid", "true")
  })

  it("abre la selección accesible de participantes después de validar el formulario", async () => {
    const user = userEvent.setup()
    render(<ExpenseForm eventId="demo-event" mode="create" />)

    await user.type(screen.getByLabelText("Nombre del gasto"), "Cena del viaje")
    await user.type(screen.getByLabelText("Monto del gasto"), "360")
    await user.click(screen.getByRole("button", { name: "Registrar gasto" }))
    expect(await screen.findByRole("heading", { name: "Excluir miembros del gasto" })).toBeInTheDocument()
    expect(screen.getAllByRole("checkbox")).toHaveLength(10)
  })
})
