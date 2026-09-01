import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getCachedEventMembers } from "@/app/(event)/_services/server-event-api"
import { ExpenseForm } from "../../../_components/expense-form"

interface RegisterExpensePageProps {
  params: Promise<{ eventId: string }>
}

/** Presenta el formulario para registrar un gasto dentro del evento actual con miembros reales. */
export default async function RegisterExpensePage({ params }: RegisterExpensePageProps) {
  const { eventId } = await params
  const [members, session] = await Promise.all([
    getCachedEventMembers(eventId),
    auth.api.getSession({ headers: await headers() }),
  ])

  const memberOptions = members.map((m) => ({
    id: m.id,
    name: m.name,
    image: m.image ?? null,
  }))

  const currentMember = members.find((m) => m.user_id === session?.user?.id)
  const currentUserMemberId = currentMember?.id

  if (!currentUserMemberId) {
    throw new Error("No fue posible identificar tu membresía activa en este evento.")
  }

  return (
    <ExpenseForm
      eventId={eventId}
      mode="create"
      members={memberOptions}
      currentUserMemberId={currentUserMemberId}
    />
  )
}
