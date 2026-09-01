"use client"

import * as React from "react"

import type { ExpenseSplit } from "@/app/expenses/_types/expense"

interface ExpenseParticipantsProps {
  splits: ExpenseSplit[]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || "MB"
}

/** Desglose de cuotas individuales de los participantes asignados al gasto. */
export function ExpenseParticipants({ splits }: ExpenseParticipantsProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-headline">Participantes</h2>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {splits.length} {splits.length === 1 ? "persona" : "personas"}
        </span>
      </div>

      <div className="grid gap-3">
        {splits.map((split) => {
          const initials = getInitials(split.member_name)
          const formattedAmount = `Bs. ${Number.parseFloat(String(split.assigned_amount)).toFixed(2)}`

          return (
            <div
              key={split.id}
              className="flex items-center justify-between rounded-2xl border border-white/5 bg-surface/80 p-4 shadow transition-all hover:bg-headline/5"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-transparent bg-secondary/20 text-sm font-semibold text-secondary">
                  {initials}
                </span>
                <span className="truncate font-medium text-headline">
                  {split.member_name}
                </span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">Cuota asignada</span>
                <span className="font-heading text-sm font-bold text-headline sm:text-base">
                  {formattedAmount}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
