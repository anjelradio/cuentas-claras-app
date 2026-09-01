import { z } from "zod";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const errorSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
});

export const payerQrSchema = z.object({
  payer_member_id: z.string(),
  payer_name: z.string(),
  has_qr: z.boolean(),
  qr_image_url: z.string().nullable(),
});

export type PayerQrInfo = z.infer<typeof payerQrSchema>;

export const paymentReadSchema = z.object({
  id: z.string(),
  split_id: z.string(),
  expense_id: z.string(),
  debtor_member_id: z.string(),
  debtor_name: z.string(),
  amount: z.string().or(z.number()),
  payment_method: z.enum(["cash", "qr"]),
  status: z.enum(["pending_confirmation", "confirmed", "rejected"]),
  proof_image_url: z.string().nullable(),
  created_at: z.string(),
  confirmed_at: z.string().nullable().optional(),
  rejection_reason: z.string().nullable().optional(),
});

export type PaymentRead = z.infer<typeof paymentReadSchema>;

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

export const PaymentApi = {
  async getPayerQr(expenseId: string): Promise<PayerQrInfo> {
    const res = await fetch(`${API_BASE}/expenses/${expenseId}/payer-qr`, {
      method: "GET",
      headers: await getHeaders(),
    });
    return payerQrSchema.parse(await handleResponse<unknown>(res));
  },

  async declarePayment(
    expenseId: string,
    splitId: string,
    method: "cash" | "qr",
    file?: File | null
  ): Promise<PaymentRead> {
    if (file) {
      const formData = new FormData();
      formData.append("data", JSON.stringify({ payment_method: method }));
      formData.append("file", file);
      const res = await fetch(
        `${API_BASE}/expenses/${expenseId}/splits/${splitId}/pay`,
        {
          method: "POST",
          headers: await getHeaders(false),
          body: formData,
        }
      );
      return paymentReadSchema.parse(await handleResponse<unknown>(res));
    }

    const res = await fetch(
      `${API_BASE}/expenses/${expenseId}/splits/${splitId}/pay`,
      {
        method: "POST",
        headers: await getHeaders(true),
        body: JSON.stringify({ payment_method: method }),
      }
    );
    return paymentReadSchema.parse(await handleResponse<unknown>(res));
  },

  async confirmPayment(
    paymentId: string
  ): Promise<{ id: string; split_id: string; status: string; confirmed_at: string }> {
    const res = await fetch(`${API_BASE}/payments/${paymentId}/confirm`, {
      method: "POST",
      headers: await getHeaders(true),
    });
    return handleResponse(res);
  },

  async rejectPayment(
    paymentId: string,
    rejectionReason?: string
  ): Promise<{ id: string; split_id: string; status: string; rejection_reason?: string }> {
    const res = await fetch(`${API_BASE}/payments/${paymentId}/reject`, {
      method: "POST",
      headers: await getHeaders(true),
      body: JSON.stringify({ rejection_reason: rejectionReason || null }),
    });
    return handleResponse(res);
  },
};
