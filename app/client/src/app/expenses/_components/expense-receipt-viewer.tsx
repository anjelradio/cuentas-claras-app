"use client"

import * as React from "react"
import { Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface ExpenseReceiptViewerProps {
  receiptUrl: string | null
  isEditing: boolean
}

/** Componente de visualización y Sheet modal para comprobantes de gastos. */
export function ExpenseReceiptViewer({ receiptUrl, isEditing }: ExpenseReceiptViewerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  if (!receiptUrl) {
    if (isEditing) {
      return (
        <div className="flex justify-center pt-1 text-xs text-muted-foreground italic">
          Este gasto no tiene comprobante adjunto.
        </div>
      )
    }
    return null
  }

  return (
    <>
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer underline underline-offset-4 decoration-cyan-400/40 hover:decoration-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-sm"
        >
          <Eye className="size-4 group-hover:scale-110 transition-transform" />
          <span>Ver comprobante adjunto</span>
        </button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[90vh] overflow-y-auto rounded-t-[32px] border-border bg-overlay-surface p-6 text-headline sm:max-w-xl sm:mx-auto"
        >
          <div className="mb-4 flex justify-center" aria-hidden="true">
            <div className="h-1.5 w-12 rounded-full bg-headline/20" />
          </div>

          <SheetHeader className="mb-4 flex-row items-center justify-between p-0">
            <div>
              <SheetTitle className="text-lg font-bold text-headline">
                Comprobante del gasto
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Foto adjunta al registro del gasto
              </p>
            </div>
            <SheetClose
              render={
                <button
                  className="p-1 text-muted-foreground transition-colors hover:text-headline"
                  aria-label="Cerrar"
                >
                  <X className="size-6" />
                </button>
              }
            />
          </SheetHeader>

          <div className="flex flex-col gap-5">
            <div className="relative flex max-h-[60vh] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-2 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receiptUrl}
                alt="Comprobante del gasto"
                className="max-h-[55vh] w-full object-contain rounded-xl"
              />
            </div>

            <SheetClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-xl text-sm font-medium"
                >
                  Cerrar
                </Button>
              }
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
