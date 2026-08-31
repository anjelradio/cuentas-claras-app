import { getSessionCookie } from "better-auth/cookies"
import { NextRequest, NextResponse } from "next/server"

import { buildJoinPath, buildLoginPath } from "@/lib/auth-redirect"

/**
 * Redirige de forma optimista según la cookie de sesión.
 * Cada página protegida vuelve a validar la sesión antes de entregar contenido.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  const hasSession = Boolean(getSessionCookie(request))
  const isAuthRoute = pathname.startsWith("/auth")
  const invitationToken = request.nextUrl.searchParams.get("redirect")

  if (isAuthRoute && hasSession) {
    const joinPath = buildJoinPath(invitationToken)
    if (joinPath) {
      return NextResponse.redirect(new URL(joinPath, request.url))
    }

    return NextResponse.redirect(new URL("/", request.url))
  }

  if (!isAuthRoute && !hasSession) {
    const loginPath = pathname === "/join"
      ? buildLoginPath(invitationToken)
      : buildLoginPath()

    return NextResponse.redirect(new URL(loginPath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
