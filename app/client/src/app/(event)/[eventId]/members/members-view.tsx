"use client"

import { useRouter } from "next/navigation"
import { Crown, X, Plus, ChevronLeft, Key, QrCode, Link2, Copy, Download } from "lucide-react"
import { notFound } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import QRCode from "react-qr-code"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { EventApi } from "../../_services/event-api"
import type { EventMemberInfo, EventDetail } from "../../_types/event"

function MemberItem({ 
  member, 
  isCurrentUserOwner, 
  isEventOpen,
  onRemove, 
  onTransfer 
}: { 
  member: EventMemberInfo, 
  isCurrentUserOwner: boolean,
  isEventOpen: boolean,
  onRemove: (id: string) => Promise<boolean>,
  onTransfer: (id: string) => Promise<boolean>
}) {
  const isOwner = member.role === "owner"
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isRemoveOpen, setIsRemoveOpen] = useState(false)

  const perform = async (action: (id: string) => Promise<boolean>, close: (open: boolean) => void) => {
    setIsSubmitting(true)
    try {
      if (await action(member.user_id)) close(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors gap-4 border border-transparent hover:border-white/5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0 border border-white/5 text-xl overflow-hidden">
          {member.image ? <img src={member.image} alt={member.name} className="w-full h-full object-cover" /> : member.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-white text-base">{member.name}</h4>
            {isOwner && (
              <span className="px-2 py-0.5 rounded-md bg-[#5f4dff]/20 text-[#5f4dff] text-[10px] font-bold uppercase tracking-wider border border-[#5f4dff]/20">
                Organizador
              </span>
            )}
          </div>
          <p className="text-xs text-[#9699be]">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        {isCurrentUserOwner && isEventOpen && !isOwner && (
          <>
            <AlertDialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
              <AlertDialogTrigger render={
                <button disabled={isSubmitting} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#5f4dff]/10 text-[#5f4dff] hover:bg-[#5f4dff]/20 transition-colors text-sm font-medium w-full disabled:cursor-wait disabled:opacity-50 sm:w-auto">
                  <Crown className="size-4" />
                  <span className="sm:hidden">Ascender</span>
                </button>
              } />
              <AlertDialogContent className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-[#181b27] p-8 text-white shadow-2xl">
                <AlertDialogHeader className="flex w-full flex-col !place-items-center gap-1.5 !text-center sm:!place-items-center sm:!text-center">
                  <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-[#bd7aff]/10 text-[#bd7aff]"><Crown className="size-8" aria-hidden="true" /></span>
                  <AlertDialogTitle className="w-full text-center">¿Ascender a organizador?</AlertDialogTitle>
                  <AlertDialogDescription className="w-full text-center text-[#9699be]">
                    ¿Estás seguro de que quieres ascender a {member.name} a organizador? Perderás tus privilegios de dueño.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <AlertDialogCancel disabled={isSubmitting} className="h-12 rounded-xl border-border bg-transparent text-white hover:bg-white/5">Cancelar</AlertDialogCancel>
                  <AlertDialogAction disabled={isSubmitting} onClick={() => perform(onTransfer, setIsTransferOpen)} className="h-12 rounded-xl bg-gradient-to-br from-[#5f4dff] to-[#1e1c9e] text-white shadow-[0_4px_12px_rgba(61,59,255,0.3)] transition-all hover:-translate-y-0.5">{isSubmitting ? "Procesando…" : "Aceptar"}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isRemoveOpen} onOpenChange={setIsRemoveOpen}>
              <AlertDialogTrigger render={
                <button disabled={isSubmitting} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#ff4d4d]/10 text-[#ff4d4d] hover:bg-[#ff4d4d]/20 transition-colors text-sm font-medium w-full disabled:cursor-wait disabled:opacity-50 sm:w-auto">
                  <X className="size-4" />
                  <span className="sm:hidden">Remover</span>
                </button>
              } />
              <AlertDialogContent className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-[#181b27] p-8 text-white shadow-2xl">
                <AlertDialogHeader className="flex w-full flex-col !place-items-center gap-1.5 !text-center sm:!place-items-center sm:!text-center">
                  <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-error/10 text-error"><X className="size-8" aria-hidden="true" /></span>
                  <AlertDialogTitle className="w-full text-center">¿Remover miembro?</AlertDialogTitle>
                  <AlertDialogDescription className="w-full text-center text-[#9699be]">
                    ¿Estás seguro que quieres remover a {member.name}? Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <AlertDialogCancel disabled={isSubmitting} className="h-12 rounded-xl border-border bg-transparent text-white hover:bg-white/5">Cancelar</AlertDialogCancel>
                  <AlertDialogAction disabled={isSubmitting} onClick={() => perform(onRemove, setIsRemoveOpen)} className="h-12 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#e65100] text-white shadow-[0_4px_12px_rgba(255,107,53,0.3)] transition-all hover:-translate-y-0.5">{isSubmitting ? "Procesando…" : "Remover"}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Componente cliente para visualizar y gestionar a los miembros de un evento.
 * Si el usuario autenticado es "owner", despliega funcionalidades para promover o eliminar,
 * además del flujo completo de creación de invitaciones (enlace, QR, y código).
 */
export function MembersClient({ eventId, initialMembers, isOwner, isEventOpen }: { eventId: string, initialMembers: EventMemberInfo[], isOwner: boolean, isEventOpen: boolean }) {
  const router = useRouter()
  const [members, setMembers] = useState<EventMemberInfo[]>(initialMembers)
  
  
  const [inviteCode, setInviteCode] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const m = await EventApi.getEventMembers(eventId)
      setMembers(m)
    } catch (err: any) {
      if (err.message !== "Error HTTP 404") {
        toast.error(err.message || "Error al cargar datos")
      }
    }
  }

  

  const handleRemove = async (memberId: string) => {
    try {
      await EventApi.removeMember(eventId, memberId)
      toast.success("Miembro removido")
      await fetchData()
      return true
    } catch (err: any) {
      toast.error(err.message)
      return false
    }
  }

  const handleTransfer = async (memberId: string) => {
    try {
      await EventApi.transferOwnership(eventId, memberId)
      toast.success("Propiedad transferida")
      router.replace("/my-events")
      router.refresh()
      return true
    } catch (err: any) {
      toast.error(err.message)
      return false
    }
  }

  const handleInvite = async (type: "link" | "code" | "qr") => {
    try {
      const inv = await EventApi.generateInvitation(eventId)
      const url = `${window.location.origin}/join?redirect=${inv.token_hash}`
      if (type === "link") {
        await navigator.clipboard.writeText(url)
        toast.success("Enlace copiado al portapapeles")
      } else if (type === "code") {
        await navigator.clipboard.writeText(inv.token_hash)
        toast.success("Código copiado al portapapeles")
      } else {
        setInviteCode(url) // for QR
        toast.success("QR generado")
      }
    } catch (err: any) {
      toast.error(err.message || "Error al generar invitación")
    }
  }

  

  

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-[#151a30]/50 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-2xl">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#9699be] hover:text-white transition-colors mb-4 text-sm font-medium"
        >
          <ChevronLeft className="size-4" />
          <span>Volver</span>
        </button>
        
        <div className="flex flex-row justify-between items-start mb-8">
          <div className="flex flex-col items-start">
            <h2 className="text-2xl font-semibold text-white">Miembros del evento</h2>
            <p className="text-xs text-[#9699be] mt-1">{members.length} miembros</p>
          </div>
          
          {isOwner && isEventOpen && (
            <Sheet>
              <SheetTrigger render={
                <button className="bg-[#3d3bff] hover:bg-[#3d3bff]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Invitar</span>
                </button>
              } />
              <SheetContent side="bottom" className="bg-[#181b27] border-t border-white/10 rounded-t-[32px] p-6 sm:max-w-2xl mx-auto">
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                </div>
                <SheetHeader className="mb-8">
                  <SheetTitle className="text-2xl font-semibold text-white text-left">Invitar personas</SheetTitle>
                </SheetHeader>
                
                {inviteCode ? (
                  <div className="flex flex-col items-center gap-4 mb-8 text-white">
                    <p className="text-center text-sm text-muted-foreground mb-4">Usa este enlace o código QR para invitar personas.</p>
                    {/* Placeholder for QR - typically an img generated by a library like react-qr-code or qrcode.react */}
                    <div className="bg-white p-4 rounded-xl flex items-center justify-center">
                      <QRCode value={inviteCode} size={160} level="H" />
                    </div>
                    <div className="flex gap-4 w-full">
                      <button onClick={() => setInviteCode(null)} className="w-1/2 py-2 border rounded-lg hover:bg-white/5">Volver</button>
                      <button onClick={() => {
                        // Fake download
                        toast.success("QR Descargado")
                      }} className="w-1/2 py-2 bg-[#3d3bff] rounded-lg hover:bg-[#3d3bff]/80 flex items-center justify-center gap-2">
                        <Download className="size-4"/> Descargar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 mb-8">
                    <button onClick={() => handleInvite("code")} className="w-full flex items-center gap-4 p-6 rounded-2xl text-left transition-all hover:-translate-y-0.5 group border border-white/15 bg-gradient-to-br from-[#5f4dff] to-[#1e1c9e] shadow-[0_10px_40px_rgba(61,59,255,0.3)]">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm border border-white/20 shrink-0">
                        <Key className="size-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-white mb-0.5">Generar código</h4>
                        <p className="text-sm text-white/80 leading-tight">Crea un código único de acceso</p>
                      </div>
                    </button>
                    
                    <button onClick={() => handleInvite("qr")} className="w-full flex items-center gap-4 p-6 rounded-2xl text-left transition-all hover:-translate-y-0.5 group border border-white/15 bg-gradient-to-br from-[#bd7aff] to-[#6900b3] shadow-[0_10px_40px_rgba(189,122,255,0.3)]">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm border border-white/20 shrink-0">
                        <QrCode className="size-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-white mb-0.5">Generar QR</h4>
                        <p className="text-sm text-white/80 leading-tight">Código escaneable para unirse rápido</p>
                      </div>
                    </button>

                    <button onClick={() => handleInvite("link")} className="w-full flex items-center gap-4 p-6 rounded-2xl text-left transition-all hover:-translate-y-0.5 group border border-white/15 bg-gradient-to-br from-[#ff6b35] to-[#e65100] shadow-[0_10px_40px_rgba(255,107,53,0.3)]">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm border border-white/20 shrink-0">
                        <Link2 className="size-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-white mb-0.5">Generar link de invitación</h4>
                        <p className="text-sm text-white/80 leading-tight">Enlace directo para compartir</p>
                      </div>
                    </button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <MemberItem 
              key={member.user_id} 
              member={member} 
              isCurrentUserOwner={isOwner} 
              isEventOpen={isEventOpen}
              onRemove={handleRemove}
              onTransfer={handleTransfer}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
