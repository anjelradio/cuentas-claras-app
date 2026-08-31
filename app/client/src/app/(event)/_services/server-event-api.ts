import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { cache } from "react"
import type { EventDetail, EventMemberInfo, EventSummary } from "../_types/event"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

async function getServerHeaders(): Promise<HeadersInit> {
  const cookieHeader = (await headers()).get("cookie") || ""
  
  // Get the JWT token from our internal Next.js API route
  const tokenRes = await fetch(`${APP_URL}/api/auth/token`, {
    headers: { cookie: cookieHeader },
    cache: "no-store"
  })

  if (!tokenRes.ok) {
    throw new Error("No authentication token available.")
  }
  
  const jwtData = await tokenRes.json()

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${jwtData.token}`,
  }
}

export const getCachedEventDetail = cache(async (eventId: string): Promise<EventDetail> => {
  const reqHeaders = await getServerHeaders()
  const res = await fetch(`${API_BASE}/events/${eventId}`, {
    method: "GET",
    headers: reqHeaders,
  })
  
  if (res.status === 404) notFound()
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData?.detail || `Error HTTP ${res.status}`)
  }
  return res.json()
})

export const getCachedEventMembers = cache(async (eventId: string): Promise<EventMemberInfo[]> => {
  const reqHeaders = await getServerHeaders()
  const res = await fetch(`${API_BASE}/events/${eventId}/members`, {
    method: "GET",
    headers: reqHeaders,
  })
  
  if (res.status === 404) notFound()
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData?.detail || `Error HTTP ${res.status}`)
  }
  return res.json()
})

export const getCachedUserEvents = cache(async (): Promise<EventSummary[]> => {
  const reqHeaders = await getServerHeaders()
  const res = await fetch(`${API_BASE}/events`, {
    method: "GET",
    headers: reqHeaders,
  })
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData?.detail || `Error HTTP ${res.status}`)
  }
  return res.json()
})
