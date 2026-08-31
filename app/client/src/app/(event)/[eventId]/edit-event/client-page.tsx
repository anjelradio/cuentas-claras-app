"use client"

import { useRouter } from "next/navigation"
import { notFound } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { EventForm } from "../../_components/event-form"
import { EventApi } from "../../_services/event-api"
import type { EventUpdatePayload, EventDetail } from "../../_types/event"

/**
 * Componente cliente encargado de inicializar el formulario de edición.
 * Pre-carga la data actual del evento usando su identificador y delega
 * la mutación al EventApi. Redirige a la vista de evento tras éxito.
 */
export function EditEventClient({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [eventData, setEventData] = useState<EventDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    EventApi.getEventDetail(eventId)
      .then(setEventData)
      .catch((err) => setError(err.message))
  }, [eventId])

  const handleUpdate = async (data: any) => {
    try {
      await EventApi.updateEvent(eventId, data)
      toast.success("Evento actualizado exitosamente")
      router.push(`/${eventId}`)
      router.refresh()
    } catch (err: any) {
      if (err.message === "Error HTTP 404") return
      toast.error(err.message || "Error al actualizar evento")
    }
  }

  if (error) {
    // If there's an error, throw it so the error boundary catches it
    throw new Error(error)
  }

  if (!eventData) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <div className="animate-pulse">Cargando evento...</div>
      </div>
    )
  }

  return (
    <EventForm 
      mode="edit" 
      eventId={eventId} 
      initialData={eventData} 
      onSubmitAction={handleUpdate} 
    />
  )
}
