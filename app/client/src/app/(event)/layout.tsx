import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { HomeHeader } from "@/components/layout/home-header"

export default async function EventLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="theme-stitch relative min-h-screen overflow-x-hidden">
      <HomeHeader user={session.user} />
      
      {/* Contenedor principal con el padding necesario para que el header fijo no lo tape */}
      <main className="max-w-5xl mx-auto min-h-screen px-5 pt-32 pb-24 relative z-0 md:px-8">
        {children}
      </main>
    </div>
  )
}
