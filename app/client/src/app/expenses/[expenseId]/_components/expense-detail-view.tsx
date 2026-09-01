"use client"

import * as React from "react"
import { ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { buttonVariants } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { ExpenseDetail } from "@/app/expenses/_types/expense"
import { ExpenseApi } from "@/app/expenses/_services/expense-api"
import { ExpenseParticipants } from "./expense-participants"
import { ExpenseSummary } from "./expense-summary"

interface ExpenseDetailViewProps {
  eventId: string
  expense: ExpenseDetail
  eventName?: string
}

/** Vista interactiva del detalle del gasto con soporte contextual de rol, pagos y anulación real. */
export function ExpenseDetailView({
  eventId,
  expense,
  eventName = "Evento",
}: ExpenseDetailViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const action = searchParams.get("action")
  const splitId = searchParams.get("splitId")

  const [isCancelOpen, setIsCancelOpen] = React.useState(false)
  const [isCanceling, setIsCanceling] = React.useState(false)

  function handleClearActionUrl() {
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState(null, "", window.location.pathname)
    }
  }

  async function handleCancelExpense() {
    setIsCanceling(true)
    try {
      await ExpenseApi.deleteExpense(expense.id)
      toast.success("Gasto anulado exitosamente.")
      setIsCancelOpen(false)
      router.push(`/expenses/event/${eventId}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al anular el gasto.")
    } finally {
      setIsCanceling(false)
    }
  }

  function handleDataUpdated() {
    handleClearActionUrl()
    router.refresh()
  }

  return (
    <section className="mx-auto w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/expenses/event/${eventId}`}
          aria-label="Volver a gastos"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeft aria-hidden="true" />
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">Detalle del gasto</p>
          <p className="font-medium text-headline">{eventName}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ExpenseSummary
            expense={expense}
            autoOpenPay={action === "pay"}
            onCancel={() => setIsCancelOpen(true)}
            onReceiptUpdated={handleDataUpdated}
            onPaymentUpdated={handleDataUpdated}
            onClosePay={handleClearActionUrl}
          />
        </div>
        <div className="lg:col-span-5">
          <ExpenseParticipants
            splits={expense.splits}
            isPayer={expense.is_payer}
            autoOpenSplitId={action === "verify" ? splitId : null}
            onPaymentResolved={handleDataUpdated}
            onCloseVerify={handleClearActionUrl}
          />
        </div>
      </div>

      <AlertDialog
        open={isCancelOpen}
        onOpenChange={(open) => !isCanceling && setIsCancelOpen(open)}
      >
        <AlertDialogContent className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-[#181b27] p-8 text-white shadow-2xl">
          <AlertDialogHeader className="flex w-full flex-col !place-items-center gap-1.5 !text-center sm:!place-items-center sm:!text-center">
            <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-error/10 text-error">
              <Trash2 className="size-8" aria-hidden="true" />
            </span>
            <AlertDialogTitle className="w-full text-center">
              ¿Anular gasto?
            </AlertDialogTitle>
            <AlertDialogDescription className="w-full text-center text-[#9699be]">
              Este gasto será anulado lógicamente y dejará de figurar en los listados activos del evento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AlertDialogCancel
              disabled={isCanceling}
              className="h-12 rounded-xl border-border bg-transparent text-white hover:bg-white/5"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isCanceling}
              onClick={(e) => {
                e.preventDefault()
                handleCancelExpense()
              }}
              className="h-12 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#e65100] text-white shadow-[0_4px_12px_rgba(255,107,26,0.3)] transition-all hover:-translate-y-0.5 hover:from-[#ff6b35] hover:to-[#e65100]"
            >
              {isCanceling ? "Anulando…" : "Anular gasto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
