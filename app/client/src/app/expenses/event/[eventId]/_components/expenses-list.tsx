"use client"

import * as React from "react"
import Link from "next/link"
import { CircleDollarSign } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getExpenseCategory, getExpensesByFilter, type ExpenseFilter } from "@/app/expenses/_types/expense-demo"

interface ExpensesListProps {
  eventId: string
}

const FILTERS: { id: ExpenseFilter; label: string }[] = [
  { id: "mine", label: "Mis gastos" },
  { id: "others", label: "Gastos de otros" },
  { id: "all", label: "Todos" },
]

/** Interacción cliente del listado estático de gastos y sus filtros locales. */
export function ExpensesList({ eventId }: ExpensesListProps) {
  const [filter, setFilter] = React.useState<ExpenseFilter>("all")
  const expenses = getExpensesByFilter(eventId, filter)

  return <section className="mx-auto w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div role="tablist" aria-label="Filtrar gastos" className="mb-6 flex justify-center gap-3 overflow-x-auto pb-2">{FILTERS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)} className={cn("shrink-0 rounded-full border px-6 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", filter === item.id ? "border-action-orange bg-action-orange text-action-orange-foreground shadow-lg shadow-action-orange/30" : "border-action-orange bg-action-orange/20 text-headline hover:bg-action-orange/30")}>{item.label}</button>)}</div>
    {expenses.length ? <div className="grid gap-3">{expenses.map((expense) => {
      const category = getExpenseCategory(expense.category)
      return (
        <Link key={expense.id} href={`/expenses/${expense.id}`} className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 rounded-2xl border border-white/5 bg-surface/80 p-4 sm:p-5 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-headline/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex w-full items-center gap-4 sm:flex-1">
            <span className="flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-full bg-headline/5 text-2xl sm:text-3xl shadow-inner transition-transform group-hover:scale-110" aria-hidden="true">{category.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="mb-1 block truncate text-base sm:text-lg font-semibold text-headline">{expense.name}</span>
              <span className="block truncate text-xs sm:text-sm text-muted-foreground">{expense.description ?? category.label}</span>
            </span>
          </div>
          <span className="flex w-full shrink-0 flex-row items-center justify-between border-t border-white/5 pt-3 sm:w-auto sm:flex-col sm:items-end sm:gap-2 sm:border-0 sm:pt-0">
            <span className="font-heading text-lg sm:text-xl font-bold text-headline">{expense.amount}</span>
            <span className={cn("rounded-full border px-3 py-1 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase", expense.status === "paid" ? "border-success/30 bg-success/20 text-success" : "border-error/30 bg-error/15 text-error")}>{expense.status === "paid" ? "Saldado" : "Pendiente"}</span>
          </span>
        </Link>
      )
    })}</div> : <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center"><span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-headline/5 text-muted-foreground"><CircleDollarSign className="size-7" aria-hidden="true" /></span><h2 className="font-heading text-xl font-semibold text-headline">No hay gastos en este filtro</h2><p className="mt-2 text-sm text-muted-foreground">Prueba consultar todos los gastos del evento.</p><Button type="button" variant="outline" className="mt-5 rounded-xl" onClick={() => setFilter("all")}>Ver todos</Button></div>}
  </section>
}
