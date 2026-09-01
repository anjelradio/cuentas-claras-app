"use client"

import * as React from "react"
import { ArrowLeft, Check, CircleCheck, WalletCards, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { BottomSheetActionButton } from "@/components/custom/bottom-sheet-action-button"

export interface EventMemberOption {
  id: string
  name: string
  image?: string | null
}

interface ExpenseParticipantsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: EventMemberOption[]
  payer?: EventMemberOption
  splitType: "equal" | "exact"
  selectedMemberIds: Set<string>
  onSelectedMemberIdsChange: (selectedIds: Set<string>) => void
  exactAmounts: Record<string, string>
  onExactAmountChange: (memberId: string, amount: string) => void
  totalAmount: string
  payerParticipated: boolean | null
  onPayerParticipatedChange: (value: boolean) => void
  onConfirm: () => void
  isSubmitting?: boolean
}

function cents(value: string) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
}

function initials(name: string) {
  return name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "MB"
}

/** Wizard accesible que separa el consumo del pagador de las cuotas de terceros. */
export function ExpenseParticipantsSheet({
  open, onOpenChange, members, payer, splitType, selectedMemberIds, onSelectedMemberIdsChange,
  exactAmounts, onExactAmountChange, totalAmount, payerParticipated,
  onPayerParticipatedChange, onConfirm, isSubmitting = false,
}: ExpenseParticipantsSheetProps) {
  const [step, setStep] = React.useState<1 | 2>(1)

  const totalCents = cents(totalAmount)
  const displayedMembers = splitType === "exact" && payerParticipated && payer ? [payer, ...members] : members
  const exactCents = displayedMembers.reduce((total, member) => total + cents(exactAmounts[member.id] || ""), 0)
  const exactRefundCents = members.reduce((total, member) => total + cents(exactAmounts[member.id] || ""), 0)
  const selected = members.filter((member) => selectedMemberIds.has(member.id))
  const consumerCount = selected.length + (payerParticipated ? 1 : 0)
  const equalRefund = consumerCount ? Math.floor(totalCents / consumerCount) * selected.length + Math.max(0, totalCents % consumerCount - (payerParticipated ? 1 : 0)) : 0
  const refundCents = splitType === "equal" ? equalRefund : exactRefundCents
  const exactComplete = splitType !== "exact" || (payerParticipated ? exactCents === totalCents : refundCents === totalCents)
  const valid = payerParticipated !== null && (payerParticipated || selected.length > 0) && refundCents <= totalCents && (payerParticipated || refundCents === totalCents) && exactComplete

  function toggle(memberId: string) {
    const next = new Set(selectedMemberIds)
    if (next.has(memberId)) {
      next.delete(memberId)
    } else {
      next.add(memberId)
    }
    onSelectedMemberIdsChange(next)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setStep(1)
    onOpenChange(nextOpen)
  }

  function selectParticipation(value: boolean) {
    onPayerParticipatedChange(value)
    setStep(2)
  }

  return <Sheet open={open} onOpenChange={handleOpenChange}>
    <SheetContent side="bottom" showCloseButton={false} className="flex h-dvh max-h-dvh flex-col rounded-none border-border bg-overlay-surface p-6 text-headline sm:h-[78dvh] sm:max-h-[78dvh] sm:max-w-2xl sm:rounded-t-[32px] sm:p-8">
      <div className="mx-auto -mt-2 mb-3 h-1.5 w-12 shrink-0 rounded-full bg-headline/15" />
      <SheetHeader className="shrink-0 flex-row items-start justify-between p-0">
        <div>
          <SheetTitle className="text-xl">{step === 1 ? "Tu participación" : "Participantes del gasto"}</SheetTitle>
          <SheetDescription className={cn("mt-1", step === 1 && "sr-only")}>{step === 1 ? "Indica si participaste en este gasto." : "Asigna únicamente a las demás personas."}</SheetDescription>
        </div>
        <SheetClose render={<Button variant="ghost" size="icon" aria-label="Cerrar participantes" />}><X aria-hidden="true" /></SheetClose>
      </SheetHeader>

      {step === 1 ? <div className="mt-8 grid grid-cols-2 gap-3">
        <BottomSheetActionButton
          icon={CircleCheck}
          title="Sí, participé"
          description="Mi parte queda como aporte personal."
          variant="orange"
          layout="stacked"
          aria-pressed={payerParticipated === true}
          className={cn(payerParticipated === true && "ring-2 ring-white ring-offset-2 ring-offset-overlay-surface")}
          onClick={() => selectParticipation(true)}
        />
        <BottomSheetActionButton
          icon={WalletCards}
          title="No, solo pagué"
          description="Las demás personas cubren el total."
          variant="blue"
          layout="stacked"
          aria-pressed={payerParticipated === false}
          className={cn(payerParticipated === false && "ring-2 ring-white ring-offset-2 ring-offset-overlay-surface")}
          onClick={() => selectParticipation(false)}
        />
      </div> : <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1"><div className="grid gap-3">
        {displayedMembers.map((member) => {
          const isPayer = payer?.id === member.id
          const isSelected = selectedMemberIds.has(member.id)
          return <div key={member.id} className={cn("flex items-center justify-between rounded-xl border p-4 transition-all", isPayer ? "border-primary/30 bg-primary/5" : isSelected ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/15" : "border-border bg-background/50")}>
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
              {isPayer ? <span className="flex size-4 items-center justify-center text-xs text-primary" aria-hidden="true">●</span> : <Checkbox checked={isSelected} onCheckedChange={() => toggle(member.id)} aria-label={`Incluir a ${member.name}`} />}
              {member.image ? <img src={member.image} alt="" className="size-10 rounded-full object-cover" /> : <span className="flex size-10 items-center justify-center rounded-full bg-secondary/20 text-xs font-semibold text-secondary">{initials(member.name)}</span>}
              <span className="truncate font-semibold text-headline">{isPayer ? "Este eres tú" : member.name}</span>
            </label>
            {splitType === "exact" && <div className="ml-3 flex items-center gap-2"><span className="text-sm text-muted-foreground">Bs.</span><Input type="number" min="0" step="0.01" inputMode="decimal" aria-label={`Monto para ${member.name}`} value={exactAmounts[member.id] ?? ""} onFocus={() => !isPayer && !isSelected && toggle(member.id)} onChange={(event) => onExactAmountChange(member.id, event.target.value)} className="w-24 text-right" /></div>}
          </div>
        })}
      </div></div>}

      {step === 2 && <div className="mt-4 rounded-xl border border-border bg-background/40 p-4 text-sm"><div className="flex justify-between"><span>Total</span><strong>Bs. {(totalCents / 100).toFixed(2)}</strong></div><div className="mt-1 flex justify-between text-primary"><span>Devolución</span><strong>Bs. {(refundCents / 100).toFixed(2)}</strong></div><div className="mt-1 flex justify-between text-muted-foreground"><span>Aporte personal</span><strong>Bs. {((totalCents - refundCents) / 100).toFixed(2)}</strong></div></div>}
      {step === 2 && <div className="mt-6 flex shrink-0 gap-3 border-t border-border pt-5">
        <Button type="button" variant="outline" className="h-12 rounded-xl" onClick={() => setStep(1)} disabled={isSubmitting}><ArrowLeft className="mr-2 size-4" />Volver</Button>
        <Button type="button" className="h-12 flex-1 rounded-xl bg-action-orange text-action-orange-foreground hover:bg-action-orange/90" disabled={!valid || isSubmitting} onClick={onConfirm}>{isSubmitting ? "Guardando…" : <>Confirmar <Check className="ml-2 size-4" /></>}</Button>
      </div>}
    </SheetContent>
  </Sheet>
}
