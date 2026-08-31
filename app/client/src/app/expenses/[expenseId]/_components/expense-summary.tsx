import Link from "next/link"
import { Pencil, UserRound } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getExpenseCategory, type ExpenseDemo } from "@/app/expenses/_types/expense-demo"
import { ExpenseReceiptSheet } from "./expense-receipt-sheet"

interface ExpenseSummaryProps {
  expense: ExpenseDemo
  settleAction?: React.ReactNode
  onCancel: () => void
}

/** Resume el gasto seleccionado y expone sus acciones visuales principales. */
export function ExpenseSummary({ expense, settleAction, onCancel }: ExpenseSummaryProps) {
  const category = getExpenseCategory(expense.category)

  return (
    <section>
      <header className="mb-8 flex flex-col items-center text-center">
        <span className="mb-4 text-6xl" aria-hidden="true">{category.emoji}</span>
        <h1 className="font-heading text-3xl font-semibold text-headline sm:text-4xl">{expense.name}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{expense.description}</p>
        <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-headline/5 px-4 py-2 text-sm"><span className="text-muted-foreground">Pagado por</span><span className="font-medium text-success">{expense.payer}</span></span>
      </header>

      {settleAction}
      <div className="mt-4 grid grid-cols-2 gap-4"><Link href={`/expenses/${expense.id}/edit`} className={cn(buttonVariants({ variant: "outline" }), "h-12 rounded-xl")}><Pencil aria-hidden="true" />Editar gasto</Link><Button type="button" variant="ghost" className="h-12 rounded-xl border border-error/20 text-error hover:bg-error/5 hover:text-error" onClick={onCancel}><UserRound aria-hidden="true" />Anular gasto</Button></div>

      <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-medium text-headline">Comprobante</h2><span className="text-xs uppercase tracking-wider text-muted-foreground">Factura original</span></div><div className="overflow-hidden rounded-2xl border border-white/5 bg-surface/80 p-4 shadow-xl"><ExpenseReceiptSheet amount={expense.amount} imageUrl={expense.receiptImageUrl ?? ""} label={expense.receiptLabel ?? "Comprobante del gasto"} /><div className="mt-4 flex items-center justify-between text-sm"><span className="text-muted-foreground">Total verificado</span><strong className="text-headline">{expense.amount}</strong></div></div></section>
    </section>
  )
}
