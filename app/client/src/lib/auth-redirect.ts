/** Construye destinos internos sin permitir redirecciones abiertas. */
export function buildJoinPath(invitationToken: string | null | undefined): string | null {
  const token = invitationToken?.trim()
  if (!token) return null

  const params = new URLSearchParams({ redirect: token })
  return `/join?${params.toString()}`
}

export function buildLoginPath(
  invitationToken?: string | null,
  error?: string | null,
): string {
  const params = new URLSearchParams()
  const token = invitationToken?.trim()

  if (token) params.set("redirect", token)
  if (error) params.set("error", error)

  const query = params.toString()
  return query ? `/auth/login?${query}` : "/auth/login"
}
