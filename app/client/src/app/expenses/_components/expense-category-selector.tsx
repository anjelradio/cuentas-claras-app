"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/app/expenses/_types/expense"

interface ExpenseCategorySelectorProps {
  category: ExpenseCategory
  onCategoryChange: (category: ExpenseCategory) => void
}

/** Componente de selección visual de categorías para gastos. */
export function ExpenseCategorySelector({
  category,
  onCategoryChange,
}: ExpenseCategorySelectorProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid w-full max-w-[380px] grid-cols-3 gap-3">
        {EXPENSE_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Categoría ${item.label}`}
            aria-pressed={category === item.id}
            onClick={() => onCategoryChange(item.id as ExpenseCategory)}
            className={cn(
              "aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl border transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d3bff]/50",
              category === item.id
                ? "border-white bg-white/20"
                : "border-border bg-[#151a30]/80 hover:bg-white/10"
            )}
          >
            <span aria-hidden="true" className="text-3xl leading-none">
              {item.emoji}
            </span>
            <span
              className={cn(
                "text-[10px] font-medium leading-tight sm:text-xs",
                category === item.id ? "text-white" : "text-muted-foreground"
              )}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
