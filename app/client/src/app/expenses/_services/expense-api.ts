import type {
  ExpenseCreatePayload,
  ExpenseDetail,
  ExpenseRead,
  ExpenseReceipt,
  ExpenseSummary,
  ExpenseUpdatePayload,
  ReceiptAnalysisResponse,
} from "../_types/expense";
import {
  errorSchema,
  expenseDetailSchema,
  expenseReadSchema,
  expenseReceiptSchema,
  expenseSummarySchema,
  receiptAnalysisResponseSchema,
} from "../_schemas/expense-api-schemas";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getHeaders(contentType = true): Promise<HeadersInit> {
  const tokenRes = await fetch("/api/auth/token");
  if (!tokenRes.ok) {
    throw new Error("No authentication token available.");
  }
  const jwtData = await tokenRes.json();

  return {
    ...(contentType ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${jwtData.token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  if (res.status === 404) {
    throw new Error("NEXT_NOT_FOUND");
  }

  let errorMessage = `Error HTTP ${res.status}`;
  try {
    const errorData = await res.json();
    const parsed = errorSchema.safeParse(errorData);
    if (parsed.success) errorMessage = parsed.data.message;
  } catch {
    errorMessage = res.statusText || errorMessage;
  }

  throw new Error(errorMessage);
}

/**
 * Servicio cliente API para el módulo de Gastos y Comprobantes.
 * Conecta las interfaces con FastAPI enviando JSON o FormData según corresponda.
 */
export const ExpenseApi = {
  async listEventExpenses(
    eventId: string,
    filter: "all" | "mine" | "others" = "all"
  ): Promise<ExpenseSummary[]> {
    const res = await fetch(`${API_BASE}/events/${eventId}/expenses?filter=${filter}`, {
      method: "GET",
      headers: await getHeaders(),
    });
    return expenseSummarySchema.array().parse(await handleResponse<unknown>(res));
  },

  async getExpenseDetail(expenseId: string): Promise<ExpenseDetail> {
    const res = await fetch(`${API_BASE}/expenses/${expenseId}`, {
      method: "GET",
      headers: await getHeaders(),
    });
    return expenseDetailSchema.parse(await handleResponse<unknown>(res));
  },

  async createExpense(
    eventId: string,
    data: ExpenseCreatePayload,
    file?: File | null
  ): Promise<ExpenseRead> {
    if (file) {
      const formData = new FormData();
      formData.append("data", JSON.stringify(data));
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/events/${eventId}/expenses`, {
        method: "POST",
        headers: await getHeaders(false),
        body: formData,
      });
      return expenseReadSchema.parse(await handleResponse<unknown>(res));
    }

    const res = await fetch(`${API_BASE}/events/${eventId}/expenses`, {
      method: "POST",
      headers: await getHeaders(true),
      body: JSON.stringify(data),
    });
    return expenseReadSchema.parse(await handleResponse<unknown>(res));
  },

  async updateExpense(
    expenseId: string,
    data: ExpenseUpdatePayload,
    file?: File | null
  ): Promise<ExpenseDetail> {
    if (file) {
      const formData = new FormData();
      formData.append("data", JSON.stringify(data));
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/expenses/${expenseId}`, {
        method: "PATCH",
        headers: await getHeaders(false),
        body: formData,
      });
      return expenseDetailSchema.parse(await handleResponse<unknown>(res));
    }

    const res = await fetch(`${API_BASE}/expenses/${expenseId}`, {
      method: "PATCH",
      headers: await getHeaders(true),
      body: JSON.stringify(data),
    });
    return expenseDetailSchema.parse(await handleResponse<unknown>(res));
  },

  async deleteExpense(expenseId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/expenses/${expenseId}`, {
      method: "DELETE",
      headers: await getHeaders(),
    });
    await handleResponse<void>(res);
  },

  async uploadReceipt(expenseId: string, file: File): Promise<ExpenseReceipt> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/expenses/${expenseId}/receipt`, {
      method: "PUT",
      headers: await getHeaders(false),
      body: formData,
    });
    return expenseReceiptSchema.parse(await handleResponse<unknown>(res));
  },

  async analyzeReceipt(
    eventId: string,
    file: File
  ): Promise<ReceiptAnalysisResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/events/${eventId}/expenses/analyze-receipt`, {
      method: "POST",
      headers: await getHeaders(false),
      body: formData,
    });
    return receiptAnalysisResponseSchema.parse(await handleResponse<unknown>(res));
  },

  async discardReceipt(eventId: string, publicId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/events/${eventId}/expenses/discard-receipt`, {
      method: "POST",
      headers: await getHeaders(true),
      body: JSON.stringify({ public_id: publicId }),
    });
    await handleResponse<void>(res);
  },

  async deleteReceipt(expenseId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/expenses/${expenseId}/receipt`, {
      method: "DELETE",
      headers: await getHeaders(),
    });
    await handleResponse<void>(res);
  },

  async getDebtsSummary(eventId?: string): Promise<import("../_types/expense").DebtsSummary> {
    const url = eventId
      ? `${API_BASE}/expenses/debts/summary?event_id=${eventId}`
      : `${API_BASE}/expenses/debts/summary`;
    const res = await fetch(url, {
      method: "GET",
      headers: await getHeaders(),
    });
    const { debtsSummarySchema } = await import("../_schemas/expense-api-schemas");
    return debtsSummarySchema.parse(await handleResponse<unknown>(res));
  },

  async getEventStatistics(eventId: string): Promise<import("../_types/expense").EventStatistics> {
    const res = await fetch(`${API_BASE}/events/${eventId}/statistics`, {
      method: "GET",
      headers: await getHeaders(),
    });
    const { eventStatisticsSchema } = await import("../_schemas/expense-api-schemas");
    return eventStatisticsSchema.parse(await handleResponse<unknown>(res));
  },
};
