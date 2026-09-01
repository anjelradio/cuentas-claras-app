import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { ExpenseDetail, ExpenseSummary } from "../_types/expense";
import { errorSchema, expenseDetailSchema, expenseSummarySchema } from "../_schemas/expense-api-schemas";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function getServerHeaders(): Promise<HeadersInit> {
  const cookieHeader = (await headers()).get("cookie") || "";

  const tokenRes = await fetch(`${APP_URL}/api/auth/token`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    throw new Error("No authentication token available.");
  }

  const jwtData = await tokenRes.json();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwtData.token}`,
  };
}

export const getCachedEventExpenses = cache(
  async (
    eventId: string,
    filter: "all" | "mine" | "others" = "all"
  ): Promise<ExpenseSummary[]> => {
    const reqHeaders = await getServerHeaders();
    const res = await fetch(`${API_BASE}/events/${eventId}/expenses?filter=${filter}`, {
      method: "GET",
      headers: reqHeaders,
    });

    if (res.status === 404) notFound();
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorSchema.safeParse(errorData).data?.message || `Error HTTP ${res.status}`);
    }
    return expenseSummarySchema.array().parse(await res.json());
  }
);

export const getCachedExpenseDetail = cache(
  async (expenseId: string): Promise<ExpenseDetail> => {
    const reqHeaders = await getServerHeaders();
    const res = await fetch(`${API_BASE}/expenses/${expenseId}`, {
      method: "GET",
      headers: reqHeaders,
    });

    if (res.status === 404) notFound();
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorSchema.safeParse(errorData).data?.message || `Error HTTP ${res.status}`);
    }
    return expenseDetailSchema.parse(await res.json());
  }
);
