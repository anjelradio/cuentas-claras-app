"use client"

import { useState } from "react"
import { LogOut, UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { getAuthErrorMessage } from "@/lib/auth-errors"
import { authClient } from "@/lib/auth-client"

/**
 * Encabezado de la zona protegida que muestra la identidad de sesión y permite salir.
 * La imagen procede del proveedor autenticado; el icono de Lucide es su alternativa segura.
 */
export function HomeHeader({ user }: { user: { name: string; email: string; image?: string | null } }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleSignOut() {
    setIsPending(true)
    const result = await authClient.signOut()
    setIsPending(false)

    if (result.error) {
      toast.error(getAuthErrorMessage(result.error))
      return
    }

    router.replace("/auth/login")
    router.refresh()
  }

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
      <div className="flex min-w-0 items-center gap-3">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- La imagen OAuth puede proceder de varios dominios remotos.
          <img src={user.image} alt="" className="size-10 rounded-full border border-border object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden="true"><UserRound className="size-5" /></span>
        )}
        <div className="min-w-0"><p className="truncate font-medium text-headline">{user.name}</p><p className="truncate text-sm text-body">{user.email}</p></div>
      </div>
      <Button type="button" variant="outline" disabled={isPending} onClick={handleSignOut}>
        <LogOut aria-hidden="true" /> {isPending ? "Saliendo…" : "Salir"}
      </Button>
    </header>
  )
}
