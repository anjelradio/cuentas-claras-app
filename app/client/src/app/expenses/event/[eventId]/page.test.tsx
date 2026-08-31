import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { ExpensesList } from "./_components/expenses-list"

describe("lista de gastos", () => {
  it("cambia el filtro activo y muestra la colección correspondiente", async () => {
    const user = userEvent.setup()
    render(<ExpensesList eventId="demo-event" />)

    await user.click(screen.getByRole("tab", { name: "Mis gastos" }))
    expect(screen.getByRole("tab", { name: "Mis gastos" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByText("Cena en el puerto")).toBeInTheDocument()
    expect(screen.queryByText("Cabaña Samaipata")).not.toBeInTheDocument()
  })

  it("mantiene los datos demo visibles para un evento sin integración real", () => {
    render(<ExpensesList eventId="evento-sin-gastos" />)
    expect(screen.getByText("Cena en el puerto")).toBeInTheDocument()
  })
})
