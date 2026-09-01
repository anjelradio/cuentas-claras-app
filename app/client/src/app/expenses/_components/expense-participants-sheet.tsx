"use client"

import * as React from "react"
import { Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export interface EventMemberOption {
  id: string
  name: string
  image?: string | null
}

interface ExpenseParticipantsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: EventMemberOption[]
  splitType: "equal" | "exact"
  onSplitTypeChange?: (splitType: "equal" | "exact") => void
  selectedMemberIds: Set<string>
  onSelectedMemberIdsChange: (selectedIds: Set<string>) => void
  exactAmounts?: Record<string, string>
  onExactAmountChange?: (memberId: string, amount: string) => void
  totalAmount?: string
  currentUserMemberId?: string
  onConfirm: () => void
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || "MB"
}

/** Bottom sheet accesible para seleccionar participantes y cuotas exactas. */
export function ExpenseParticipantsSheet({
  open,
  onOpenChange,
  members,
  splitType,
  onSplitTypeChange,
  selectedMemberIds,
  onSelectedMemberIdsChange,
  exactAmounts = {},
  onExactAmountChange,
  totalAmount,
  currentUserMemberId,
  onConfirm,
}: ExpenseParticipantsSheetProps) {
  function toggleParticipant(memberId: string) {
    const next = new Set(selectedMemberIds)
    if (next.has(memberId)) {
      next.delete(memberId)
    } else {
      next.add(memberId)
    }
    onSelectedMemberIdsChange(next)
  }

  const exactSum = Object.values(exactAmounts).reduce((acc, val) => {
    const num = Number.parseFloat(val) || 0
    return acc + num
  }, 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="h-dvh max-h-dvh rounded-none border-border bg-overlay-surface p-6 text-headline sm:h-[78dvh] sm:max-h-[78dvh] sm:max-w-2xl sm:rounded-t-[32px] sm:p-8"
      >
        <div className="mx-auto -mt-2 mb-3 h-1.5 w-12 shrink-0 rounded-full bg-headline/15" />
        <SheetHeader className="shrink-0 flex-row items-start justify-between p-0">
          <div>
            <SheetTitle className="text-xl">Participantes del gasto</SheetTitle>
            <SheetDescription className="mt-1">
              {splitType === "equal"
                ? "Selecciona quiénes participan en este gasto equitativo."
                : "Introduce el monto exacto asignado a cada participante."}
            </SheetDescription>
          </div>
          <SheetClose render={<Button variant="ghost" size="icon" aria-label="Cerrar participantes" />}>
            <X aria-hidden="true" />
          </SheetClose>
        </SheetHeader>

        {onSplitTypeChange && (
          <div className="mt-4 flex gap-2 rounded-xl bg-background/50 p-1">
            <button
              type="button"
              onClick={() => onSplitTypeChange("equal")}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-semibold transition-all sm:text-sm",
                splitType === "equal" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-white"
              )}
            >
              División equitativa
            </button>
            <button
              type="button"
              onClick={() => onSplitTypeChange("exact")}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-semibold transition-all sm:text-sm",
                splitType === "exact" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-white"
              )}
            >
              Montos exactos
            </button>
          </div>
        )}

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-3">
            {members.map((member) => {
              const selected = selectedMemberIds.has(member.id)
              const initials = getInitials(member.name)
              const isCurrentUser = Boolean(currentUserMemberId && member.id === currentUserMemberId)

              if (splitType === "exact") {
                return (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-4 transition-all",
                      "border-border bg-background/50"
                    )}
                  >
                    <span className="flex items-center gap-4">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="size-12 rounded-full object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <span className="flex size-12 items-center justify-center rounded-full border border-transparent bg-secondary/20 text-sm font-semibold text-secondary shrink-0">
                          {initials}
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-headline">{member.name}</span>
                        {isCurrentUser && (
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/30 uppercase tracking-wider">
                            Este eres tú
                          </span>
                        )}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Bs.</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        aria-label={`Monto para ${member.name}`}
                        placeholder="0.00"
                        value={exactAmounts[member.id] ?? ""}
                        onChange={(e) => onExactAmountChange?.(member.id, e.target.value)}
                        className="w-24 text-right sm:w-28"
                      />
                    </div>
                  </div>
                )
              }

              return (
                <label
                  key={member.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all",
                    selected
                      ? "border-primary/40 bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30"
                      : "border-transparent bg-background/50 hover:bg-headline/5"
                  )}
                >
                  <span className="flex items-center gap-4">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="size-12 rounded-full object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <span
                        className={cn(
                          "flex size-12 items-center justify-center rounded-full border text-sm font-semibold shrink-0",
                          selected
                            ? "border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground"
                            : "border-transparent bg-secondary/20 text-secondary"
                        )}
                      >
                        {initials}
                      </span>
                    )}
                    <span className="flex items-center gap-2">
                      <span className={cn("font-semibold", selected ? "text-primary-foreground" : "text-headline")}>
                        {member.name}
                      </span>
                      {isCurrentUser && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                            selected
                              ? "bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/30"
                              : "bg-primary/15 text-primary border border-primary/30"
                          )}
                        >
                          Este eres tú
                        </span>
                      )}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded border-2",
                      selected
                        ? "border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground"
                        : "border-border"
                    )}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleParticipant(member.id)}
                      className="sr-only"
                    />
                    {selected && (
                      <Check className="size-4 text-primary-foreground" strokeWidth={3} aria-hidden="true" />
                    )}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {splitType === "exact" && totalAmount && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground sm:text-sm">
            <span>Suma de cuotas: Bs. {exactSum.toFixed(2)}</span>
            <span>Total esperado: Bs. {Number.parseFloat(totalAmount || "0").toFixed(2)}</span>
          </div>
        )}

        <div className="mt-6 flex shrink-0 flex-col gap-4 border-t border-border pt-6 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-12 w-full rounded-xl sm:w-1/3"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="h-12 w-full rounded-xl bg-action-orange text-action-orange-foreground shadow-lg shadow-action-orange/30 hover:bg-action-orange/90 sm:w-2/3"
          >
            Confirmar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
