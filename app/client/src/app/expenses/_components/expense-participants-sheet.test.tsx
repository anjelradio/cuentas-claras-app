import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ExpenseParticipantsSheet } from "./expense-participants-sheet"

const members = [
  { id: "member-b", name: "Bruno" },
  { id: "member-c", name: "Carla" },
]

function renderSheet(overrides: Partial<React.ComponentProps<typeof ExpenseParticipantsSheet>> = {}) {
  return render(
    <ExpenseParticipantsSheet
      open
      onOpenChange={vi.fn()}
      members={members}
      splitType="equal"
      selectedMemberIds={new Set()}
      onSelectedMemberIdsChange={vi.fn()}
      exactAmounts={{}}
      onExactAmountChange={vi.fn()}
      totalAmount="200.00"
      payerParticipated={null}
      onPayerParticipatedChange={vi.fn()}
      onConfirm={vi.fn()}
      {...overrides}
    />
  )
}

describe("ExpenseParticipantsSheet", () => {
  it("requiere responder la participación y no muestra al pagador como deuda", () => {
    renderSheet()

    expect(screen.queryByText("¿Tú participaste en este gasto?")).not.toBeInTheDocument()
    expect(screen.getByText("Tu participación")).toBeInTheDocument()
    expect(screen.queryByText("Ana")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Continuar/i })).not.toBeInTheDocument()
  })

  it("avanza a terceros y refleja el resumen en centavos", async () => {
    const user = userEvent.setup()
    renderSheet({ payerParticipated: true })

    await user.click(screen.getByRole("button", { name: /Sí, participé/i }))
    await user.click(screen.getByRole("checkbox", { name: /Incluir a Bruno/ }))

    expect(screen.getByText("Participantes del gasto")).toBeInTheDocument()
    expect(screen.getByText("Devolución")).toBeInTheDocument()
    expect(screen.getAllByText(/Bs\./).length).toBeGreaterThanOrEqual(3)
  })

  it("muestra al pagador solo en montos exactos cuando participó", async () => {
    const user = userEvent.setup()
    renderSheet({
      payerParticipated: true,
      splitType: "exact",
      payer: { id: "member-a", name: "Ana" },
    })

    await user.click(screen.getByRole("button", { name: /Sí, participé/i }))

    expect(screen.getByText("Este eres tú")).toBeInTheDocument()
    expect(screen.getByRole("spinbutton", { name: "Monto para Ana" })).toBeInTheDocument()
  })
})
