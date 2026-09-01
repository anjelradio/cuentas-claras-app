"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Layout, X, CheckCircle2, Clock, Loader2 } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet"
import { QuickActionButton } from "@/components/custom/quick-action-button"
import { ExpenseApi } from "../../expenses/_services/expense-api"
import { EXPENSE_CATEGORIES } from "../../expenses/_types/expense"
import type { DebtsSummary } from "../../expenses/_types/expense"

interface MyDebtsSheetProps {
  eventId?: string
  initialData?: DebtsSummary | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactElement | null
}

export function MyDebtsSheet({
  eventId,
  initialData,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: MyDebtsSheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled ? (setControlledOpen || (() => {})) : setUncontrolledOpen

  const [step, setStep] = React.useState<"select" | "owe" | "owed">("select")
  const [data, setData] = React.useState<DebtsSummary | null>(initialData || null)
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const result = await ExpenseApi.getDebtsSummary(eventId)
      setData(result)
    } catch {
      // Usar estado previo o vacío si falla
    } finally {
      setLoading(false)
    }
  }, [eventId])

  React.useEffect(() => {
    if (open) {
      loadData()
    } else {
      setTimeout(() => setStep("select"), 300)
    }
  }, [open, loadData])

  const totalOwe = Number(data?.total_i_owe || 0).toFixed(2)
  const totalOwed = Number(data?.total_i_am_owed || 0).toFixed(2)

  const getCategoryEmoji = (category: string) => {
    const meta = EXPENSE_CATEGORIES.find((c) => c.id === category)
    return meta?.emoji || "💸"
  }

  const navigateToExpenseToPay = (expenseId: string) => {
    setOpen(false)
    router.push(`/expenses/${expenseId}?action=pay`)
  }

  const navigateToExpenseGeneral = (expenseId: string) => {
    setOpen(false)
    router.push(`/expenses/${expenseId}`)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <SheetTrigger
          render={
            trigger ?? (
              <QuickActionButton
                icon={Layout}
                title="Mis deudas"
                description="Gestiona lo que debes y lo que te deben"
                variant="secondary-purple"
              />
            )
          }
        />
      )}
      
      <SheetContent showCloseButton={false} side="bottom" className="bg-[#181b27] border-border text-white rounded-t-[32px] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
        </div>

        {step === "select" && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <SheetHeader className="mb-6 p-0 flex flex-row justify-between items-center space-y-0">
              <SheetTitle className="text-2xl font-semibold text-white">Mis deudas</SheetTitle>
              <SheetClose render={
                <button className="text-muted-foreground hover:text-white transition-colors p-1" aria-label="Cerrar">
                  <X className="size-6" />
                </button>
              } />
            </SheetHeader>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground animate-in fade-in duration-300">
                <Loader2 className="size-8 animate-spin text-[#bd7aff]" />
                <p className="text-sm font-medium text-white/80">Cargando tus deudas…</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mb-8">
                <button 
                  onClick={() => setStep("owe")}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer border border-border w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#ef4444]/10 rounded-full flex items-center justify-center text-[#ef4444] shrink-0">
                      <ArrowUpRight className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-0.5">Lo que debes</h4>
                      <p className="text-xs text-muted-foreground">
                        Bs. {totalOwe} en total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-[#ef4444]">- Bs. {totalOwe}</span>
                  </div>
                </button>

                <button 
                  onClick={() => setStep("owed")}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer border border-border w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#22c55e]/10 rounded-full flex items-center justify-center text-[#22c55e] shrink-0">
                      <ArrowDownLeft className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-0.5">Lo que te deben</h4>
                      <p className="text-xs text-muted-foreground">
                        Bs. {totalOwed} en total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-[#22c55e]">+ Bs. {totalOwed}</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {step === "owe" && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("select")} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                  <ArrowLeft className="size-5" />
                </button>
                <h3 className="text-2xl font-semibold text-white">Lo que debes</h3>
              </div>
              <SheetClose render={
                <button className="text-muted-foreground hover:text-white transition-colors p-1" aria-label="Cerrar">
                  <X className="size-6" />
                </button>
              } />
            </div>
            
            <div className="flex flex-col gap-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                  <Loader2 className="size-6 animate-spin text-[#bd7aff]" />
                  <p className="text-sm">Cargando deudas…</p>
                </div>
              ) : !data?.debts_to_pay.length ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="size-10 text-success mb-2" />
                  <p className="font-medium text-white">¡Estás al día!</p>
                  <p className="text-xs text-muted-foreground mt-1">No tienes deudas pendientes de pago.</p>
                </div>
              ) : (
                data.debts_to_pay.map((item) => (
                  <button
                    key={item.split_id}
                    onClick={() => navigateToExpenseToPay(item.expense_id)}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/5 transition-colors border border-border text-left w-full cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2d314f] rounded-full flex items-center justify-center text-lg shrink-0">
                        {getCategoryEmoji(item.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white">{item.expense_name}</h4>
                          {item.payment_status === "pending_confirmation" && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <Clock className="size-3" />
                              Por verificar
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.event_name} • Pagado por {item.payer_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#ef4444]">
                        - Bs. {Number(item.amount).toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {step === "owed" && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("select")} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                  <ArrowLeft className="size-5" />
                </button>
                <h3 className="text-2xl font-semibold text-white">Lo que te deben</h3>
              </div>
              <SheetClose render={
                <button className="text-muted-foreground hover:text-white transition-colors p-1" aria-label="Cerrar">
                  <X className="size-6" />
                </button>
              } />
            </div>
            
            <div className="flex flex-col gap-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                  <Loader2 className="size-6 animate-spin text-[#bd7aff]" />
                  <p className="text-sm">Cargando devoluciones…</p>
                </div>
              ) : !data?.debts_to_collect.length ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="size-10 text-success mb-2" />
                  <p className="font-medium text-white">Sin devoluciones pendientes</p>
                  <p className="text-xs text-muted-foreground mt-1">No tienes pagos pendientes por cobrar.</p>
                </div>
              ) : (
                data.debts_to_collect.map((item) => (
                  <button
                    key={item.expense_id}
                    onClick={() => navigateToExpenseGeneral(item.expense_id)}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/5 transition-colors border border-border text-left w-full cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2d314f] rounded-full flex items-center justify-center text-lg shrink-0">
                        {getCategoryEmoji(item.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white">{item.expense_name}</h4>
                          {item.pending_verification_count > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary border border-primary/30">
                              <Clock className="size-3" />
                              {item.pending_verification_count} por verificar
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.event_name} • Faltan {item.unpaid_count} participantes
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#22c55e]">
                        + Bs. {Number(item.total_pending_amount).toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

      </SheetContent>
    </Sheet>
  )
}

