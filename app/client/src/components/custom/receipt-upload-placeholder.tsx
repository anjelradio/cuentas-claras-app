import { UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"

interface ReceiptUploadPlaceholderProps {
  onContinue: () => void
}

/**
 * Estado de presentación reutilizable para adjuntar la factura de un gasto.
 * No inicia carga ni persistencia hasta que exista la feature de archivos.
 */
export function ReceiptUploadPlaceholder({ onContinue }: ReceiptUploadPlaceholderProps) {
  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        className="group flex min-h-60 w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-headline/20 bg-headline/5 p-10 text-center transition-colors hover:border-action-orange/50 hover:bg-headline/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Adjuntar comprobante: funcionalidad disponible próximamente"
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-headline/5 text-muted-foreground transition-colors group-hover:text-action-orange">
          <UploadCloud className="size-8" aria-hidden="true" />
        </span>
        <span>
          <span className="block font-medium text-headline">Adjuntar comprobante</span>
          <span className="mt-1 block text-sm text-muted-foreground">Adjunta la factura del gasto. Formatos admitidos: JPG, PNG.</span>
        </span>
      </button>
      <Button type="button" className="w-full bg-action-orange text-action-orange-foreground hover:bg-action-orange/90" onClick={onContinue}>
        Continuar
      </Button>
    </div>
  )
}
