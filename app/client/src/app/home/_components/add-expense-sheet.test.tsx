import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { eventSummaryFixture } from "@/test-utils/event-test-helpers"
import { AddExpenseSheet } from "./add-expense-sheet"

describe("AddExpenseSheet", () => {
  it("muestra eventos abiertos recibidos por props", () => {
    render(<AddExpenseSheet activeEvents={[eventSummaryFixture]} />)

    fireEvent.click(screen.getByRole("button", { name: /Registrar gasto/i }))

    expect(screen.getByText(eventSummaryFixture.name)).toBeInTheDocument()
    expect(screen.getByText("3 miembros")).toBeInTheDocument()
  })

  it("muestra un estado vacío cuando no hay eventos abiertos", () => {
    render(<AddExpenseSheet activeEvents={[]} />)

    fireEvent.click(screen.getByRole("button", { name: /Registrar gasto/i }))

    expect(screen.getByText("No tienes eventos abiertos disponibles.")).toBeInTheDocument()
  })

  it("avanza al paso de adjuntar comprobante al seleccionar un evento", () => {
    render(<AddExpenseSheet activeEvents={[eventSummaryFixture]} />)

    fireEvent.click(screen.getByRole("button", { name: /Registrar gasto/i }))
    fireEvent.click(screen.getByText(eventSummaryFixture.name))

    expect(screen.getByText("Adjuntar comprobante")).toBeInTheDocument()
    expect(screen.getByText(eventSummaryFixture.name)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Analizar imagen y continuar/i })).toBeInTheDocument()
  })
})
