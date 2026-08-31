import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { HomeHeader } from "@/components/layout/home-header"
import { auth } from "@/lib/auth"

/**
 * Protege las secciones funcionales de la aplicación y conserva el encabezado
 * común para cada grupo de rutas autenticadas.
 */
export async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="theme-stitch relative min-h-screen overflow-x-hidden">
      <HomeHeader user={session.user} />
      <main className="relative z-0 mx-auto min-h-screen max-w-5xl px-5 pt-32 pb-24 md:px-8">
        {children}
      </main>
    </div>
  )
}
