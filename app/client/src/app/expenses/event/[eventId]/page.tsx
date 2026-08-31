import { ExpensesList } from "./_components/expenses-list"

interface ExpensesPageProps {
  params: Promise<{ eventId: string }>
}

/** Ruta de servidor que conserva el contexto del evento y delega la interacción del listado. */
export default async function ExpensesPage({ params }: ExpensesPageProps) {
  const { eventId } = await params

  return <ExpensesList eventId={eventId} />
}
