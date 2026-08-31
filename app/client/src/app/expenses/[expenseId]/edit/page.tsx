import { ExpenseForm } from "@/app/expenses/_components/expense-form"
import { getExpenseForDisplay } from "@/app/expenses/_types/expense-demo"

interface EditExpensePageProps {
  params: Promise<{ expenseId: string }>
}

/** Presenta el mismo formulario de gastos en modo edición con datos estáticos. */
export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const { expenseId } = await params
  const expense = getExpenseForDisplay(expenseId)

  return <ExpenseForm eventId={expense.eventId} mode="edit" expense={expense} />
}
