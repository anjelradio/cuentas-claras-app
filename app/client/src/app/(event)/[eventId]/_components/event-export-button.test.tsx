import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import * as eventApi from "../../_services/event-api"
import { EventExportButton } from "./event-export-button"

describe("EventExportButton", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renderiza el botón de exportar", () => {
    render(<EventExportButton eventId="evt-1" />)
    const button = screen.getByRole("button", { name: /exportar/i })
    expect(button).toBeInTheDocument()
  })

  it("abre el menú y dispara la descarga de CSV al hacer clic en la opción", async () => {
    const user = userEvent.setup()
    const downloadSpy = vi.spyOn(eventApi, "downloadEventReport").mockResolvedValue()

    render(<EventExportButton eventId="evt-1" />)
    const trigger = screen.getByRole("button", { name: /exportar/i })
    await user.click(trigger)

    const csvOption = await screen.findByText(/descargar csv/i)
    expect(csvOption).toBeInTheDocument()

    await user.click(csvOption)

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith("evt-1", "csv")
    })
  })
})
