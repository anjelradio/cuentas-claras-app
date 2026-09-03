"use client"

import * as React from "react"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { downloadEventReport } from "../../_services/event-api"

export interface EventExportButtonProps {
  eventId: string
  className?: string
}

/**
 * Botón interactivo para exportar y descargar reportes del evento en CSV o PDF.
 * Proporciona feedback visual con estado de carga y maneja errores mediante toasts.
 */
export function EventExportButton({ eventId, className }: EventExportButtonProps) {
  const [isDownloading, setIsDownloading] = React.useState(false)

  const handleExport = async (format: "csv" | "pdf") => {
    if (isDownloading) return

    setIsDownloading(true)
    const formatName = format.toUpperCase()
    try {
      await downloadEventReport(eventId, format)
      toast.success(`Reporte ${formatName} descargado exitosamente.`)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `No se pudo descargar el reporte ${formatName}.`
      )
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDownloading}
            aria-label="Exportar reporte del evento"
            className={cn(
              "h-8 gap-1.5 rounded-lg border-white/10 bg-white/5 px-2.5 text-xs font-medium text-foreground transition-all hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
              className
            )}
          />
        }
      >
        {isDownloading ? (
          <>
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden="true" />
            <span>Descargando…</span>
          </>
        ) : (
          <>
            <Download className="size-3.5 text-primary" aria-hidden="true" />
            <span>Exportar</span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl border border-white/10 bg-[#181b27] p-1.5 text-white shadow-xl">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Formato de exportación
        </div>
        <DropdownMenuSeparator className="my-1 bg-white/10" />
        <DropdownMenuItem
          disabled={isDownloading}
          onClick={() => handleExport("csv")}
          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors hover:bg-white/10 focus:bg-white/10 disabled:pointer-events-none disabled:opacity-50"
        >
          <FileSpreadsheet className="size-4 text-emerald-400" aria-hidden="true" />
          <div className="flex flex-col">
            <span>Descargar CSV</span>
            <span className="text-[10px] text-muted-foreground">Datos tabulares para Excel</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isDownloading}
          onClick={() => handleExport("pdf")}
          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors hover:bg-white/10 focus:bg-white/10 disabled:pointer-events-none disabled:opacity-50"
        >
          <FileText className="size-4 text-rose-400" aria-hidden="true" />
          <div className="flex flex-col">
            <span>Descargar PDF</span>
            <span className="text-[10px] text-muted-foreground">Reporte visual estructurado</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
