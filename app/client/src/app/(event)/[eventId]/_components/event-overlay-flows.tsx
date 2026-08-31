"use client"

import { ArrowLeft, KeyRound, Link2, QrCode, Users, X } from "lucide-react"
import { toast } from "sonner"
import { EventApi } from "../../_services/event-api"


import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { BottomSheetActionButton } from "@/components/custom/bottom-sheet-action-button"
import { ReceiptUploadPlaceholder } from "@/components/custom/receipt-upload-placeholder"
import type {
  DebtSummary,
  EventOverlayState,
  EventView,
  InvitationOption,
} from "../../_types/event-home-types"

interface EventOverlayFlowsProps {
  openOverlay: EventOverlayState | null
  event: EventView
  invitations: InvitationOption[]
  debts: DebtSummary[]
  onOpenChange: (overlay: EventOverlayState | null) => void
}

/**
 * Agrupa los overlays estáticos de Event Home y conserva el contrato de cierre
 * común para que cada acción pueda restaurar su foco de origen.
 */
export function EventOverlayFlows({
  openOverlay,
  event,
  invitations,
  debts,
  onOpenChange,
}: EventOverlayFlowsProps) {
  
  const close = () => onOpenChange(null)

  const handleInvite = async (type: string) => {
    try {
      const inv = await EventApi.generateInvitation(event.id)
      const url = `${window.location.origin}/join?redirect=${inv.token_hash}`
      if (type === "generate-link") {
        await navigator.clipboard.writeText(url)
        toast.success("Enlace copiado al portapapeles")
      } else if (type === "generate-code") {
        await navigator.clipboard.writeText(inv.token_hash)
        toast.success("Código copiado al portapapeles")
      } else {
        toast.info("El QR se encuentra disponible en la vista de miembros.")
      }
      close()
    } catch (err: any) {
      toast.error(err.message || "Error al generar invitación")
    }
  }


  return (
    <>
      <Sheet open={openOverlay === "invite"} onOpenChange={(open) => !open && close()}>
        <SheetContent side="bottom" showCloseButton={false} className="max-h-[90vh] rounded-t-[2rem] border-border bg-overlay-surface p-6 text-headline sm:max-w-2xl">
          <div className="mb-6 flex justify-center" aria-hidden="true"><span className="h-1.5 w-12 rounded-full bg-headline/20" /></div>
          <SheetHeader className="flex-row items-start justify-between gap-4 p-0">
            <div>
              <SheetTitle className="text-2xl text-headline">Invitar personas</SheetTitle>
              <SheetDescription className="mt-2 text-body/70">
                Comparte el evento con tu grupo usando cualquiera de estas opciones.
              </SheetDescription>
            </div>
            <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label="Cerrar invitación" />}>
              <X aria-hidden="true" />
            </SheetClose>
          </SheetHeader>
          <div className="mt-6 grid gap-4">
            {invitations.map((option) => {
              const invitationStyle = {
                "generate-code": { icon: KeyRound, variant: "blue" },
                "generate-qr": { icon: QrCode, variant: "purple" },
                "generate-link": { icon: Link2, variant: "orange" },
              } as const
              const { icon, variant } = invitationStyle[option.id as keyof typeof invitationStyle]
              return (
                <BottomSheetActionButton
                  key={option.id}
                  icon={icon}
                  title={option.label}
                  description={option.description}
                  variant={variant}
                  layout="inline"
                  onClick={() => handleInvite(option.id)}
                />
              )
            })}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={openOverlay === "expense"} onOpenChange={(open) => !open && close()}>
        <SheetContent side="bottom" showCloseButton={false} className="max-h-[90vh] rounded-t-[2rem] border-border bg-overlay-surface p-6 text-headline sm:max-w-2xl">
          <SheetHeader className="flex-row items-start justify-between p-0">
            <div>
              <SheetTitle className="text-2xl text-headline">Registrar gasto</SheetTitle>
              <SheetDescription className="mt-2 text-body/70">Adjunta la factura del gasto para continuar.</SheetDescription>
            </div>
            <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label="Cerrar registro de gasto" />}>
              <X aria-hidden="true" />
            </SheetClose>
          </SheetHeader>
          <div className="mt-6">
            <ReceiptUploadPlaceholder onContinue={close} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={openOverlay === "debts"} onOpenChange={(open) => !open && close()}>
        <SheetContent side="bottom" showCloseButton={false} className="max-h-[90vh] rounded-t-[2rem] border-border bg-overlay-surface p-6 text-headline sm:max-w-2xl">
          <SheetHeader className="flex-row items-start justify-between p-0">
            <div>
              <SheetTitle className="text-2xl text-headline">Mis deudas</SheetTitle>
              <SheetDescription className="mt-2 text-body/70">Saldos de referencia del evento.</SheetDescription>
            </div>
            <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label="Cerrar deudas" />}>
              <X aria-hidden="true" />
            </SheetClose>
          </SheetHeader>
          <ul className="mt-6 grid gap-3" aria-label="Deudas del evento">
            {debts.map((debt) => (
              <li key={debt.id} className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-background/40 p-4">
                <div className="flex items-center gap-3">
                  <span className={`flex size-10 items-center justify-center rounded-full ${debt.direction === "owed" ? "bg-success/15 text-success" : "bg-error/15 text-error"}`}>
                    <Users className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-medium text-headline">{debt.person}</p>
                    <p className="text-sm text-body/65">{debt.description}</p>
                  </div>
                </div>
                <span className="font-semibold text-headline">{debt.amountLabel}</span>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      <Dialog open={openOverlay === "join"} onOpenChange={(open) => !open && close()}>
        <DialogContent showCloseButton={false} className="border-border bg-overlay-surface text-headline sm:max-w-md">
          <DialogHeader className="flex-row items-start justify-between">
            <div>
              <DialogTitle className="text-headline">Unirme a un evento</DialogTitle>
              <DialogDescription className="mt-2 text-body/70">Introduce el código compartido por tu grupo.</DialogDescription>
            </div>
            <DialogClose render={<Button variant="ghost" size="icon-sm" aria-label="Cerrar unión a evento" />}>
              <X aria-hidden="true" />
            </DialogClose>
          </DialogHeader>
          <label className="grid gap-2 text-sm text-label" htmlFor="preview-event-code">
            Código de evento
            <input id="preview-event-code" className="h-11 rounded-lg border border-border bg-background/60 px-3 text-body uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="ABC-123" />
          </label>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button type="button" onClick={close}>Continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openOverlay === "select"} onOpenChange={(open) => !open && close()}>
        <DialogContent showCloseButton={false} className="border-border bg-overlay-surface text-headline sm:max-w-md">
          <DialogHeader className="flex-row items-start justify-between">
            <div>
              <DialogTitle className="text-headline">Seleccionar evento</DialogTitle>
              <DialogDescription className="mt-2 text-body/70">Elige un evento para continuar con el registro visual.</DialogDescription>
            </div>
            <DialogClose render={<Button variant="ghost" size="icon-sm" aria-label="Cerrar selección de evento" />}>
              <X aria-hidden="true" />
            </DialogClose>
          </DialogHeader>
          <button type="button" className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/40 p-4 text-left hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={close}>
            <span className="flex size-10 items-center justify-center rounded-full bg-tertiary/15 text-tertiary"><Link2 className="size-5" aria-hidden="true" /></span>
            <span><span className="block font-medium text-headline">{event.name}</span><span className="block text-sm text-body/65">{event.memberCount} miembros</span></span>
          </button>
          <Button type="button" variant="outline" onClick={() => onOpenChange("expense")}><ArrowLeft className="size-4" aria-hidden="true" /> Volver al registro</Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
