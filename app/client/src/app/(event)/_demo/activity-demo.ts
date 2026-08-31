import type { ActivityLogEntry } from "../_types/activity-types"

export const ACTIVITY_LOG_DEMO: ActivityLogEntry[] = [
  {
    id: "act-1",
    type: "expense_updated",
    actorName: "Lucía",
    targetName: "Cena en el puerto",
    createdAt: "Hoy, 12:45",
    description: "Se actualizó el monto del gasto \"Cena en el puerto\"."
  },
  {
    id: "act-2",
    type: "payment_confirmed",
    actorName: "José",
    targetName: "Cena en el puerto",
    createdAt: "Hoy, 11:30",
    description: "José confirmó su pago para el gasto \"Cena en el puerto\"."
  },
  {
    id: "act-3",
    type: "member_joined",
    actorName: "Carlos",
    createdAt: "Ayer, 18:20",
    description: "Carlos se unió al evento."
  },
  {
    id: "act-4",
    type: "expense_created",
    actorName: "Ana López",
    targetName: "Combustible del viaje",
    createdAt: "Ayer, 14:15",
    description: "Ana López registró el gasto \"Combustible del viaje\"."
  },
  {
    id: "act-5",
    type: "event_created",
    actorName: "Ana López",
    targetName: "Viaje a la playa",
    createdAt: "15 de agosto, 09:00",
    description: "Ana López creó el evento \"Viaje a la playa\"."
  },
  {
    id: "act-6",
    type: "owner_transferred",
    actorName: "Beto",
    targetName: "Ana López",
    createdAt: "15 de agosto, 10:00",
    description: "Beto transfirió la administración del evento a Ana López."
  }
]
