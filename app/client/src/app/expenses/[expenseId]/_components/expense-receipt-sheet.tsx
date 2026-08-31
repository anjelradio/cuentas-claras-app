"use client"

import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface ExpenseReceiptSheetProps {
  amount: string
  imageUrl: string
  label: string
}

/** Amplía el comprobante del gasto en un bottom sheet accesible. */
export function ExpenseReceiptSheet({ amount, imageUrl, label }: ExpenseReceiptSheetProps) {
  return (
    <Sheet>
      <SheetTrigger render={<button type="button" className="group relative block w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Ampliar comprobante" />}>
        <span role="img" aria-label={label} className="block min-h-64 rounded-xl border border-white/10 bg-cover bg-center shadow-lg transition-transform duration-300 group-hover:scale-[1.01]" style={{ backgroundImage: `url(${imageUrl})` }} />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-neutral/20 opacity-0 transition-opacity group-hover:opacity-100"><span className="rounded-full border border-white/20 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">Ver pantalla completa</span></span>
      </SheetTrigger>
      <SheetContent side="bottom" showCloseButton={false} className="max-h-[90dvh] overflow-y-auto rounded-t-[32px] border-border bg-overlay-surface p-6 text-headline sm:max-w-3xl">
        <div className="mx-auto -mt-2 mb-3 h-1.5 w-12 rounded-full bg-headline/15" />
        <SheetHeader className="mb-5 flex-row items-start justify-between p-0">
          <div><SheetTitle className="text-xl">Comprobante del gasto</SheetTitle><SheetDescription>{label}</SheetDescription></div>
          <SheetClose render={<Button variant="ghost" size="icon" aria-label="Cerrar comprobante" />}><X aria-hidden="true" /></SheetClose>
        </SheetHeader>
        <div role="img" aria-label={label} className="min-h-[55dvh] rounded-2xl border border-white/10 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${imageUrl})` }} />
        <div className="mt-4 flex items-center justify-between text-sm"><span className="text-muted-foreground">Total verificado</span><strong>{amount}</strong></div>
      </SheetContent>
    </Sheet>
  )
}
