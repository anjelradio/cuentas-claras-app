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

export const getCachedDebtsSummary = cache(
  async (eventId?: string): Promise<import("../_types/expense").DebtsSummary> => {
    const reqHeaders = await getServerHeaders();
    const url = eventId
      ? `${API_BASE}/expenses/debts/summary?event_id=${eventId}`
      : `${API_BASE}/expenses/debts/summary`;
    const res = await fetch(url, {
      method: "GET",
      headers: reqHeaders,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorSchema.safeParse(errorData).data?.message || `Error HTTP ${res.status}`);
    }
    const { debtsSummarySchema } = await import("../_schemas/expense-api-schemas");
    return debtsSummarySchema.parse(await res.json());
  }
);

export const getCachedPendingVerificationPayments = cache(
  async (): Promise<import("../_types/expense").PendingVerificationPayment[]> => {
    const reqHeaders = await getServerHeaders();
    const res = await fetch(`${API_BASE}/payments/pending-verification`, {
      method: "GET",
      headers: reqHeaders,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorSchema.safeParse(errorData).data?.message || `Error HTTP ${res.status}`);
    }
    const { pendingVerificationPaymentSchema } = await import("../_schemas/expense-api-schemas");
    return pendingVerificationPaymentSchema.array().parse(await res.json());
  }
);

export const getCachedRecentEvents = cache(
  async (limit: number = 2): Promise<import("../_types/expense").RecentEvent[]> => {
    const reqHeaders = await getServerHeaders();
    const res = await fetch(`${API_BASE}/events/recent?limit=${limit}`, {
      method: "GET",
      headers: reqHeaders,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorSchema.safeParse(errorData).data?.message || `Error HTTP ${res.status}`);
    }
    const { recentEventSchema } = await import("../_schemas/expense-api-schemas");
    return recentEventSchema.array().parse(await res.json());
  }
);

export const getCachedEventStatistics = cache(
  async (eventId: string): Promise<import("../_types/expense").EventStatistics> => {
    const reqHeaders = await getServerHeaders();
    const res = await fetch(`${API_BASE}/events/${eventId}/statistics`, {
      method: "GET",
      headers: reqHeaders,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorSchema.safeParse(errorData).data?.message || `Error HTTP ${res.status}`);
    }
    const { eventStatisticsSchema } = await import("../_schemas/expense-api-schemas");
    return eventStatisticsSchema.parse(await res.json());
  }
);

export const getCachedUserRecentActivities = cache(
  async (limit: number = 3): Promise<any[]> => {
    const reqHeaders = await getServerHeaders();
    const res = await fetch(`${API_BASE}/activities/user-recent?limit=${limit}`, {
      method: "GET",
      headers: reqHeaders,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorSchema.safeParse(errorData).data?.message || `Error HTTP ${res.status}`);
    }
    return res.json();
  }
);

