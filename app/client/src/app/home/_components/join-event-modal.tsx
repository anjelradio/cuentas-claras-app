"use client"

import * as React from "react"
import { LogIn, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { QuickActionButton } from "@/components/custom/quick-action-button"
import { EventApi } from "../../(event)/_services/event-api"

export function JoinEventModal() {
  const [open, setOpen] = React.useState(false)
  const [code, setCode] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const handleJoin = async () => {
    if (!code.trim()) {
      toast.error("Ingresa un código")
      return
    }
    setLoading(true)
    try {
      await EventApi.joinEvent(code.trim())
      toast.success("Te has unido al evento exitosamente")
      setOpen(false)
      setCode("")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Error al unirse al evento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <QuickActionButton
          icon={LogIn}
          title="Unirme a un evento"
          description="Usa un código para entrar a un grupo"
          variant="primary-orange"
        />
      } />
      <DialogContent showCloseButton={false} className="sm:max-w-md bg-[#181b27] border-border text-white rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="p-0 flex flex-row justify-between items-center space-y-0">
          <DialogTitle className="text-xl font-semibold">Unirme a un evento</DialogTitle>
          <DialogClose render={
            <button className="text-muted-foreground hover:text-white transition-colors p-1" aria-label="Cerrar">
              <X className="size-6" />
            </button>
          } />
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-2">
          <div>
            <label className="sr-only" htmlFor="codigo-evento">
              Código de evento
            </label>
            <input
              id="codigo-evento"
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Código de evento (Ej. ABC-123)"
              className="w-full bg-[#151a30]/80 border border-border rounded-xl px-4 py-6 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#ff6b1a]/50 focus:border-[#ff6b1a]/50 transition-all text-center text-lg"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <DialogClose render={
              <button disabled={loading} className="w-full sm:w-1/2 px-4 py-4 rounded-xl border border-border bg-transparent hover:bg-surface-high transition-colors text-sm font-medium text-white order-2 sm:order-1 disabled:opacity-50">
                Cancelar
              </button>
            } />
            <button 
              disabled={loading}
              className="w-full sm:w-1/2 px-4 py-4 rounded-xl text-white font-medium text-sm transition-all shadow-[0_4px_12px_rgba(255,107,26,0.3)] hover:shadow-[0_6px_16px_rgba(255,107,26,0.4)] hover:-translate-y-0.5 order-1 sm:order-2 disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: "linear-gradient(135deg, rgb(255, 107, 53) 0%, rgb(230, 81, 0) 100%)" }}
              onClick={handleJoin}
            >
              {loading ? "Cargando..." : "Unirse"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
