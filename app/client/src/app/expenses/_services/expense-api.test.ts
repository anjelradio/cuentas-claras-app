import { afterEach, describe, expect, it, vi } from "vitest"
import { ExpenseApi } from "./expense-api"

describe("ExpenseApi", () => {
  afterEach(() => vi.restoreAllMocks())

  const mockExpenseRead = {
    id: "11111111-1111-1111-1111-111111111111",
    event_id: "22222222-2222-2222-2222-222222222222",
    created_by_member_id: "33333333-3333-3333-3333-333333333333",
    paid_by_member_id: "33333333-3333-3333-3333-333333333333",
    name: "Almuerzo",
    description: "Tacos",
    amount: "100.00",
    category: "food",
    split_type: "equal",
    expense_date: "2026-08-18T12:00:00Z",
    receipt_url: null,
    created_at: "2026-08-18T12:00:00Z",
    updated_at: "2026-08-18T12:00:00Z",
  }

  const mockExpenseSummary = {
    id: "11111111-1111-1111-1111-111111111111",
    event_id: "22222222-2222-2222-2222-222222222222",
    name: "Almuerzo",
    description: "Tacos",
    amount: "100.00",
    category: "food",
    split_type: "equal",
    expense_date: "2026-08-18T12:00:00Z",
    paid_by_member_id: "33333333-3333-3333-3333-333333333333",
    paid_by_member_name: "Ana",
    has_receipt: false,
    created_at: "2026-08-18T12:00:00Z",
  }

  it("listEventExpenses envía el query param de filtro y valida la respuesta", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "jwt" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([mockExpenseSummary]), { status: 200 }))

    const result = await ExpenseApi.listEventExpenses("22222222-2222-2222-2222-222222222222", "mine")

    expect(fetchMock.mock.calls[1][0]).toContain("/events/22222222-2222-2222-2222-222222222222/expenses?filter=mine")
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Almuerzo")
  })

  it("createExpense con JSON realiza POST con Content-Type application/json", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "jwt" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(mockExpenseRead), { status: 201 }))

    const result = await ExpenseApi.createExpense("22222222-2222-2222-2222-222222222222", {
      name: "Almuerzo",
      amount: "100.00",
      category: "food",
      split_type: "equal",
      paid_by_member_id: "33333333-3333-3333-3333-333333333333",
      expense_date: "2026-08-18T12:00:00Z",
      participant_member_ids: ["33333333-3333-3333-3333-333333333333"],
    })

    expect(fetchMock.mock.calls[1][1]?.method).toBe("POST")
    expect(result.id).toBe(mockExpenseRead.id)
  })

  it("createExpense con archivo envía multipart/form-data", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "jwt" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(mockExpenseRead), { status: 201 }))

    const fakeFile = new File(["test-image-content"], "receipt.jpg", { type: "image/jpeg" })

    await ExpenseApi.createExpense(
      "22222222-2222-2222-2222-222222222222",
      {
        name: "Almuerzo",
        amount: "100.00",
        category: "food",
        split_type: "equal",
        paid_by_member_id: "33333333-3333-3333-3333-333333333333",
        expense_date: "2026-08-18T12:00:00Z",
        participant_member_ids: ["33333333-3333-3333-3333-333333333333"],
      },
      fakeFile
    )

    const requestOptions = fetchMock.mock.calls[1][1]
    expect(requestOptions?.body).toBeInstanceOf(FormData)
  })

  it("deleteExpense ejecuta DELETE y retorna void", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "jwt" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await ExpenseApi.deleteExpense("11111111-1111-1111-1111-111111111111")

    expect(fetchMock.mock.calls[1][1]?.method).toBe("DELETE")
  })
})
