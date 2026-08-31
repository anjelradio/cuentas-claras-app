import type { ReactNode } from "react"

/** Centra las pantallas de autenticación con una distribución mobile-first. */
export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
      {children}
    </main>
  )
}
