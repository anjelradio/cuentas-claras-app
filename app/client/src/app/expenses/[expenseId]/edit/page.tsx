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
  const members = await getCachedEventMembers(expense.event_id).catch(() => [])

  const memberOptions = members.map((m) => ({
    id: m.id || m.user_id,
    name: m.name,
  }))

  return (
    <ExpenseForm
      eventId={expense.event_id}
      mode="edit"
      expense={expense}
      members={memberOptions}
    />
  )
}
