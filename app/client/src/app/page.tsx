import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { HomeHeader } from "@/components/layout/home-header"
import { auth } from "@/lib/auth"

/** Entrega la Home solo después de validar la sesión de Better Auth en servidor. */
export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen">
      <HomeHeader user={session.user} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-12 sm:px-8 lg:px-12">
        <p className="font-label text-sm tracking-[0.18em] text-label uppercase">Cuentas Claras</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">Tu espacio está listo</h1>
        <p className="max-w-xl leading-7 text-body">Pronto podrás organizar tus gastos y cuentas desde aquí.</p>
      </main>
    </div>
  );
}
