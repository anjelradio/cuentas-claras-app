import { getCachedEventMembers } from "@/app/(event)/_services/server-event-api"
import { ExpenseForm } from "../../../_components/expense-form"

interface RegisterExpensePageProps {
  params: Promise<{ eventId: string }>
}

/** Presenta el formulario para registrar un gasto dentro del evento actual con miembros reales. */
export default async function RegisterExpensePage({ params }: RegisterExpensePageProps) {
  const { eventId } = await params
  const members = await getCachedEventMembers(eventId).catch(() => [])

  const memberOptions = members.map((m) => ({
    id: m.id || m.user_id,
    name: m.name,
  }))

  return <ExpenseForm eventId={eventId} mode="create" members={memberOptions} />
}
