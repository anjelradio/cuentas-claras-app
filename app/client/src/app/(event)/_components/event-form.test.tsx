import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { EventForm } from "./event-form"

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }))

describe("EventForm fechas", () => {
  it("envía inicio y fin cuando el período es válido", async () => {
    const onSubmitAction = vi.fn().mockResolvedValue(undefined)
    render(<EventForm mode="create" onSubmitAction={onSubmitAction} />)

    fireEvent.change(screen.getByPlaceholderText("Nombre del evento"), { target: { value: "Viaje" } })
    fireEvent.change(screen.getByLabelText("Fecha de inicio"), { target: { value: "2026-08-31" } })
    fireEvent.change(screen.getByLabelText("Fecha de fin"), { target: { value: "2026-09-01" } })
    fireEvent.submit(screen.getByRole("button", { name: "Crear evento" }).closest("form")!)

    await vi.waitFor(() => expect(onSubmitAction).toHaveBeenCalled())
    expect(onSubmitAction.mock.calls[0][0]).toMatchObject({
      starts_at: "2026-08-31T00:00:00.000Z",
      ends_at: "2026-09-01T23:59:59.999Z",
    })
  })

  it("rechaza una fecha de fin anterior", () => {
    const onSubmitAction = vi.fn()
    render(<EventForm mode="create" onSubmitAction={onSubmitAction} />)

    fireEvent.change(screen.getByLabelText("Fecha de inicio"), { target: { value: "2026-09-02" } })
    fireEvent.change(screen.getByLabelText("Fecha de fin"), { target: { value: "2026-09-01" } })
    fireEvent.submit(screen.getByRole("button", { name: "Crear evento" }).closest("form")!)

    expect(onSubmitAction).not.toHaveBeenCalled()
  })
})
