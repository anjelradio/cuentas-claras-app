import { getExpenseForDisplay } from "@/app/expenses/_types/expense-demo"
import { ExpenseDetailView } from "./_components/expense-detail-view"

interface ExpenseDetailPageProps {
  params: Promise<{ expenseId: string }>
}

/** Ruta de servidor que resuelve el gasto estático antes de montar sus acciones cliente. */
export default async function ExpenseDetailPage({ params }: ExpenseDetailPageProps) {
  const { expenseId } = await params
  const expense = getExpenseForDisplay(expenseId)

  return <ExpenseDetailView eventId={expense.eventId} expense={expense} />
}
