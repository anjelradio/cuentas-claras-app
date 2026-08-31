"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import type { EventCreatePayload, EventUpdatePayload, EventDetail } from "../_types/event"

interface EventFormProps {
  mode: "create" | "edit"
  eventId?: string
  initialData?: EventDetail
  onSubmitAction: (data: any) => Promise<void>
}

export function EventForm({ mode, eventId, initialData, onSubmitAction }: EventFormProps) {
  const router = useRouter()
  const isEditing = mode === "edit"

  const [icon, setIcon] = useState(initialData?.icon || '✈️')
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [date, setDate] = useState(initialData?.starts_at ? initialData.starts_at.substring(0, 10) : '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("El nombre del evento es obligatorio")
      return
    }
    if (!date) {
      toast.error("La fecha del evento es obligatoria")
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        starts_at: new Date(date).toISOString(),
      }
      await onSubmitAction(payload)
      // Note: The parent action should handle the redirect and success toast.
    } catch (error: any) {
      // API error strategy implemented via event-api.ts handles toasts for 4xx/5xx and throws for others, 
      // but if an error propagates here, we could catch it or rely on the parent.
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#181b27] border border-border text-white rounded-2xl p-6 shadow-2xl">
        <h2 className="text-2xl font-semibold mb-6">{isEditing ? "Editar evento" : "Crear nuevo evento"}</h2>
        
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Elige un ícono</span>
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {['✈️', '🍕', '🍻', '🚗', '⛰️', '🏡'].map(emoji => (
                <button 
                  key={emoji} 
                  type="button" 
                  onClick={() => setIcon(emoji)}
                  className={`aspect-square flex items-center justify-center rounded-2xl border text-4xl transition-all hover:scale-105 active:scale-95 ${
                    icon === emoji ? "bg-white/20 border-white" : "bg-[#151a30]/80 hover:bg-white/10 border-border"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="sr-only" htmlFor="nombre-evento">Nombre del evento</label>
            <input
              id="nombre-evento"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre del evento"
              className="w-full bg-[#151a30]/80 border border-border rounded-xl px-4 py-5 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#3d3bff]/50 focus:border-[#3d3bff]/50 transition-all text-center text-lg"
            />
          </div>

          <div>
            <label className="sr-only" htmlFor="desc-evento">Descripción</label>
            <textarea
              id="desc-evento"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descripción opcional"
              className="w-full bg-[#151a30]/80 border border-border rounded-xl px-4 py-4 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#3d3bff]/50 focus:border-[#3d3bff]/50 transition-all text-center text-base min-h-[80px]"
            />
          </div>

          <div>
            <label className="sr-only" htmlFor="fecha-evento">Fecha de inicio</label>
            <input
              id="fecha-evento"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-[#151a30]/80 border border-border rounded-xl px-4 py-5 text-white focus:outline-none focus:ring-2 focus:ring-[#3d3bff]/50 focus:border-[#3d3bff]/50 transition-all text-center text-lg [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button 
              type="button"
              className="w-full sm:w-1/2 px-4 py-4 rounded-xl border border-border bg-transparent hover:bg-surface-high transition-colors text-sm font-medium text-white order-2 sm:order-1"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="w-full sm:w-1/2 px-4 py-4 rounded-xl text-white font-medium text-sm transition-all shadow-[0_4px_12px_rgba(61,59,255,0.3)] hover:shadow-[0_6px_16px_rgba(61,59,255,0.4)] hover:-translate-y-0.5 order-1 sm:order-2 disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: "linear-gradient(135deg, #5f4dff 0%, #1e1c9e 100%)" }}
            >
              {loading ? "Cargando..." : (isEditing ? "Guardar cambios" : "Crear evento")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
