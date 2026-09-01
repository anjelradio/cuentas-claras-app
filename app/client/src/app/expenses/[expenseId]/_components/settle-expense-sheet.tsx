"use client"

import * as React from "react"
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Loader2,
  QrCode,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PaymentApi, type PayerQrInfo } from "@/app/expenses/_services/payment-api"

interface SettleExpenseSheetProps {
  expenseId: string
  splitId: string
  amount: string
  autoOpen?: boolean
  onPaymentDeclared?: () => void
  onClose?: () => void
}

type Step = "select" | "cash" | "qr_view" | "qr_upload"

export function SettleExpenseSheet({
  expenseId,
  splitId,
  amount,
  autoOpen = false,
  onPaymentDeclared,
  onClose,
}: SettleExpenseSheetProps) {
  const [open, setOpen] = React.useState(autoOpen)
  const [step, setStep] = React.useState<Step>("select")
  const [loading, setLoading] = React.useState(false)
  const [qrInfo, setQrInfo] = React.useState<PayerQrInfo | null>(null)
  const [loadingQr, setLoadingQr] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (autoOpen) {
      setOpen(true)
    }
  }, [autoOpen])

  function resetState() {
    setStep("select")
    setLoading(false)
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setOpen(false)
      window.setTimeout(resetState, 200)
      onClose?.()
    } else {
      setOpen(true)
    }
  }

  async function handleSelectQr() {
    setStep("qr_view")
    if (!qrInfo) {
      setLoadingQr(true)
      try {
        const info = await PaymentApi.getPayerQr(expenseId)
        setQrInfo(info)
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Error al obtener código QR.")
      } finally {
        setLoadingQr(false)
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen (JPEG, PNG, WebP).")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo supera el tamaño máximo permitido de 5 MB.")
      return
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleConfirmCash() {
    setLoading(true)
    try {
      await PaymentApi.declarePayment(expenseId, splitId, "cash")
      toast.success("Declaración de pago en efectivo enviada con éxito.")
      handleOpenChange(false)
      onPaymentDeclared?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al declarar pago.")
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmQr() {
    if (!selectedFile) {
      toast.error("Debes adjuntar una imagen del comprobante de transferencia.")
      return
    }

    setLoading(true)
    try {
      await PaymentApi.declarePayment(expenseId, splitId, "qr", selectedFile)
      toast.success("Comprobante enviado y pago registrado en espera de confirmación.")
      handleOpenChange(false)
      onPaymentDeclared?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al enviar comprobante.")
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadQr() {
    if (!qrInfo?.qr_image_url) return
    try {
      const response = await fetch(qrInfo.qr_image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `QR-Pago-${qrInfo.payer_name.replace(/\s+/g, "_")}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Código QR descargado.")
    } catch {
      window.open(qrInfo.qr_image_url, "_blank")
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="h-auto w-full rounded-2xl bg-gradient-to-br from-[#5f4dff] to-[#1e1c9e] py-5 text-lg font-bold text-white shadow-[0_10px_40px_rgba(61,59,255,0.3)] transition-all hover:-translate-y-1 hover:from-[#6b5cff] hover:to-[#2624b5] hover:shadow-[0_15px_50px_rgba(61,59,255,0.4)]"
      >
        <CheckCircle2 className="size-6" aria-hidden="true" />
        Saldar mi parte ({amount})
      </Button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[90dvh] overflow-y-auto rounded-t-[32px] border-border bg-[#181b27] p-6 text-white sm:max-w-lg"
        >
          <div className="mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full bg-white/20" />

          <SheetHeader className="flex-row items-start justify-between p-0">
            <div>
              {step !== "select" && (
                <button
                  type="button"
                  onClick={() => {
                    if (step === "qr_upload") setStep("qr_view")
                    else setStep("select")
                  }}
                  className="mb-2 inline-flex items-center gap-1 text-sm text-[#9699be] hover:text-white"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Volver
                </button>
              )}
              <SheetTitle className="text-xl text-white">
                {step === "cash"
                  ? "Pago en efectivo"
                  : step === "qr_view"
                  ? "Pagar con QR"
                  : step === "qr_upload"
                  ? "Subir comprobante"
                  : "Selecciona un método de pago"}
              </SheetTitle>
            </div>
            <SheetClose render={<Button variant="ghost" size="icon" aria-label="Cerrar pago" className="text-white hover:bg-white/10" />}>
              <X aria-hidden="true" />
            </SheetClose>
          </SheetHeader>

          {/* Paso 1: Selección de método */}
          {step === "select" && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setStep("cash")}
                className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-[#5f4dff] to-[#1e1c9e] p-4 text-center text-white shadow-lg transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-white/20">
                  <Banknote className="size-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Pagar en efectivo</span>
                  <span className="mt-1 block text-[10px] text-white/80">Dinero en persona</span>
                </span>
              </button>

              <button
                type="button"
                onClick={handleSelectQr}
                className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-[#bd7aff] to-[#6900b3] p-4 text-center text-white shadow-lg transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-white/20">
                  <QrCode className="size-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Pagar con QR</span>
                  <span className="mt-1 block text-[10px] text-white/80">Transferencia rápida</span>
                </span>
              </button>
            </div>
          )}

          {/* Paso 2: Flujo Efectivo */}
          {step === "cash" && (
            <div className="mt-6 grid gap-6">
              <div className="rounded-2xl border border-[#ff6b35]/20 bg-[#ff6b35]/10 p-4 text-sm leading-relaxed text-[#ffb59d]">
                Has seleccionado pago en efectivo. Debes entregar el dinero a la persona que pagó. Se le notificará para que confirme la recepción física del dinero.
              </div>
              <Button
                type="button"
                disabled={loading}
                onClick={handleConfirmCash}
                className="h-14 rounded-2xl bg-[#ff6b35] text-base font-semibold text-white shadow-lg shadow-[#ff6b35]/30 hover:bg-[#ff6b35]/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Procesando…
                  </>
                ) : (
                  "Confirmar pago en efectivo"
                )}
              </Button>
            </div>
          )}

          {/* Paso 2: Flujo QR */}
          {step === "qr_view" && (
            <div className="mt-6 grid gap-5">
              {loadingQr ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="size-8 animate-spin text-[#bd7aff]" />
                </div>
              ) : qrInfo && qrInfo.has_qr && qrInfo.qr_image_url ? (
                <>
                  <div className="mx-auto flex size-52 items-center justify-center rounded-2xl bg-white p-3 shadow-inner">
                    <img
                      src={qrInfo.qr_image_url}
                      alt={`Código QR de ${qrInfo.payer_name}`}
                      className="size-full rounded-xl object-contain"
                    />
                  </div>
                  <p className="text-center text-xs text-[#9699be]">
                    Escanea o descarga el QR de <strong className="text-white">{qrInfo.payer_name}</strong> para transferir desde tu banca móvil.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setStep("qr_upload")}
                    className="h-14 rounded-2xl bg-[#bd7aff] text-base font-semibold text-white shadow-lg shadow-[#bd7aff]/30 hover:bg-[#bd7aff]/90"
                  >
                    Ya pagué
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadQr}
                    className="h-14 rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                  >
                    <Download className="mr-2 size-5" />
                    Descargar QR
                  </Button>
                </>
              ) : (
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm leading-relaxed text-warning">
                    El pagador no tiene registrado un código QR en su perfil. Puedes pagarle en persona en efectivo o solicitarle que configure su QR.
                  </div>
                  <Button
                    type="button"
                    onClick={() => setStep("cash")}
                    className="h-14 rounded-2xl bg-[#ff6b35] text-base font-semibold text-white hover:bg-[#ff6b35]/90"
                  >
                    Pagar en efectivo
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Paso 3: Flujo Subir Comprobante */}
          {step === "qr_upload" && (
            <div className="mt-6 grid gap-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-black/40 p-2">
                  <img
                    src={previewUrl}
                    alt="Vista previa del comprobante"
                    className="max-h-56 w-full rounded-xl object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-4 right-4 rounded-xl"
                    onClick={() => {
                      setSelectedFile(null)
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl)
                        setPreviewUrl(null)
                      }
                    }}
                  >
                    Cambiar archivo
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-4 text-[#9699be] transition-colors hover:border-[#bd7aff]/50 hover:bg-white/10 hover:text-white"
                >
                  <Upload className="size-8 text-[#bd7aff]" />
                  <span className="text-sm font-medium">Toca para adjuntar imagen del comprobante</span>
                  <span className="text-xs text-[#9699be]">JPEG, PNG o WebP (máx. 5 MB)</span>
                </div>
              )}

              <Button
                type="button"
                disabled={!selectedFile || loading}
                onClick={handleConfirmQr}
                className="h-14 rounded-2xl bg-[#bd7aff] text-base font-semibold text-white shadow-lg shadow-[#bd7aff]/30 hover:bg-[#bd7aff]/90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Subiendo comprobante…
                  </>
                ) : (
                  "Enviar comprobante"
                )}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
