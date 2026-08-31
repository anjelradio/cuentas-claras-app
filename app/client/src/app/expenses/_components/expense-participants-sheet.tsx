"use client"

import * as React from "react"
import { Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { EXPENSE_PARTICIPANTS } from "@/app/expenses/_types/expense-demo"

interface ExpenseParticipantsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/** Bottom sheet de Stitch con selección azul y listado interno desplazable. */
export function ExpenseParticipantsSheet({ open, onOpenChange, onConfirm }: ExpenseParticipantsSheetProps) {
  const [selectedParticipants, setSelectedParticipants] = React.useState(() => new Set(EXPENSE_PARTICIPANTS.map((participant) => participant.id)))

  function toggleParticipant(participantId: string) {
    setSelectedParticipants((current) => {
      const next = new Set(current)
      if (next.has(participantId)) next.delete(participantId)
      else next.add(participantId)
      return next
    })
  }

  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="bottom" showCloseButton={false} className="h-dvh max-h-dvh rounded-none border-border bg-overlay-surface p-6 text-headline sm:h-[78dvh] sm:max-h-[78dvh] sm:max-w-2xl sm:rounded-t-[32px] sm:p-8"><div className="mx-auto -mt-2 mb-3 h-1.5 w-12 shrink-0 rounded-full bg-headline/15" /><SheetHeader className="shrink-0 flex-row items-start justify-between p-0"><div><SheetTitle className="text-xl">Excluir miembros del gasto</SheetTitle><SheetDescription className="mt-1">Selecciona quiénes participan en este gasto. Por defecto todos están incluidos.</SheetDescription></div><SheetClose render={<Button variant="ghost" size="icon" aria-label="Cerrar participantes" />}><X aria-hidden="true" /></SheetClose></SheetHeader><div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1"><div className="grid gap-3">{EXPENSE_PARTICIPANTS.map((participant) => { const selected = selectedParticipants.has(participant.id); return <label key={participant.id} className={cn("flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all", selected ? "border-primary/40 bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30" : "border-transparent bg-background/50 hover:bg-headline/5")}><span className="flex items-center gap-4"><span className={cn("flex size-12 items-center justify-center rounded-full border text-sm font-semibold", selected ? "border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground" : "border-transparent bg-secondary/20 text-secondary")}>{participant.initials}</span><span className={cn("font-semibold", selected ? "text-primary-foreground" : "text-headline")}>{participant.name}</span></span><span className={cn("flex size-6 items-center justify-center rounded border-2", selected ? "border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground" : "border-border")}><Checkbox checked={selected} onCheckedChange={() => toggleParticipant(participant.id)} className="sr-only" />{selected && <Check className="size-4 text-primary-foreground" strokeWidth={3} aria-hidden="true" />}</span></label> })}</div></div><div className="mt-6 shrink-0 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-12 w-full rounded-xl sm:w-1/3">Cancelar</Button><Button type="button" onClick={onConfirm} className="h-12 w-full rounded-xl bg-action-orange text-action-orange-foreground shadow-lg shadow-action-orange/30 hover:bg-action-orange/90 sm:w-2/3">Confirmar</Button></div></SheetContent></Sheet>
}
