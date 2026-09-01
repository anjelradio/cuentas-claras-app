import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ExpenseForm } from "./expense-form"

describe("ExpenseForm", () => {
  const members = [
    { id: "member-1", name: "Ana López" },
    { id: "member-2", name: "Carlos Ruiz" },
  ]

  it("renderiza el formulario de creación con título y campos requeridos", () => {
    render(<ExpenseForm eventId="event-123" mode="create" members={members} />)

    expect(screen.getByRole("heading", { name: "Registrar gasto" })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Nombre del gasto")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Monto total (Bs.)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Registrar gasto" })).toBeInTheDocument()
  })

  it("muestra alerta de validación cuando se envía vacío", async () => {
    const user = userEvent.setup()
    render(<ExpenseForm eventId="event-123" mode="create" members={members} />)

    const submitBtn = screen.getByRole("button", { name: "Registrar gasto" })
    await user.click(submitBtn)

    const nameInput = screen.getByPlaceholderText("Nombre del gasto")
    expect(nameInput).toHaveAttribute("aria-invalid", "true")
  })
})
