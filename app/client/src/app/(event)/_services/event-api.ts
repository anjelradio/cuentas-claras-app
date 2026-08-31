
import type {
  EventDetail, 
  EventRead,
  EventSummary, 
  EventMemberInfo, 
  EventInvitation, 
  EventCreatePayload, 
  EventUpdatePayload 
} from "../_types/event";
import { errorSchema, eventDetailSchema, eventInvitationSchema, eventMemberSchema, eventReadSchema, eventSummarySchema, myQrSchema, operationSchema } from "../_schemas/event-api-schemas";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getHeaders(contentType = true): Promise<HeadersInit> {
  // Always runs in browser / client component context for MVP.
  // Obtain the JWT via better-auth client plugin.
  const tokenRes = await fetch("/api/auth/token");
  if (!tokenRes.ok) {
    throw new Error("No authentication token available.");
  }
  const jwtData = await tokenRes.json();

  return { ...(contentType ? { "Content-Type": "application/json" } : {}), "Authorization": `Bearer ${jwtData.token}` };
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
    // Cannot parse JSON, fallback to status text
    errorMessage = res.statusText || errorMessage;
  }

  throw new Error(errorMessage);
}

/**
 * Servicio principal de llamadas al backend de FastAPI para las funcionalidades de Eventos.
 * Maneja internamente la inyección del token JWT y captura errores de la API
 * devolviéndolos listos para mostrarse o procesarse.
 */
export const EventApi = {
  async listUserEvents(options: { activeOnly?: boolean } = {}): Promise<EventSummary[]> {
    const query = options.activeOnly ? "?active_only=true" : ""
    const res = await fetch(`${API_BASE}/events${query}`, {
      method: "GET",
      headers: await getHeaders(),
    });
    return eventSummarySchema.array().parse(await handleResponse<unknown>(res));
  },

  async getEventDetail(eventId: string): Promise<EventDetail> {
    const res = await fetch(`${API_BASE}/events/${eventId}`, {
      method: "GET",
      headers: await getHeaders(),
    });
    return eventDetailSchema.parse(await handleResponse<unknown>(res));
  },

  async getEventMembers(eventId: string): Promise<EventMemberInfo[]> {
    const res = await fetch(`${API_BASE}/events/${eventId}/members`, {
      method: "GET",
      headers: await getHeaders(),
    });
    return eventMemberSchema.array().parse(await handleResponse<unknown>(res));
  },

  async createEvent(data: EventCreatePayload): Promise<EventRead> {
    const res = await fetch(`${API_BASE}/events`, {
      method: "POST",
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return eventReadSchema.parse(await handleResponse<unknown>(res));
  },

  async updateEvent(eventId: string, data: EventUpdatePayload): Promise<EventRead> {
    const res = await fetch(`${API_BASE}/events/${eventId}`, {
      method: "PATCH",
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return eventReadSchema.parse(await handleResponse<unknown>(res));
  },

  async deleteEvent(eventId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/events/${eventId}`, {
      method: "DELETE",
      headers: await getHeaders(),
    });
    await handleResponse<void>(res);
  },

  async generateInvitation(eventId: string): Promise<EventInvitation> {
    const res = await fetch(`${API_BASE}/events/${eventId}/invitations`, {
      method: "POST",
      headers: await getHeaders(),
    });
    return eventInvitationSchema.parse(await handleResponse<unknown>(res));
  },

  async joinEvent(tokenHash: string): Promise<void> {
    const res = await fetch(`${API_BASE}/events/join`, {
      method: "POST",
      headers: await getHeaders(),
      body: JSON.stringify({ token_hash: tokenHash }),
    });
    operationSchema.parse(await handleResponse<unknown>(res));
  },

  async removeMember(eventId: string, memberId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/events/${eventId}/members/${memberId}`, {
      method: "DELETE",
      headers: await getHeaders(),
    });
    await handleResponse<void>(res);
  },

  async transferOwnership(eventId: string, newOwnerId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/events/${eventId}/transfer-ownership`, {
      method: "POST",
      headers: await getHeaders(),
      body: JSON.stringify({ new_owner_id: newOwnerId }),
    });
    operationSchema.parse(await handleResponse<unknown>(res));
  },

  async leaveEvent(eventId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/events/${eventId}/leave`, { method: "POST", headers: await getHeaders() });
    operationSchema.parse(await handleResponse<unknown>(res));
  },

  async getMyQr(eventId: string) {
    const res = await fetch(`${API_BASE}/events/${eventId}/my-qr`, { method: "GET", headers: await getHeaders() });
    return myQrSchema.parse(await handleResponse<unknown>(res));
  },

  async upsertMyQr(eventId: string, file: File) {
    const body = new FormData();
    body.set("file", file);
    const res = await fetch(`${API_BASE}/events/${eventId}/my-qr`, { method: "PUT", headers: await getHeaders(false), body });
    return myQrSchema.parse(await handleResponse<unknown>(res));
  }
};
