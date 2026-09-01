"use client"

import * as React from "react"
import {
  Banknote,
  CheckCircle2,
  ExternalLink,
  Loader2,
  QrCode,
  X,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PaymentApi } from "@/app/expenses/_services/payment-api"

interface VerifyPaymentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentId: string | null
  memberName: string
  amount: string
  paymentMethod: "cash" | "qr" | null
  proofImageUrl: string | null
  status: "no_payment" | "pending_confirmation" | "confirmed" | "rejected" | null
  onResolved?: () => void
}

export function VerifyPaymentSheet({
  open,
  onOpenChange,
  paymentId,
  memberName,
  amount,
  paymentMethod,
  proofImageUrl,
  status,
  onResolved,
}: VerifyPaymentSheetProps) {
  const [loadingAction, setLoadingAction] = React.useState<"confirm" | "reject" | null>(null)
  const [rejectPrompt, setRejectPrompt] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState("")

  function handleClose() {
    onOpenChange(false)
    setRejectPrompt(false)
    setRejectReason("")
    setLoadingAction(null)
  }

  async function handleConfirm() {
    if (!paymentId) return
    setLoadingAction("confirm")
    try {
      await PaymentApi.confirmPayment(paymentId)
      toast.success(`Pago de ${memberName} confirmado exitosamente.`)
      handleClose()
      onResolved?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al confirmar el pago.")
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleReject() {
    if (!paymentId) return
    setLoadingAction("reject")
    try {
      await PaymentApi.rejectPayment(paymentId, rejectReason || undefined)
      toast.success(`Declaración de pago de ${memberName} rechazada.`)
      handleClose()
      onResolved?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al rechazar el pago.")
    } finally {
      setLoadingAction(null)
    }
  }

  const isPending = status === "pending_confirmation"
  const isConfirmed = status === "confirmed"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[90dvh] overflow-y-auto rounded-t-[32px] border-border bg-[#181b27] p-6 text-white sm:max-w-lg"
      >
        <div className="mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full bg-white/20" />

        <SheetHeader className="flex-row items-start justify-between p-0">
          <div>
            <SheetTitle className="text-xl text-white">
              {isPending ? "Verificar pago" : isConfirmed ? "Detalle de pago confirmado" : "Detalle del pago"}
            </SheetTitle>
            <p className="mt-1 text-sm text-[#9699be]">
              {memberName} • <span className="font-semibold text-white">{amount}</span>
            </p>
          </div>
          <SheetClose render={<Button variant="ghost" size="icon" aria-label="Cerrar" className="text-white hover:bg-white/10" />}>
            <X aria-hidden="true" />
          </SheetClose>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-5">
          {/* Método de pago */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white">
              {paymentMethod === "cash" ? (
                <Banknote className="size-5 text-[#ff6b35]" />
              ) : (
                <QrCode className="size-5 text-[#bd7aff]" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">
                {paymentMethod === "cash" ? "Pago declarado en efectivo" : "Pago realizado mediante QR"}
              </p>
              <p className="text-xs text-[#9699be]">
                {paymentMethod === "cash"
                  ? "Cobro presencial en mano"
                  : "Transferencia bancaria digital"}
              </p>
            </div>
          </div>

          {/* Visualización de Comprobante QR */}
          {paymentMethod === "qr" && proofImageUrl && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9699be]">
                  Comprobante de transferencia
                </span>
                <a
                  href={proofImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#bd7aff] hover:underline"
                >
                  <ExternalLink className="size-3" />
                  Ver original
                </a>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-2">
                <img
                  src={proofImageUrl}
                  alt={`Comprobante de pago de ${memberName}`}
                  className="max-h-72 w-full rounded-xl object-contain shadow-lg"
                />
              </div>
            </div>
          )}

          {/* Mensaje para Efectivo */}
          {paymentMethod === "cash" && isPending && (
            <div className="rounded-2xl border border-[#ff6b35]/20 bg-[#ff6b35]/10 p-4 text-sm leading-relaxed text-[#ffb59d]">
              {memberName} declaró haber entregado {amount} en efectivo. Confirma esta acción solo si ya recibiste el dinero.
            </div>
          )}

          {/* Formulario de Rechazo */}
          {rejectPrompt && isPending && (
            <div className="flex flex-col gap-3 rounded-2xl border border-error/30 bg-error/10 p-4">
              <p className="text-sm font-semibold text-error">Motivo de rechazo (opcional):</p>
              <input
                type="text"
                placeholder="Ej. Transferencia no recibida, comprobante borroso"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-background/50 px-4 py-3 text-sm text-white placeholder:text-[#9699be] focus:border-error focus:outline-none"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  disabled={loadingAction === "reject"}
                  onClick={handleReject}
                  className="flex-1 rounded-xl"
                >
                  {loadingAction === "reject" ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 size-4" />
                  )}
                  Confirmar rechazo
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRejectPrompt(false)}
                  className="rounded-xl text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Botones de acción para estado pendiente */}
          {isPending && !rejectPrompt && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                disabled={loadingAction === "confirm"}
                onClick={handleConfirm}
                className="h-14 rounded-2xl bg-gradient-to-br from-[#5f4dff] to-[#1e1c9e] text-base font-semibold text-white shadow-lg shadow-[#5f4dff]/30 hover:from-[#6b5cff] hover:to-[#2624b5]"
              >
                {loadingAction === "confirm" ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Confirmando…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 size-5" />
                    Confirmar pago
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectPrompt(true)}
                className="h-14 rounded-2xl border-error/30 text-error hover:bg-error/10 hover:text-error"
              >
                <XCircle className="mr-2 size-5" />
                Rechazar pago
              </Button>
            </div>
          )}

          {/* Botón cerrar si ya está confirmado */}
          {isConfirmed && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-14 rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
            >
              Cerrar
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
