"use client"

import { LogOut, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"

import { EventApi } from "../../_services/event-api"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export function LeaveEventDialog({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  async function leave() {
    setIsSubmitting(true)
    try {
      await EventApi.leaveEvent(eventId)
      toast.success("Abandonaste el evento")
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abandonar el evento")
    } finally {
      setIsSubmitting(false)
    }
  }
  return <AlertDialog open={open} onOpenChange={setOpen}>
    <AlertDialogTrigger render={<Button variant="outline" size="sm" disabled={isSubmitting} onClick={(event) => event.stopPropagation()} />}><LogOut className="size-3.5" />Abandonar</AlertDialogTrigger>
    <AlertDialogContent className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-[#181b27] p-8 text-white shadow-2xl">
      <AlertDialogHeader className="flex w-full flex-col !place-items-center gap-1.5 !text-center sm:!place-items-center sm:!text-center">
        <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-error/10 text-error"><X className="size-8" aria-hidden="true" /></span>
        <AlertDialogTitle className="w-full text-center">¿Abandonar evento?</AlertDialogTitle>
        <AlertDialogDescription className="w-full text-center text-[#9699be]">Dejarás de participar en este evento. Esta acción no elimina el historial compartido.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="grid grid-cols-1 gap-3 sm:grid-cols-2"><AlertDialogCancel disabled={isSubmitting} className="h-12 rounded-xl border-border bg-transparent text-white hover:bg-white/5">Cancelar</AlertDialogCancel><AlertDialogAction disabled={isSubmitting} onClick={leave} className="h-12 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#e65100] text-white shadow-[0_4px_12px_rgba(255,107,26,0.3)] transition-all hover:-translate-y-0.5 hover:from-[#ff6b35] hover:to-[#e65100]">{isSubmitting ? "Abandonando…" : "Abandonar"}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
}
