"use client"

import { useState } from "react"
import { UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { getAuthErrorMessage } from "@/lib/auth-errors"
import { NotificationsBell } from "@/features/notifications/components/notifications-bell"

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
    <header className="glass-panel backdrop-blur-[20px] rounded-[20px] flex justify-between items-center py-4 px-5 md:px-8 top-4 z-40 fixed w-[calc(100%-2rem)] max-w-5xl mx-auto left-0 right-0">
      {/* Logo & Branding */}
      <Link href="/home" className="flex items-center gap-3 cursor-pointer">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white overflow-hidden">
          <img 
            alt="Cuentas Claras Logo" 
            className="w-full h-full object-cover rounded-xl" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8zuhBAw92hsIizvZm_XNIUL7Xp2AMrJSzwiTVQ89JSqhRZAt1PhWXdu5JhSIeviLe1EGHp7q4Pc2xixgWgKihbl3f5ojV362kaRO903K_TMCumHfd09937nyWu2j-cuo03KknzY1rLuqZ0TKPvSmMW-QQs8qrWjtzdAlOC1W2ci3pssskpfAGFLVRe2FT9z0wCZYpePBZ9ej72LjYlf7X8lMaBCjy8tw0ltpZzKVSqhfFU-gLU_gnjtNGqhEHN1qUj5M"
          />
        </div>
        <h1 className="text-xl font-semibold tracking-wide text-white">Cuentas Claras</h1>
      </Link>
      
      {/* User Profile & Actions */}
      <div className="flex items-center gap-4 sm:gap-6">
        <NotificationsBell />
        <div className="text-right hidden sm:block">
          <p className="font-medium text-sm text-white">{user.name}</p>
          <p className="text-xs text-[#bd7aff]">Mi perfil</p>
        </div>
        <div className="w-10 h-10 bg-[#bd7aff] rounded-full flex items-center justify-center overflow-hidden">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <UserRound className="size-5 text-white" />
          )}
        </div>
        <button
          onClick={handleSignOut}
          disabled={isPending}
          className="px-5 py-2 rounded-xl border border-border bg-transparent hover:bg-surface-high transition-colors text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Saliendo..." : "Salir"}
        </button>
      </div>
    </header>
  )
}
