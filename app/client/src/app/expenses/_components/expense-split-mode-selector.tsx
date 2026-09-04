"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { ExpenseSplitType } from "@/app/expenses/_types/expense"

interface ExpenseSplitModeSelectorProps {
  splitType: ExpenseSplitType
  onSplitTypeChange: (splitType: ExpenseSplitType) => void
}

/** Componente selector de modalidad de división (montos iguales vs exactos). */
export function ExpenseSplitModeSelector({
  splitType,
  onSplitTypeChange,
}: ExpenseSplitModeSelectorProps) {
  return (
    <div
      className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-[#151a30]/60 p-1"
      aria-label="Modalidad de división"
    >
      {(["equal", "exact"] as const).map((modeOption) => (
        <button
          key={modeOption}
          type="button"
          aria-pressed={splitType === modeOption}
          onClick={() => onSplitTypeChange(modeOption)}
          className={cn(
            "rounded-xl px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            splitType === modeOption
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-white/10 hover:text-white"
          )}
        >
          <span className="block">
            {modeOption === "equal" ? "Montos iguales" : "Montos exactos"}
          </span>
          <span className="mt-1 block text-[11px] font-normal opacity-80">
            {modeOption === "equal"
              ? "Todos pagan por igual"
              : "Define cuánto paga cada persona"}
          </span>
        </button>
      ))}
    </div>
  )
}
