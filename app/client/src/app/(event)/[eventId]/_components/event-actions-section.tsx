"use client"

import Link from "next/link"
import { FileUp, KeyRound, Pencil, QrCode, Users, UserRound, XCircle, X } from "lucide-react"
import { toast } from "sonner"
import * as React from "react"
import { useRouter } from "next/navigation"

import { QuickActionButton } from "@/components/custom/quick-action-button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

import type { DebtSummary, EventOverlayState, EventView, InvitationOption } from "../../_types/event-home-types"
import { EventOverlayFlows } from "./event-overlay-flows"
import { EventApi } from "../../_services/event-api"
import { QrSheet } from "./qr-sheet"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ReceiptUploadPlaceholder } from "@/components/custom/receipt-upload-placeholder"

/**
 * Expone las acciones principales de un evento y concentra sus overlays locales.
 */
interface EventActionsSectionProps {
  event: EventView
  invitations?: InvitationOption[]
  debts?: DebtSummary[]
  qrImage?: string | null
}

export function EventActionsSection({
  event,
  invitations = [],
  debts = [],
  qrImage = null,
  isOwner = false
}: EventActionsSectionProps & { isOwner?: boolean }) {
  const [openOverlay, setOpenOverlay] = React.useState<EventOverlayState | null>(null)
  const [isQrOpen, setIsQrOpen] = React.useState(false)
  const [isExpenseOpen, setIsExpenseOpen] = React.useState(false)
  const [isChangingStatus, setIsChangingStatus] = React.useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = React.useState(false)
  const router = useRouter()
  const isOpen = event.status !== "closed"

  const toggleEventStatus = async () => {
    setIsChangingStatus(true)
    try {
      await EventApi.updateEvent(event.id, { status: isOpen ? "closed" : "open" })
      toast.success(isOpen ? "El evento fue cerrado." : "El evento fue reabierto.")
      setIsStatusDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el evento.")
    } finally {
      setIsChangingStatus(false)
    }
  }

  return (
    <section aria-labelledby="event-actions-title" className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="event-actions-title" className="text-lg font-semibold text-headline">Acciones del evento</h2>
        {isOwner && (
          <div className="hidden items-center gap-3 sm:flex">
            {isOpen && <Link href={`/${event.id}/edit-event`} className="inline-flex h-8 items-center gap-1 px-0 text-xs font-semibold uppercase tracking-wider text-tertiary transition-colors hover:text-tertiary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Pencil className="size-3.5" aria-hidden="true" />
              Editar evento
            </Link>}
            <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
              <AlertDialogTrigger render={<button type="button" disabled={isChangingStatus} className="inline-flex h-8 items-center gap-1 px-0 text-xs font-semibold uppercase tracking-wider text-error transition-colors hover:text-error/80 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />}>
                <XCircle className="size-3.5" aria-hidden="true" />
                {isOpen ? "Cerrar evento" : "Reabrir evento"}
              </AlertDialogTrigger>
              <AlertDialogContent className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-[#181b27] p-8 text-white shadow-2xl">
                <AlertDialogHeader className="flex w-full flex-col !place-items-center gap-1.5 !text-center sm:!place-items-center sm:!text-center">
                  <span className={`mb-2 flex size-16 items-center justify-center rounded-full ${isOpen ? "bg-error/10 text-error" : "bg-success/10 text-success"}`}><XCircle className="size-8" aria-hidden="true" /></span>
                  <AlertDialogTitle className="w-full text-center">{isOpen ? "¿Cerrar evento?" : "¿Reabrir evento?"}</AlertDialogTitle>
                  <AlertDialogDescription className="w-full text-center text-[#9699be]">{isOpen ? "El evento quedará solo para consulta hasta que lo reabras." : "Las acciones del evento volverán a estar disponibles para sus miembros."}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <AlertDialogCancel disabled={isChangingStatus} className="h-12 rounded-xl border-border bg-transparent text-white hover:bg-white/5">Cancelar</AlertDialogCancel>
                  <AlertDialogAction disabled={isChangingStatus} onClick={toggleEventStatus} className={`h-12 rounded-xl text-white shadow-[0_4px_12px_rgba(255,107,26,0.3)] transition-all hover:-translate-y-0.5 ${isOpen ? "bg-gradient-to-br from-[#ff6b35] to-[#e65100] hover:from-[#ff6b35] hover:to-[#e65100]" : "bg-gradient-to-br from-[#5f4dff] to-[#1e1c9e]"}`}>{isChangingStatus ? "Guardando…" : isOpen ? "Cerrar evento" : "Reabrir evento"}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="sr-only" aria-label="Flujos adicionales de presentación">
        <button type="button" onClick={() => setOpenOverlay("join")}>Unirme a un evento</button>
        <button type="button" onClick={() => setOpenOverlay("select")}>Seleccionar evento</button>
      </div>

      {isOwner && isOpen && (
      <QuickActionButton
        icon={Users}
        title="Invitar personas"
        description="Comparte el código para que otros se unan"
        variant="primary-orange"
        layout="horizontal"
        onClick={() => setOpenOverlay("invite")}
      />
      )}
      <div className="grid grid-cols-2 gap-4">
        <Sheet open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
          <SheetTrigger render={
            <QuickActionButton
              icon={FileUp}
              title="Registrar gasto"
              description="Añade un nuevo gasto al grupo"
              variant="primary-purple"
              disabled={!isOpen}
            />
          } />
          <SheetContent showCloseButton={false} side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-[32px] border-border bg-overlay-surface p-6 text-headline">
            <div className="mb-6 flex justify-center" aria-hidden="true">
              <div className="h-1.5 w-12 rounded-full bg-headline/20" />
            </div>
            <div className="flex h-full flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="mb-8 flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-headline">Adjuntar comprobante</h3>
                <SheetClose render={<button className="p-1 text-muted-foreground transition-colors hover:text-headline" aria-label="Cerrar"><X className="size-6" /></button>} />
              </div>
              <ReceiptUploadPlaceholder onContinue={() => setIsExpenseOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <QuickActionButton
          icon={KeyRound}
          title="Mis deudas"
          description="Consulta tus saldos pendientes"
          variant="secondary-purple"
          onClick={() => setOpenOverlay("debts")}
        />
        <QuickActionButton
          icon={UserRound}
          title="Ver miembros"
          description="Gestiona quién participa en el grupo"
          variant="secondary-purple"
          onClick={() => router.push(`/${event.id}/members`)}
        />
        <QuickActionButton
          icon={QrCode}
          title="Registrar QR"
          description="Sube un comprobante de pago QR"
          variant="primary-blue"
          onClick={() => setIsQrOpen(true)}
        />
      </div>

      {isOwner && (
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          {isOpen && <Link href={`/${event.id}/edit-event`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-tertiary/25 bg-tertiary/10 px-3 text-xs font-semibold uppercase tracking-wider text-tertiary transition-colors hover:bg-tertiary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Pencil className="size-4" aria-hidden="true" />Editar evento</Link>}
          <button type="button" disabled={isChangingStatus} onClick={() => setIsStatusDialogOpen(true)} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isOpen ? "border-error/25 bg-error/10 text-error hover:bg-error/15" : "border-success/25 bg-success/10 text-success hover:bg-success/15"}`}><XCircle className="size-4" aria-hidden="true" />{isOpen ? "Cerrar evento" : "Reabrir evento"}</button>
        </div>
      )}

      <EventOverlayFlows
        openOverlay={openOverlay}
        event={event}
        invitations={invitations}
        debts={debts}
        onOpenChange={setOpenOverlay}
      />
      <QrSheet eventId={event.id} imageUrl={qrImage} isOpen={isOpen} open={isQrOpen} onOpenChange={setIsQrOpen} />
    </section>
  )
}
