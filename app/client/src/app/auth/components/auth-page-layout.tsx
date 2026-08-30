import type { ReactNode } from "react"

/** Centra las pantallas de autenticación con una distribución mobile-first. */
export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <main 
      className="theme-stitch flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 bg-background text-foreground"
      style={{
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(95, 77, 255, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 90% 80%, rgba(61, 59, 255, 0.12) 0%, transparent 40%),
          radial-gradient(circle at 80% 10%, rgba(138, 43, 226, 0.1) 0%, transparent 35%)
        `
      }}
    >
      {children}
    </main>
  )
}
