import { getSessionCookie } from "better-auth/cookies"
import { NextRequest, NextResponse } from "next/server"

/**
 * Redirige de forma optimista según la cookie de sesión.
 * Cada página protegida vuelve a validar la sesión antes de entregar contenido.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  const hasSession = Boolean(getSessionCookie(request))
  const isAuthRoute = pathname.startsWith("/auth")

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (!isAuthRoute && !hasSession) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
