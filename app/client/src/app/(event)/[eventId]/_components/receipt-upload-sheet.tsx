"use client"

import * as React from "react"
import { Sparkles, X } from "lucide-react"

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ReceiptUploadStep } from "@/components/custom/receipt-upload-step"

interface ReceiptUploadSheetProps {
  eventId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReceiptUploadSheet({
  eventId,
  open,
  onOpenChange,
}: ReceiptUploadSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-[32px] border-border bg-overlay-surface p-6 text-headline sm:max-w-xl sm:mx-auto"
      >
        <div className="mb-4 flex justify-center" aria-hidden="true">
          <div className="h-1.5 w-12 rounded-full bg-headline/20" />
        </div>

        <SheetHeader className="mb-6 flex-row items-center justify-between p-0">
          <div>
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-primary animate-pulse" />
              Adjuntar comprobante o foto
            </SheetTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Facturas, recibos o compras del mercado. La foto es requerida para continuar.
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

        <ReceiptUploadStep
          eventId={eventId}
          onSuccess={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

