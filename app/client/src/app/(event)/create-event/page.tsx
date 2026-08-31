"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EventForm } from "../_components/event-form"
import { EventApi } from "../_services/event-api"
import type { EventCreatePayload } from "../_types/event"

/**
 * Página cliente que provee la lógica de creación de un evento nuevo.
 * Muestra el EventForm y delega la respuesta positiva enviando un toast
 * antes de redirigir al listado principal.
 */
export default function CreateEventPage() {
  const router = useRouter()

  const handleCreate = async (data: any) => {
    try {
      const createdEvent = await EventApi.createEvent(data)
      toast.success("Evento creado exitosamente")
      router.push(`/${createdEvent.id}`)
    } catch (err: any) {
      if (err.message === "Error HTTP 404") return // Handled by EventApi
      toast.error(err.message || "Error al crear evento")
    }
  }

  return <EventForm mode="create" onSubmitAction={handleCreate} />
}
