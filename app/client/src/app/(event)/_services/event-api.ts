
import type { 
  EventDetail, 
  EventSummary, 
  EventMemberInfo, 
  EventInvitation, 
  EventCreatePayload, 
  EventUpdatePayload 
} from "../_types/event";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getHeaders(): Promise<HeadersInit> {
  // Always runs in browser / client component context for MVP.
  // Obtain the JWT via better-auth client plugin.
  const tokenRes = await fetch("/api/auth/token");
  if (!tokenRes.ok) {
    throw new Error("No authentication token available.");
  }
  const jwtData = await tokenRes.json();

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${jwtData.token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as any as T;
    return res.json() as Promise<T>;
  }

  if (res.status === 404) {
    throw new Error("NEXT_NOT_FOUND");
  }

  let errorMessage = `Error HTTP ${res.status}`;
  try {
    const errorData = await res.json();
    if (errorData?.detail) {
      errorMessage = typeof errorData.detail === "string" 
        ? errorData.detail 
        : JSON.stringify(errorData.detail);
    }
  } catch (e) {
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
  async listUserEvents(): Promise<EventSummary[]> {
    const res = await fetch(`${API_BASE}/events`, {
      method: "GET",
      headers: await getHeaders(),
    });
    return handleResponse<EventSummary[]>(res);
  },

  async getEventDetail(eventId: string): Promise<EventDetail> {
    const res = await fetch(`${API_BASE}/events/${eventId}`, {
      method: "GET",
      headers: await getHeaders(),
    });
    return handleResponse<EventDetail>(res);
  },

  async getEventMembers(eventId: string): Promise<EventMemberInfo[]> {
    const res = await fetch(`${API_BASE}/events/${eventId}/members`, {
      method: "GET",
      headers: await getHeaders(),
    });
    return handleResponse<EventMemberInfo[]>(res);
  },

  async createEvent(data: EventCreatePayload): Promise<EventDetail> {
    const res = await fetch(`${API_BASE}/events`, {
      method: "POST",
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<EventDetail>(res);
  },

  async updateEvent(eventId: string, data: EventUpdatePayload): Promise<EventDetail> {
    const res = await fetch(`${API_BASE}/events/${eventId}`, {
      method: "PATCH",
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<EventDetail>(res);
  },

  async deleteEvent(eventId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/events/${eventId}`, {
      method: "DELETE",
      headers: await getHeaders(),
    });
    return handleResponse<void>(res);
  },

  async generateInvitation(eventId: string): Promise<EventInvitation> {
    const res = await fetch(`${API_BASE}/events/${eventId}/invitations`, {
      method: "POST",
      headers: await getHeaders(),
    });
    return handleResponse<EventInvitation>(res);
  },

  async joinEvent(tokenHash: string): Promise<void> {
    const res = await fetch(`${API_BASE}/events/join`, {
      method: "POST",
      headers: await getHeaders(),
      body: JSON.stringify({ token_hash: tokenHash }),
    });
    return handleResponse<void>(res);
  },

  async removeMember(eventId: string, memberId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/events/${eventId}/members/${memberId}`, {
      method: "DELETE",
      headers: await getHeaders(),
    });
    return handleResponse<void>(res);
  },

  async transferOwnership(eventId: string, newOwnerId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/events/${eventId}/transfer-ownership`, {
      method: "POST",
      headers: await getHeaders(),
      body: JSON.stringify({ new_owner_id: newOwnerId }),
    });
    return handleResponse<void>(res);
  }
};
