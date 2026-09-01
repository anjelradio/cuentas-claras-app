"use client"

import * as React from "react"
import { CheckCircle, Clock, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ExpenseSplit } from "@/app/expenses/_types/expense"
import { VerifyPaymentSheet } from "./verify-payment-sheet"

interface ExpenseParticipantsProps {
  splits: ExpenseSplit[]
  isPayer?: boolean
  autoOpenSplitId?: string | null
  onPaymentResolved?: () => void
  onCloseVerify?: () => void
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || "MB"
}

/** Desglose interactivo de cuotas individuales de los participantes con estados de pago. */
export function ExpenseParticipants({
  splits,
  isPayer = false,
  autoOpenSplitId,
  onPaymentResolved,
  onCloseVerify,
}: ExpenseParticipantsProps) {
  const [selectedSplit, setSelectedSplit] = React.useState<ExpenseSplit | null>(null)
  const [verifyOpen, setVerifyOpen] = React.useState(false)

  React.useEffect(() => {
    if (!autoOpenSplitId || !isPayer) return
    const match = splits.find(
      (s) =>
        s.id === autoOpenSplitId &&
        (s.payment_status === "pending_confirmation" || s.payment_status === "confirmed")
    )
    if (match) {
      setSelectedSplit(match)
      setVerifyOpen(true)
    }
  }, [autoOpenSplitId, isPayer, splits])

  function handleParticipantClick(split: ExpenseSplit) {
    if (!isPayer) return
    // El pagador puede interactuar para verificar o ver el comprobante
    if (split.payment_status === "pending_confirmation" || split.payment_status === "confirmed") {
      setSelectedSplit(split)
      setVerifyOpen(true)
    }
  }

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
          const isPending = split.payment_status === "pending_confirmation"
          const isPaid = split.payment_status === "confirmed"
          const isUnpaid = split.payment_status === "no_payment" || split.payment_status === "rejected"

          const isClickable = isPayer && (isPending || isPaid)

          return (
            <div
              key={split.id}
              onClick={() => handleParticipantClick(split)}
              className={cn(
                "flex items-center justify-between rounded-2xl border border-white/5 bg-surface/80 p-4 shadow transition-all",
                isClickable && "cursor-pointer hover:bg-white/5 hover:border-white/15"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    isPaid && "bg-success/20 text-success",
                    isPending && "bg-warning/20 text-warning",
                    isUnpaid && "bg-error/20 text-error"
                  )}
                >
                  {isPaid ? (
                    <CheckCircle className="size-5" />
                  ) : isPending ? (
                    <Clock className="size-5" />
                  ) : (
                    <XCircle className="size-5" />
                  )}
                </span>
                <div>
                  <p className="truncate font-medium text-headline">
                    {split.member_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPaid ? "Parte saldada" : `Debe: ${formattedAmount}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isPaid && (
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-success">
                    Pagado
                  </span>
                )}
                {isPending && (
                  <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-warning animate-pulse">
                    Por verificar
                  </span>
                )}
                {isUnpaid && (
                  <span className="rounded-full bg-error/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-error">
                    Sin pagar
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedSplit && (
        <VerifyPaymentSheet
          open={verifyOpen}
          onOpenChange={(open) => {
            setVerifyOpen(open)
            if (!open) {
              setSelectedSplit(null)
              onCloseVerify?.()
            }
          }}
          paymentId={selectedSplit.payment_id ?? null}
          memberName={selectedSplit.member_name}
          amount={`Bs. ${Number.parseFloat(String(selectedSplit.assigned_amount)).toFixed(2)}`}
          paymentMethod={selectedSplit.payment_method ?? null}
          proofImageUrl={selectedSplit.proof_image_url ?? null}
          status={selectedSplit.payment_status}
          onResolved={() => {
            onPaymentResolved?.()
          }}
        />
      )}
    </section>
  )
}
