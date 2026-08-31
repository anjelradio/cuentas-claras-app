"use client"

import * as React from "react"
import { CheckCircle2, Clock3, X, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { ExpenseParticipantDemo, PaymentStatus } from "@/app/expenses/_types/expense-demo"

interface ExpenseParticipantsProps {
  participants: ExpenseParticipantDemo[]
  receiptImageUrl: string
}

const STATUS_STYLES: Record<PaymentStatus, { label: string; icon: typeof Clock3; className: string }> = {
  pending: { label: "Por verificar", icon: Clock3, className: "bg-warning/10 text-warning" },
  paid: { label: "Pagado", icon: CheckCircle2, className: "bg-success/10 text-success" },
  unpaid: { label: "Sin pagar", icon: XCircle, className: "bg-error/10 text-error" },
}

/** Participantes de Stitch con comprobantes consultables mediante bottom sheets. */
export function ExpenseParticipants({ participants, receiptImageUrl }: ExpenseParticipantsProps) {
  const [selected, setSelected] = React.useState<ExpenseParticipantDemo | null>(null)

  function closeSheet() {
    setSelected(null)
  }

  function resolvePayment(action: "confirm" | "reject") {
    toast.success(action === "confirm" ? "Pago confirmado para la demostración." : "Pago rechazado para la demostración.")
    closeSheet()
  }

  const sortedParticipants = React.useMemo(() => {
    const order: Record<PaymentStatus, number> = {
      pending: 0,
      paid: 1,
      unpaid: 2,
    }
    return [...participants].sort((a, b) => order[a.paymentStatus] - order[b.paymentStatus])
  }, [participants])

  return <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-medium text-headline">Participantes</h2><span className="text-xs uppercase tracking-wider text-muted-foreground">{participants.length} personas</span></div><div className="grid gap-3">{sortedParticipants.map((participant) => {
    const status = STATUS_STYLES[participant.paymentStatus]
    const Icon = status.icon
    const isInteractive = participant.paymentStatus !== "unpaid"
    const content = <><span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", status.className)}><Icon className="size-5" aria-hidden="true" /></span><span className="min-w-0 flex-1 text-left"><span className="block truncate font-medium text-headline">{participant.name}{participant.isCurrentUser ? " (Tú)" : ""}</span><span className="text-xs text-muted-foreground">{participant.isCurrentUser ? "Tu parte" : "Debe"}: {participant.share}</span></span><span className={cn("rounded-full px-3 py-1 text-[10px] font-semibold uppercase", status.className)}>{status.label}</span></>
    return isInteractive ? <button key={participant.id} type="button" onClick={() => setSelected(participant)} className="flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-surface/80 p-4 transition-colors hover:bg-headline/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{content}</button> : <div key={participant.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-surface/80 p-4">{content}</div>
  })}</div><Sheet open={Boolean(selected)} onOpenChange={(open) => !open && closeSheet()}><SheetContent side="bottom" showCloseButton={false} className="max-h-[90dvh] overflow-y-auto rounded-t-[32px] border-border bg-overlay-surface p-6 text-headline sm:max-w-2xl"><div className="mx-auto -mt-2 mb-3 h-1.5 w-12 rounded-full bg-headline/15" /><SheetHeader className="mb-5 flex-row items-start justify-between p-0"><div><SheetTitle className="text-xl">{selected?.paymentStatus === "pending" ? "Verificar pago" : "Detalle de pago"}</SheetTitle><SheetDescription>{selected?.paymentStatus === "pending" ? `Revisa el comprobante enviado por ${selected?.name}.` : `Comprobante confirmado de ${selected?.name}.`}</SheetDescription></div><SheetClose render={<Button variant="ghost" size="icon" aria-label="Cerrar detalle del pago" />}><X aria-hidden="true" /></SheetClose></SheetHeader><div role="img" aria-label={`Comprobante de ${selected?.name ?? "participante"}`} className="min-h-[45dvh] rounded-2xl border border-white/10 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${receiptImageUrl})` }} />{selected?.paymentStatus === "paid" && <div className="mt-4 rounded-xl border border-success/20 bg-success/10 p-4 text-sm text-success"><CheckCircle2 className="mr-2 inline size-4" aria-hidden="true" />Pago confirmado el 18 de agosto de 2026 a las 19:45.</div>}{selected?.paymentStatus === "pending" && <div className="mt-6 grid grid-cols-2 gap-3"><Button type="button" variant="outline" className="h-12 rounded-xl border-error/30 text-error hover:bg-error/10 hover:text-error" onClick={() => resolvePayment("reject")}>Rechazar</Button><Button type="button" className="h-12 rounded-xl bg-gradient-to-br from-[#5f4dff] to-[#1e1c9e] text-white" onClick={() => resolvePayment("confirm")}>Confirmar</Button></div>}</SheetContent></Sheet></section>
}
