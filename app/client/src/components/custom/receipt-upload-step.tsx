"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, ImagePlus, Loader2, RefreshCw, Sparkles, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ExpenseApi } from "@/app/expenses/_services/expense-api"

interface ReceiptUploadStepProps {
  eventId: string
  onSuccess?: () => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export function ReceiptUploadStep({ eventId, onSuccess }: ReceiptUploadStepProps) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [isCameraActive, setIsCameraActive] = React.useState(false)
  const [isCameraLoading, setIsCameraLoading] = React.useState(false)

  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)

  // Cleanup object URL
  React.useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Stop camera tracks on unmount
  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  function handleFileSelection(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      toast.error("La imagen no debe superar los 5 MB.")
      return
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Formato no compatible. Usa JPEG, PNG o WebP.")
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
  }

  async function startCamera() {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("La cámara no está disponible o no es compatible con este navegador.")
      return
    }

    setIsCameraLoading(true)
    setIsCameraActive(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
    } catch (error: unknown) {
      stopCamera()
      const msg = error instanceof Error ? error.message : "Permiso denegado"
      toast.error(`No se pudo abrir la cámara (${msg}). Permite el acceso o elige una foto.`)
    } finally {
      setIsCameraLoading(false)
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    setIsCameraLoading(false)
  }

  function capturePhoto() {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Error al capturar la imagen de la cámara.")
          return
        }
        const capturedFile = new File([blob], `comprobante-${Date.now()}.jpg`, {
          type: "image/jpeg",
        })
        stopCamera()
        handleFileSelection(capturedFile)
      },
      "image/jpeg",
      0.92
    )
  }

  async function handleAnalyzeAndContinue() {
    if (!selectedFile) {
      toast.error("Por favor selecciona o toma una foto primero.")
      return
    }

    if (!eventId) {
      toast.error("Debes seleccionar un evento primero.")
      return
    }

    setIsProcessing(true)
    try {
      const result = await ExpenseApi.analyzeReceipt(eventId, selectedFile)
      sessionStorage.setItem("ai_expense_prefill", JSON.stringify(result))

      if (result.is_receipt) {
        toast.success("¡Comprobante analizado con éxito por la IA!")
      } else if (result.category || result.name) {
        toast.success("¡Foto analizada y categorizada con éxito!")
      } else {
        toast.info("Imagen adjuntada. Completa los detalles del gasto.")
      }

      onSuccess?.()
      router.push(`/expenses/event/${eventId}/create`)
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Error al procesar la imagen."
      toast.error(`No se pudo procesar con IA: ${errorMsg}. Continuando al formulario.`)
      onSuccess?.()
      router.push(`/expenses/event/${eventId}/create`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Vista de Cámara Activa
  if (isCameraActive) {
    return (
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-black aspect-[3/4] max-h-[62vh] sm:max-h-[50vh] flex items-center justify-center shadow-2xl">
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="h-full w-full object-cover"
          />

          {isCameraLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-white">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Iniciando cámara...</p>
            </div>
          )}

          {/* Guías de encuadre */}
          <div className="pointer-events-none absolute inset-4 rounded-xl border border-white/20 border-dashed" />

          {/* Botón Cerrar Cámara */}
          <button
            type="button"
            onClick={stopCamera}
            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/90"
            aria-label="Cerrar cámara"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Controles de Disparo */}
        <div className="flex w-full items-center justify-around py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={stopCamera}
            className="text-xs text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="mr-1 size-4" />
            Volver
          </Button>

          {/* Botón Circular Disparador */}
          <button
            type="button"
            disabled={isCameraLoading}
            onClick={capturePhoto}
            className="flex size-18 items-center justify-center rounded-full border-4 border-white/90 p-1 shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            aria-label="Tomar foto"
          >
            <div className="size-14 rounded-full bg-white shadow-inner transition hover:bg-neutral-200 active:bg-neutral-300" />
          </button>

          <div className="w-16" aria-hidden="true" />
        </div>
      </div>
    )
  }

  // Vista de Selección / Vista Previa
  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      {previewUrl ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-xl">
          <img
            src={previewUrl}
            alt="Vista previa de la imagen"
            className="max-h-72 w-full object-contain"
          />
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => {
              setSelectedFile(null)
              setPreviewUrl(null)
            }}
            className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
            aria-label="Quitar imagen"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/70 bg-headline/5 p-6 text-center transition hover:border-primary/50 hover:bg-headline/10"
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ImagePlus className="size-7" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-headline">
              Adjunta tu factura o foto de compras
            </p>
            <p className="text-xs text-muted-foreground">
              Formatos JPEG, PNG o WebP (máx. 5 MB)
            </p>
          </div>

          <div className="mt-3 flex w-full flex-col sm:flex-row justify-center gap-3">
            {/* Opción 1: Tomar foto con cámara */}
            <Button
              type="button"
              onClick={startCamera}
              className="h-12 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-action-orange text-action-orange-foreground font-semibold text-sm shadow-md transition hover:brightness-110 active:scale-98 px-6"
            >
              <Camera className="size-5" />
              Tomar foto
            </Button>

            {/* Opción 2: Elegir archivo de galería */}
            <label className="inline-flex h-12 w-full sm:w-auto cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 text-sm font-semibold text-headline shadow transition hover:bg-headline/10 active:scale-98">
              <Upload className="size-5" />
              Elegir foto
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleInputChange}
                className="sr-only"
                disabled={isProcessing}
              />
            </label>
          </div>
        </div>
      )}

      {/* Botón de envío */}
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          disabled={!selectedFile || isProcessing}
          onClick={handleAnalyzeAndContinue}
          className="h-12 w-full rounded-xl bg-gradient-to-br from-[#5f4dff] to-[#1e1c9e] text-base font-bold text-white shadow-lg shadow-[#5f4dff]/25 transition hover:brightness-110 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Analizando imagen y subiendo...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-5" />
              Analizar imagen y continuar
            </>
          )}
        </Button>

        {selectedFile && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              disabled={isProcessing}
              onClick={startCamera}
              className="h-11 w-full rounded-xl border-white/10 bg-white/5 text-xs font-semibold text-headline hover:bg-white/10 active:scale-98 transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Camera className="size-4 text-action-orange" />
              Tomar otra foto
            </Button>

            <label className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-headline hover:bg-white/10 active:scale-98 transition shadow-xs">
              <RefreshCw className="size-4 text-primary" />
              Cambiar archivo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleInputChange}
                className="sr-only"
                disabled={isProcessing}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
