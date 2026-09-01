import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getCachedEventMembers } from "@/app/(event)/_services/server-event-api"
import { ExpenseForm } from "@/app/expenses/_components/expense-form"
import { getCachedExpenseDetail } from "@/app/expenses/_services/server-expense-api"

interface EditExpensePageProps {
  params: Promise<{ expenseId: string }>
}

/** Presenta el formulario de gastos en modo edición con los datos persistidos y miembros reales. */
export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const { expenseId } = await params
  const expense = await getCachedExpenseDetail(expenseId)
  const [members, session] = await Promise.all([
    getCachedEventMembers(expense.event_id).catch(() => []),
    auth.api.getSession({ headers: await headers() }).catch(() => null),
  ])

  const memberOptions = members.map((m) => ({
    id: m.id || m.user_id,
    name: m.name,
    image: m.image ?? null,
  }))

  const currentMember = members.find((m) => m.user_id === session?.user?.id)
  const currentUserMemberId = currentMember?.id || currentMember?.user_id

  return (
    <ExpenseForm
      eventId={expense.event_id}
      mode="edit"
      expense={expense}
      members={memberOptions}
      currentUserMemberId={currentUserMemberId}
    />
  )
}
