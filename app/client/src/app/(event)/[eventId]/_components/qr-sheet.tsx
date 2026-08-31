"use client"

import * as React from "react"
import { Upload, UploadCloud, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { EventApi } from "../../_services/event-api"

interface QrSheetProps {
  eventId: string
  imageUrl: string | null
  isOpen: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024

export function QrSheet({ eventId, imageUrl, isOpen, open, onOpenChange }: QrSheetProps) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [file, setFile] = React.useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const selectFile = (candidate: File | undefined) => {
    if (!candidate) return
    if (!ACCEPTED_TYPES.includes(candidate.type) || candidate.size > MAX_SIZE) {
      toast.error("El QR debe ser JPG, PNG o WebP y pesar como máximo 5 MB.")
      return
    }
    setFile(candidate)
  }

  const upload = async () => {
    if (!file) return
    setIsSubmitting(true)
    try {
      await EventApi.upsertMyQr(eventId, file)
      toast.success(imageUrl ? "Tu QR fue actualizado." : "Tu QR fue registrado.")
      setFile(null)
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el QR.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="flex min-h-[82dvh] max-h-[96dvh] flex-col overflow-y-auto rounded-t-[2rem] border-border bg-overlay-surface p-6 text-headline sm:max-w-4xl">
        <SheetHeader className="shrink-0 flex-row items-start justify-between p-0">
          <div>
            <SheetTitle className="text-2xl text-headline">Mi código QR</SheetTitle>
            <SheetDescription className="mt-2 text-body/70">Comparte el QR donde deseas recibir pagos del evento.</SheetDescription>
          </div>
          <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label="Cerrar QR" />}><X aria-hidden="true" /></SheetClose>
        </SheetHeader>

        <div className="mt-6 flex flex-1 flex-col justify-between gap-4">
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            {imageUrl && <img src={imageUrl} alt="Tu código QR registrado" className="mx-auto max-h-[65dvh] w-full flex-1 rounded-2xl border border-border bg-background p-4 object-contain" />}
            {file && <p className="w-full rounded-xl border border-border bg-background/40 p-4 text-sm text-body shrink-0">Archivo seleccionado: <strong className="text-headline">{file.name}</strong></p>}
          </div>
          
          <div className="grid shrink-0 gap-4 pt-2">
            {isOpen ? (
              <>
                <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0])} />
                {imageUrl ? (
                  <Button type="button" onClick={() => inputRef.current?.click()} className="w-full bg-action-orange text-action-orange-foreground hover:bg-action-orange/90">
                    <UploadCloud className="size-4" aria-hidden="true" /> Subir nuevo QR
                  </Button>
                ) : (
                  <button type="button" className="group flex min-h-52 w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-headline/20 bg-headline/5 p-10 text-center transition-colors hover:border-action-orange/50 hover:bg-headline/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => inputRef.current?.click()}>
                    <span className="flex size-16 items-center justify-center rounded-full bg-headline/5 text-muted-foreground transition-colors group-hover:text-action-orange"><UploadCloud className="size-8" aria-hidden="true" /></span>
                    <span><span className="block font-medium text-headline">Seleccionar imagen QR</span><span className="mt-1 block text-sm text-muted-foreground">Formatos admitidos: JPG, PNG y WebP. Máximo 5 MB.</span></span>
                  </button>
                )}
                <Button type="button" disabled={!file || isSubmitting} onClick={upload} className={imageUrl ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-action-orange text-action-orange-foreground hover:bg-action-orange/90"}>
                  <Upload className="size-4" aria-hidden="true" /> {isSubmitting ? "Guardando…" : imageUrl ? "Actualizar QR" : "Registrar QR"}
                </Button>
              </>
            ) : (
              <p className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-body">El evento está cerrado. Puedes consultar tu QR, pero no modificarlo.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
