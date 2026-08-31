"use client"

import * as React from "react"
import { ArrowLeft, X } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { buttonVariants } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { ExpenseDemo } from "@/app/expenses/_types/expense-demo"
import { ExpenseParticipants } from "./expense-participants"
import { ExpenseSummary } from "./expense-summary"
import { SettleExpenseSheet } from "./settle-expense-sheet"

interface ExpenseDetailViewProps {
  eventId: string
  expense: ExpenseDemo
}

/** Encapsula los overlays cliente del detalle que ya fue resuelto por la ruta de servidor. */
export function ExpenseDetailView({ eventId, expense }: ExpenseDetailViewProps) {
  const [isCancelOpen, setIsCancelOpen] = React.useState(false)
  const [isCanceling, setIsCanceling] = React.useState(false)
  const currentParticipant = expense.participants.find((participant) => participant.isCurrentUser)

  function cancelExpense(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsCanceling(true)
    window.setTimeout(() => {
      setIsCanceling(false)
      setIsCancelOpen(false)
      toast.success("Gasto marcado para anulación de demostración.")
    }, 350)
  }

  return <section className="mx-auto w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="mb-6 flex items-center gap-3"><Link href={`/expenses/event/${eventId}`} aria-label="Volver a gastos" className={buttonVariants({ variant: "ghost", size: "icon" })}><ArrowLeft aria-hidden="true" /></Link><div><p className="text-sm text-muted-foreground">Detalle del gasto</p><p className="font-medium text-headline">Samaipata 2026</p></div></div>
    <div className="grid gap-8 lg:grid-cols-12"><div className="lg:col-span-7"><ExpenseSummary expense={expense} settleAction={currentParticipant?.paymentStatus === "pending" ? <SettleExpenseSheet amount={currentParticipant.share} /> : undefined} onCancel={() => setIsCancelOpen(true)} /></div><div className="lg:col-span-5"><ExpenseParticipants participants={expense.participants} receiptImageUrl={expense.receiptImageUrl ?? ""} /></div></div>
    <AlertDialog open={isCancelOpen} onOpenChange={(open) => !isCanceling && setIsCancelOpen(open)}><AlertDialogContent className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-[#181b27] p-8 text-white shadow-2xl"><AlertDialogHeader className="flex w-full flex-col !place-items-center gap-1.5 !text-center sm:!place-items-center sm:!text-center"><span className="mb-2 flex size-16 items-center justify-center rounded-full bg-error/10 text-error"><X className="size-8" aria-hidden="true" /></span><AlertDialogTitle className="w-full text-center">¿Anular gasto?</AlertDialogTitle><AlertDialogDescription className="w-full text-center text-[#9699be]">Este gasto dejará de estar activo. Esta acción es únicamente demostrativa por ahora.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="grid grid-cols-1 gap-3 sm:grid-cols-2"><AlertDialogCancel disabled={isCanceling} className="h-12 rounded-xl border-border bg-transparent text-white hover:bg-white/5">Cancelar</AlertDialogCancel><AlertDialogAction disabled={isCanceling} onClick={cancelExpense} className="h-12 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#e65100] text-white shadow-[0_4px_12px_rgba(255,107,26,0.3)] transition-all hover:-translate-y-0.5 hover:from-[#ff6b35] hover:to-[#e65100]">{isCanceling ? "Anulando…" : "Anular gasto"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>
}
