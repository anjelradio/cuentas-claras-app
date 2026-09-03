import { afterEach, describe, expect, it, vi } from "vitest"

import { eventSummaryFixture } from "@/test-utils/event-test-helpers"
import { EventApi } from "./event-api"

describe("EventApi.listUserEvents", () => {
  afterEach(() => vi.restoreAllMocks())

  it("envía active_only cuando se solicita el filtro", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "jwt" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([eventSummaryFixture]), { status: 200 }))

    await EventApi.listUserEvents({ activeOnly: true })

    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:8000/api/events?active_only=true")
  })

  it("conserva la URL sin query por defecto y valida member_count", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "jwt" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([eventSummaryFixture]), { status: 200 }))

    const events = await EventApi.listUserEvents()

    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:8000/api/events")
    expect(events[0].member_count).toBe(3)
  })
})

describe("downloadEventReport", () => {
  afterEach(() => vi.restoreAllMocks())

  it("descarga el reporte correctamente con nombre de Content-Disposition", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "jwt-test" }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response("CSV_CONTENT", {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="mi-evento-reporte.csv"',
          },
        })
      )

    const createObjectURLMock = vi.fn().mockReturnValue("blob:http://localhost/test-blob")
    const revokeObjectURLMock = vi.fn()
    globalThis.URL.createObjectURL = createObjectURLMock
    globalThis.URL.revokeObjectURL = revokeObjectURLMock

    const clickMock = vi.fn()
    const setAttributeMock = vi.fn()
    vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      setAttribute: setAttributeMock,
      style: {},
      click: clickMock,
    } as unknown as HTMLAnchorElement)
    vi.spyOn(document.body, "appendChild").mockImplementation(() => ({} as any))
    vi.spyOn(document.body, "removeChild").mockImplementation(() => ({} as any))

    const { downloadEventReport } = await import("./event-api")
    await downloadEventReport("event-123", "csv")

    expect(clickMock).toHaveBeenCalled()
    expect(setAttributeMock).toHaveBeenCalledWith("download", "mi-evento-reporte.csv")
    expect(createObjectURLMock).toHaveBeenCalled()
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:http://localhost/test-blob")
  })

  it("lanza error descriptivo si el backend falla", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "jwt-test" }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: "FORBIDDEN", message: "No eres miembro activo." }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      )

    const { downloadEventReport } = await import("./event-api")
    await expect(downloadEventReport("event-123", "pdf")).rejects.toThrow("No eres miembro activo.")
  })
})
