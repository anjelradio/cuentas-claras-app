"use client"

import { authClient } from "@/lib/auth-client"
import { HomeHeader } from "./home-header"

/** Conserva el encabezado de la aplicación en estados de error y rutas ausentes. */
export function StatusPageHeader() {
  const { data: session } = authClient.useSession()

  if (!session?.user) return null

  return <HomeHeader user={session.user} />
}
