"use client"

import * as React from "react"
import { ArrowDownLeft, ArrowLeft, X } from "lucide-react"

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { QuickActionButton } from "@/components/custom/quick-action-button"
import { ReceiptUploadPlaceholder } from "@/components/custom/receipt-upload-placeholder"
import type { EventSummary } from "../../(event)/_types/event"

export function AddExpenseSheet({ activeEvents = [] }: { activeEvents?: EventSummary[] }) {
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<"select" | "upload">("select")

  React.useEffect(() => {
    if (!open) {
      setTimeout(() => setStep("select"), 300)
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={
        <QuickActionButton
          icon={ArrowDownLeft}
          title="Registrar gasto"
          description="Elige un evento y añade el gasto"
          variant="secondary-green"
        />
      } />

      <SheetContent showCloseButton={false} side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-[32px] border-border bg-overlay-surface p-6 text-headline">
        <div className="mb-6 flex justify-center" aria-hidden="true">
          <div className="h-1.5 w-12 rounded-full bg-headline/20" />
        </div>

        {step === "select" && (
          <div className="flex h-full flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
            <SheetHeader className="mb-8 flex-row items-center justify-between space-y-0 p-0">
              <SheetTitle className="text-2xl font-semibold text-headline">Seleccionar evento</SheetTitle>
              <SheetClose render={<button className="p-1 text-muted-foreground transition-colors hover:text-headline" aria-label="Cerrar"><X className="size-6" /></button>} />
            </SheetHeader>

            <div className="flex flex-col gap-2" aria-live="polite">
              {activeEvents.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No tienes eventos abiertos disponibles.
                </p>
              ) : activeEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setStep("upload")}
                  className="flex items-center gap-4 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-border hover:bg-headline/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-2xl" aria-hidden="true">
                    {event.icon}
                  </span>
                  <span>
                    <span className="mb-0.5 block font-medium text-headline">{event.name}</span>
                    <span className="block text-xs text-muted-foreground">{event.member_count} miembros</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "upload" && (
          <div className="flex h-full flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setStep("select")} className="-ml-2 rounded-full p-2 transition-colors hover:bg-headline/10" aria-label="Volver a seleccionar evento">
                  <ArrowLeft className="size-5" aria-hidden="true" />
                </button>
                <h3 className="text-2xl font-semibold text-headline">Adjuntar comprobante</h3>
              </div>
              <SheetClose render={<button className="p-1 text-muted-foreground transition-colors hover:text-headline" aria-label="Cerrar"><X className="size-6" /></button>} />
            </div>

            <ReceiptUploadPlaceholder onContinue={() => setOpen(false)} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
