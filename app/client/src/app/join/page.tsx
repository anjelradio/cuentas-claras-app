"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { EventApi } from "../(event)/_services/event-api"
import { toast } from "sonner"
import { Key } from "lucide-react"
import { StatusPageHeader } from "@/components/layout/status-page-header"
import { buildLoginPath } from "@/lib/auth-redirect"

function JoinFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectToken = searchParams.get("redirect")

  useEffect(() => {
    if (!redirectToken) {
      router.replace("/home")
      return
    }

    // Check auth
    authClient.getSession().then(({ data }) => {
      if (!data?.session) {
        // Not logged in, redirect to login with the same param
        router.push(buildLoginPath(redirectToken))
      } else {
        // Logged in, attempt to join
        EventApi.joinEvent(redirectToken)
          .then(() => {
            toast.success("Te has unido al evento exitosamente")
            router.push("/home")
          })
          .catch(err => {
            if (err.message === "Ya eres miembro de este evento.") {
              toast.success("Ya eres miembro de este evento")
              router.push("/home")
            } else {
              toast.error(err.message || "Error al unirse al evento")
              router.push("/home")
            }
          })
      }
    })
  }, [redirectToken, router])

  return (
    <div className="glass-panel flex w-full max-w-2xl flex-col items-center gap-8 rounded-[32px] p-8 text-center md:p-12 py-16">
      <div className="relative w-24 h-24 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-[#3d3bff] animate-spin shadow-[0_0_15px_rgba(61,59,255,0.5)]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Key className="size-10 text-[#3d3bff] animate-pulse" />
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">Verificando código</h2>
        <p className="text-[#9699be] text-lg leading-relaxed max-w-md mx-auto">
          Estamos validando tu invitación para darte acceso al grupo. <br className="hidden md:block" />
          <span className="text-white/60 text-sm mt-4 block">Esto solo tomará un momento...</span>
        </p>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <StatusPageHeader />
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-12 pt-32 md:px-8 lg:pt-40">
        <Suspense fallback={
          <div className="glass-panel flex w-full max-w-2xl flex-col items-center gap-8 rounded-[32px] p-8 text-center md:p-12 py-16 animate-pulse">
            <div className="w-24 h-24 rounded-full bg-white/10 mb-4"></div>
            <div className="h-8 w-64 bg-white/10 rounded mb-4"></div>
            <div className="h-4 w-48 bg-white/10 rounded"></div>
          </div>
        }>
          <JoinFlow />
        </Suspense>
      </main>
    </div>
  )
}
