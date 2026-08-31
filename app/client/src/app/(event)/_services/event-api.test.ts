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
