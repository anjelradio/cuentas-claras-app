import type {
  BatchReadResponse,
  NotificationItem,
  NotificationListResponse,
  UnreadCountResponse,
} from "../types/notification";

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

export async function getNotifications(
  limit = 20,
  offset = 0,
  unreadOnly = false
): Promise<NotificationListResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    unread_only: unreadOnly ? "true" : "false",
  });

  const headers = await getHeaders(false);
  const res = await fetch(`${API_BASE}/notifications?${params.toString()}`, {
    headers,
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: No se pudieron cargar las notificaciones.`);
  }

  return (await res.json()) as NotificationListResponse;
}

export async function getUnreadCount(): Promise<number> {
  const headers = await getHeaders(false);
  const res = await fetch(`${API_BASE}/notifications/unread-count`, {
    headers,
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: No se pudo obtener el conteo de no leídas.`);
  }

  const data = (await res.json()) as UnreadCountResponse;
  return data.unread_count;
}

export async function markNotificationAsRead(activityId: string): Promise<NotificationItem> {
  const headers = await getHeaders(true);
  const res = await fetch(`${API_BASE}/notifications/${activityId}/read`, {
    method: "PATCH",
    headers,
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: No se pudo marcar la notificación como leída.`);
  }

  return (await res.json()) as NotificationItem;
}

export async function markAllNotificationsAsRead(): Promise<BatchReadResponse> {
  const headers = await getHeaders(true);
  const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
    method: "POST",
    headers,
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: No se pudieron marcar las notificaciones como leídas.`);
  }

  return (await res.json()) as BatchReadResponse;
}
