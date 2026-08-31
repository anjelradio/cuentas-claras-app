import { ExpenseForm } from "../../../_components/expense-form"

interface RegisterExpensePageProps {
  params: Promise<{ eventId: string }>
}

/** Presenta el formulario estático para registrar un gasto dentro del evento actual. */
export default async function RegisterExpensePage({ params }: RegisterExpensePageProps) {
  const { eventId } = await params

  return <ExpenseForm eventId={eventId} mode="create" />
}
