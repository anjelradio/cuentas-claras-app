import * as React from "react"
import { getCachedEventDetail } from "@/app/(event)/_services/server-event-api"
import { getCachedExpenseDetail } from "../_services/server-expense-api"
import { ExpenseDetailView } from "./_components/expense-detail-view"
import ExpenseDetailLoading from "./loading"

interface ExpenseDetailPageProps {
  params: Promise<{ expenseId: string }>
}

/** Server Component que resuelve el detalle real del gasto y el nombre del evento. */
export default async function ExpenseDetailPage({ params }: ExpenseDetailPageProps) {
  const { expenseId } = await params
  const expense = await getCachedExpenseDetail(expenseId)
  const event = await getCachedEventDetail(expense.event_id).catch(() => null)

  return (
    <React.Suspense fallback={<ExpenseDetailLoading />}>
      <ExpenseDetailView
        eventId={expense.event_id}
        expense={expense}
        eventName={event?.name ?? "Evento"}
      />
    </React.Suspense>
  )
}
