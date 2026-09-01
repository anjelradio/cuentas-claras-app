import { getCachedEventExpenses } from "../../_services/server-expense-api"
import { ExpensesList } from "./_components/expenses-list"

interface ExpensesPageProps {
  params: Promise<{ eventId: string }>
}

/** Server Component que resuelve los gastos iniciales y delega la interactividad a ExpensesList. */
export default async function ExpensesPage({ params }: ExpensesPageProps) {
  const { eventId } = await params
  const initialExpenses = await getCachedEventExpenses(eventId, "all").catch(() => [])

  return <ExpensesList eventId={eventId} initialExpenses={initialExpenses} />
}
