"use client"

import * as React from "react"
import { Trash2, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ExpenseApi } from "@/app/expenses/_services/expense-api"

interface ExpenseReceiptSheetProps {
  expenseId: string
  amount: string
  imageUrl?: string | null
  label: string
  onReceiptUpdated?: () => void
}

/** Bottom sheet interactivo para visualizar, subir, reemplazar o eliminar el comprobante. */
export function ExpenseReceiptSheet({
  expenseId,
  amount,
  imageUrl,
  label,
  onReceiptUpdated,
}: ExpenseReceiptSheetProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El comprobante no debe superar los 5 MB.")
      return
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast.error("Solo se aceptan imágenes JPEG, PNG y WebP.")
      return
    }

    setIsUploading(true)
    try {
      await ExpenseApi.uploadReceipt(expenseId, file)
      toast.success("Comprobante subido exitosamente.")
      onReceiptUpdated?.()
      setIsOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al subir el comprobante.")
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDelete() {
    setIsUploading(true)
    try {
      await ExpenseApi.deleteReceipt(expenseId)
      toast.success("Comprobante eliminado.")
      onReceiptUpdated?.()
      setIsOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar el comprobante.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className="group relative block w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Ver comprobante"
          />
        }
      >
        {imageUrl ? (
          <>
            <span
              role="img"
              aria-label={label}
              className="block min-h-60 rounded-xl border border-white/10 bg-cover bg-center shadow-lg transition-transform duration-300 group-hover:scale-[1.01]"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-neutral/20 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="rounded-full border border-white/20 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
                Ver pantalla completa
              </span>
            </span>
          </>
        ) : (
          <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-headline/5 p-6 text-center text-muted-foreground transition hover:bg-headline/10">
            <Upload className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium text-headline">Adjuntar comprobante</span>
            <span className="text-xs text-muted-foreground">JPEG, PNG o WebP (máx. 5 MB)</span>
          </div>
        )}
      </SheetTrigger>

      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[90dvh] overflow-y-auto rounded-t-[32px] border-border bg-overlay-surface p-6 text-headline sm:max-w-3xl"
      >
        <div className="mx-auto -mt-2 mb-3 h-1.5 w-12 rounded-full bg-headline/15" />
        <SheetHeader className="mb-5 flex-row items-start justify-between p-0">
          <div>
            <SheetTitle className="text-xl">Comprobante del gasto</SheetTitle>
            <SheetDescription>{label}</SheetDescription>
          </div>
          <SheetClose render={<Button variant="ghost" size="icon" aria-label="Cerrar comprobante" />}>
            <X aria-hidden="true" />
          </SheetClose>
        </SheetHeader>

        {imageUrl ? (
          <>
            <div
              role="img"
              aria-label={label}
              className="min-h-[50dvh] rounded-2xl border border-white/10 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total verificado</span>
              <strong className="text-headline font-semibold">{amount}</strong>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-headline/5 py-3 text-sm font-medium text-headline transition hover:bg-headline/10">
                <Upload className="size-4" />
                <span>Reemplazar comprobante</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="sr-only"
                />
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={isUploading}
                className="rounded-xl border-error/30 text-error hover:bg-error/10 hover:text-error"
              >
                <Trash2 className="mr-1 size-4" />
                Eliminar
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Upload className="size-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Aún no se ha adjuntado un comprobante digital a este gasto.
            </p>
            <label className="cursor-pointer rounded-xl bg-action-orange px-6 py-3 text-sm font-semibold text-action-orange-foreground shadow hover:bg-action-orange/90">
              <span>Subir comprobante ahora</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={isUploading}
                className="sr-only"
              />
            </label>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
