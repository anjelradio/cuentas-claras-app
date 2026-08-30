"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

/** Presenta un límite de error para fallos de renderizado no recuperables. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // El detalle técnico permanece fuera de la interfaz y de los toasts.
  }, [])

  return <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center"><h1 className="text-2xl">No pudimos cargar esta vista</h1><p className="max-w-md text-body">Inténtalo nuevamente. Si el problema continúa, vuelve más tarde.</p><Button onClick={reset}>Reintentar</Button></main>
}
