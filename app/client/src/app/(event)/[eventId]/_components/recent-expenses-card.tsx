import { ArrowRight, LayoutPanelTop, ReceiptText } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ExpenseSummary } from "../../_types/event-home-types"

interface RecentExpensesCardProps {
  eventId: string
  expenses: ExpenseSummary[]
}

/**
 * Muestra los gastos de referencia del evento sin permitir modificaciones.
 */
export function RecentExpensesCard({ eventId, expenses }: RecentExpensesCardProps) {
  return (
    <Card className="glass-panel rounded-[24px] border-border/60 bg-surface/80 py-0 text-body shadow-none">
      <CardHeader className="p-6">
        <CardTitle className="text-lg text-headline">Gastos recientes</CardTitle>
      </CardHeader>
      <CardContent className="gap-5 px-6 pb-6">
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 px-4 py-8 text-center">
            <ReceiptText className="size-6 text-body/60" aria-hidden="true" />
            <p className="text-sm text-body/70">Aún no hay gastos registrados.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1" aria-label="Gastos recientes del evento">
            {expenses.map((expense, index) => (
              <li key={expense.id} className="flex items-center justify-between gap-4 border-b border-border/60 p-3 last:border-b-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tertiary/20 text-lg" aria-hidden="true">
                    {["⛽", "🍔", "🏨"][index] ?? "🧾"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-headline">{expense.title}</p>
                    <p className="truncate text-xs text-body/65">
                      Pagado por {expense.payer}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-headline">{expense.amountLabel}</p>
                  <p className="text-[10px] text-muted-foreground">{expense.dateLabel}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button render={<Link href={`/expenses/event/${eventId}`} />} nativeButton={false} className="w-full gap-2 bg-tertiary text-headline hover:bg-tertiary/90">
          <LayoutPanelTop className="size-4" aria-hidden="true" />
          Ver todos los gastos
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>
  )
}
