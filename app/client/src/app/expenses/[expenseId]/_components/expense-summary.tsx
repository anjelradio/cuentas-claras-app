import * as React from "react"
import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { EXPENSE_CATEGORIES } from "@/app/expenses/_types/expense"
import type { ExpenseCategory, ExpenseDetail } from "@/app/expenses/_types/expense"
import { ExpenseReceiptSheet } from "./expense-receipt-sheet"

interface ExpenseSummaryProps {
  expense: ExpenseDetail
  onCancel: () => void
  onReceiptUpdated?: () => void
}

function getCategoryInfo(category: ExpenseCategory) {
  return (
    EXPENSE_CATEGORIES.find((item) => item.id === category) ??
    EXPENSE_CATEGORIES[0]
  )
}

/** Resume el gasto seleccionado y expone sus acciones de edición y anulación. */
export function ExpenseSummary({
  expense,
  onCancel,
  onReceiptUpdated,
}: ExpenseSummaryProps) {
  const category = getCategoryInfo(expense.category)
  const formattedAmount = `Bs. ${Number.parseFloat(String(expense.amount)).toFixed(2)}`

  return (
    <section>
      <header className="mb-8 flex flex-col items-center text-center">
        <span className="mb-4 text-6xl" aria-hidden="true">
          {category.emoji}
        </span>
        <h1 className="font-heading text-3xl font-semibold text-headline sm:text-4xl">
          {expense.name}
        </h1>
        {expense.description && (
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {expense.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-headline/5 px-4 py-1.5 text-sm">
            <span className="text-muted-foreground">Pagado por</span>
            <span className="font-medium text-success">{expense.paid_by_member_name}</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-headline/5 px-4 py-1.5 text-sm">
            <span className="text-muted-foreground">Creado por</span>
            <span className="font-medium text-headline">{expense.created_by_member_name}</span>
          </span>
        </div>
      </header>

      {/* Botones de acción: Editar y Anular */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Link
          href={`/expenses/${expense.id}/edit`}
          className={cn(buttonVariants({ variant: "outline" }), "h-12 rounded-xl border-border bg-background/50 hover:bg-white/10")}
        >
          <Pencil className="mr-1 size-4" aria-hidden="true" />
          Editar gasto
        </Link>
        <Button
          type="button"
          variant="ghost"
          className="h-12 rounded-xl border border-error/20 text-error hover:bg-error/10 hover:text-error"
          onClick={onCancel}
        >
          <Trash2 className="mr-1 size-4" aria-hidden="true" />
          Anular gasto
        </Button>
      </div>

      {/* Tarjeta de comprobante digital */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-headline">Comprobante digital</h2>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {expense.receipt_url ? "Comprobante adjunto" : "Sin comprobante"}
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface/80 p-4 shadow-xl">
          <ExpenseReceiptSheet
            expenseId={expense.id}
            amount={formattedAmount}
            imageUrl={expense.receipt_url}
            label={expense.name}
            onReceiptUpdated={onReceiptUpdated}
          />
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monto total</span>
            <strong className="text-headline text-base font-bold">{formattedAmount}</strong>
          </div>
        </div>
      </section>
    </section>
  )
}
