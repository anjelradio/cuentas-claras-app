"use client"

import * as React from "react"
import Link from "next/link"
import { CircleDollarSign, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { EXPENSE_CATEGORIES } from "@/app/expenses/_types/expense"
import type { ExpenseCategory, ExpenseSummary } from "@/app/expenses/_types/expense"
import { ExpenseApi } from "@/app/expenses/_services/expense-api"
import { ReceiptUploadSheet } from "@/app/(event)/[eventId]/_components/receipt-upload-sheet"

interface ExpensesListProps {
  eventId: string
  initialExpenses?: ExpenseSummary[]
}

type ExpenseFilter = "mine" | "others" | "all"

const FILTERS: { id: ExpenseFilter; label: string }[] = [
  { id: "mine", label: "Mis gastos" },
  { id: "others", label: "Gastos de otros" },
  { id: "all", label: "Todos" },
]

function getCategoryInfo(category: ExpenseCategory) {
  return (
    EXPENSE_CATEGORIES.find((item) => item.id === category) ??
    EXPENSE_CATEGORIES[0]
  )
}

function getSplitTypeLabel(splitType: ExpenseSummary["split_type"]) {
  return splitType === "exact" ? "Montos exactos" : "División equitativa"
}

/** Interacción cliente del listado funcional de gastos con filtros reales. */
export function ExpensesList({ eventId, initialExpenses = [] }: ExpensesListProps) {
  const [filter, setFilter] = React.useState<ExpenseFilter>("all")
  const [expenses, setExpenses] = React.useState<ExpenseSummary[]>(initialExpenses)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isUploadSheetOpen, setIsUploadSheetOpen] = React.useState(false)
  const isFirstRender = React.useRef(true)

  const loadExpenses = React.useCallback(async (selectedFilter: ExpenseFilter) => {
    setIsLoading(true)
    try {
      const data = await ExpenseApi.listEventExpenses(eventId, selectedFilter)
      setExpenses(data)
    } catch {
      // fallback
    } finally {
      setIsLoading(false)
    }
  }, [eventId])

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    loadExpenses(filter)
  }, [filter, loadExpenses])

  return (
    <section className="mx-auto w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div
          role="tablist"
          aria-label="Filtrar gastos"
          className="flex justify-center gap-2 overflow-x-auto pb-1 sm:justify-start"
        >
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                "shrink-0 rounded-full border px-5 py-2 text-xs sm:text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filter === item.id
                  ? "border-action-orange bg-action-orange text-action-orange-foreground shadow-lg shadow-action-orange/30"
                  : "border-action-orange/40 bg-action-orange/15 text-headline hover:bg-action-orange/25"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <Button
          type="button"
          onClick={() => setIsUploadSheetOpen(true)}
          className="h-10 w-full rounded-xl bg-action-orange px-4 text-xs font-semibold text-action-orange-foreground shadow hover:bg-action-orange/90 sm:w-auto sm:text-sm"
        >
          <Plus className="mr-1 size-4" />
          Registrar gasto
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          Cargando gastos…
        </div>
      ) : expenses.length > 0 ? (
        <div className="grid gap-3">
          {expenses.map((expense) => {
            const category = getCategoryInfo(expense.category)
            const formattedAmount = `Bs. ${Number.parseFloat(String(expense.amount)).toFixed(2)}`

            return (
              <Link
                key={expense.id}
                href={`/expenses/${expense.id}`}
                className="group grid gap-4 rounded-2xl border border-white/5 bg-surface/80 p-4 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-headline/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:p-5"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <span
                    className="flex size-12 shrink-0 items-center justify-center rounded-full bg-headline/5 text-2xl shadow-inner transition-transform group-hover:scale-110 sm:size-14 sm:text-3xl"
                    aria-hidden="true"
                  >
                    {category.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block break-words text-base font-semibold leading-snug text-headline sm:text-lg">
                      {expense.name}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground sm:text-sm">
                      Pagó <strong className="font-semibold text-headline">{expense.paid_by_member_name}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex w-full items-center justify-between gap-4 border-t border-white/5 pt-3 sm:min-w-[150px] sm:flex-col sm:items-end sm:gap-1.5 sm:border-0 sm:pt-0">
                  <span className="font-heading text-lg font-bold text-headline sm:text-xl">
                    {formattedAmount}
                  </span>
                  <span className="text-xs font-medium text-primary sm:text-sm">
                    {getSplitTypeLabel(expense.split_type)}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-headline/5 text-muted-foreground">
            <CircleDollarSign className="size-7" aria-hidden="true" />
          </span>
          <h2 className="font-heading text-xl font-semibold text-headline">
            No hay gastos en este filtro
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Prueba consultar todos los gastos del evento o registra uno nuevo.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {filter !== "all" && (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setFilter("all")}
              >
                Ver todos
              </Button>
            )}
            <Button
              type="button"
              onClick={() => setIsUploadSheetOpen(true)}
              className="w-full rounded-xl bg-action-orange text-action-orange-foreground hover:bg-action-orange/90 sm:w-auto"
            >
              Registrar primer gasto
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Sheet de Carga de Comprobante/Foto */}
      <ReceiptUploadSheet
        eventId={eventId}
        open={isUploadSheetOpen}
        onOpenChange={setIsUploadSheetOpen}
      />
    </section>
  )
}
