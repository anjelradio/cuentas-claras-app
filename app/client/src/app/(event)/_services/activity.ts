import type { ActivityLogEntry } from "../_types/activity-types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function getHeaders(contentType = true): Promise<HeadersInit> {
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    const { headers } = await import("next/headers");
    const cookieHeader = (await headers()).get("cookie") || "";
    
    const tokenRes = await fetch(`${APP_URL}/api/auth/token`, {
      headers: { cookie: cookieHeader },
      cache: "no-store"
    });
    
    if (!tokenRes.ok) {
      throw new Error("No authentication token available.");
    }
    const jwtData = await tokenRes.json();
    return { ...(contentType ? { "Content-Type": "application/json" } : {}), "Authorization": `Bearer ${jwtData.token}` };
  } else {
    const tokenRes = await fetch("/api/auth/token");
    if (!tokenRes.ok) {
      throw new Error("No authentication token available.");
    }
    const jwtData = await tokenRes.json();
    return { ...(contentType ? { "Content-Type": "application/json" } : {}), "Authorization": `Bearer ${jwtData.token}` };
  }
}

export interface ActivityPaginatedResponse {
  items: ActivityLogEntry[]
  total: number
  has_more: boolean
}

export async function listEventActivities(
  eventId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ActivityPaginatedResponse> {
  const reqHeaders = await getHeaders();
  const res = await fetch(`${API_BASE}/events/${eventId}/activities?limit=${limit}&offset=${offset}`, {
    headers: reqHeaders,
    cache: "no-store"
  });

  if (!res.ok) {
    const error = new Error("Failed to fetch activities");
    (error as any).status = res.status;
    throw error;
  }
  
  const data = await res.json();
  
  // Format dates for display since they come as ISO strings
  // This helps match the UI which expects "Hoy, 12:45" etc.
  const formatter = new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/La_Paz'
  })
  
  return {
    items: data.items.map((item: any) => {
      // Ensure the date string is treated as UTC if backend sends naive datetime
      const dateString = item.createdAt.endsWith('Z') ? item.createdAt : `${item.createdAt}Z`;
      return {
        ...item,
        createdAt: formatter.format(new Date(dateString))
      }
    }),
    total: data.total,
    has_more: data.has_more
  }
}
