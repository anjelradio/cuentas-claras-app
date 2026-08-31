import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { StatusPageHeader } from "@/components/layout/status-page-header"

/** Presenta la carta 404 inspirada en el diseño y conserva la navegación principal. */
export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <StatusPageHeader />
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-start justify-center px-4 py-12 pt-40 md:px-8 lg:pt-48">
        <div className="glass-panel flex w-full max-w-2xl flex-col items-center gap-8 rounded-[32px] p-8 text-center md:p-12">
          <div className="relative" aria-hidden="true">
            <div className="absolute inset-0 flex items-center justify-center text-8xl font-bold tracking-tighter text-headline/20 md:text-9xl">404</div>
            <div className="relative z-10 text-6xl md:text-7xl">🧭</div>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold text-headline md:text-4xl">¡Vaya! Página no encontrada</h1>
            <p className="text-lg leading-relaxed text-body/70">Parece que te has aventurado fuera del mapa financiero. No te preocupes, tus cuentas siguen a salvo.</p>
          </div>

          <Link href="/home" className="group inline-flex items-center gap-3 rounded-full bg-action-orange px-8 py-4 font-semibold text-action-orange-foreground shadow-[0_10px_40px_rgba(255,107,53,0.3)] transition-all hover:-translate-y-1 hover:bg-action-orange/90 hover:shadow-[0_15px_50px_rgba(255,107,53,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            <span>Volver al inicio</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
