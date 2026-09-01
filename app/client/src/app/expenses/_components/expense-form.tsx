"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Upload, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { EXPENSE_CATEGORIES } from "@/app/expenses/_types/expense"
import type { ExpenseCategory, ExpenseDetail, ExpenseSplitType } from "@/app/expenses/_types/expense"
import { ExpenseApi } from "../_services/expense-api"
import { ExpenseParticipantsSheet, type EventMemberOption } from "./expense-participants-sheet"

interface ExpenseFormProps {
  eventId: string
  mode: "create" | "edit"
  expense?: ExpenseDetail
  members?: EventMemberOption[]
}

/** Formulario funcional de registro y edición de gastos con soporte atómico para comprobantes. */
export function ExpenseForm({ eventId, mode, expense, members = [] }: ExpenseFormProps) {
  const router = useRouter()
  const isEditing = mode === "edit"

  const [name, setName] = React.useState(expense?.name ?? "")
  const [description, setDescription] = React.useState(expense?.description ?? "")
  const [amount, setAmount] = React.useState(
    expense ? String(expense.amount).replace(/[^0-9.]/g, "") : ""
  )
  const [category, setCategory] = React.useState<ExpenseCategory>(
    expense?.category ?? "food"
  )
  const [splitType, setSplitType] = React.useState<ExpenseSplitType>(
    expense?.split_type ?? "equal"
  )
  const [paidByMemberId, setPaidByMemberId] = React.useState<string>(
    () => expense?.paid_by_member_id ?? (members[0]?.id || "")
  )
  const [expenseDate, setExpenseDate] = React.useState<string>(
    expense?.expense_date ? new Date(expense.expense_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  )

  const [receiptFile, setReceiptFile] = React.useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = React.useState<string | null>(
    expense?.receipt_url ?? null
  )

  const [selectedMemberIds, setSelectedMemberIds] = React.useState<Set<string>>(() => {
    if (expense?.splits && expense.splits.length > 0) {
      return new Set(expense.splits.map((s) => s.member_id))
    }
    return new Set(members.map((m) => m.id))
  })

  const [exactAmounts, setExactAmounts] = React.useState<Record<string, string>>(() => {
    if (expense?.splits) {
      const map: Record<string, string> = {}
      for (const s of expense.splits) {
        map[s.member_id] = String(s.assigned_amount)
      }
      return map
    }
    return {}
  })

  const [invalidFields, setInvalidFields] = React.useState<Set<string>>(new Set())
  const [isParticipantsOpen, setIsParticipantsOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El comprobante no debe superar los 5 MB.")
      return
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast.error("Solo se aceptan imágenes JPEG, PNG y WebP.")
      return
    }

    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
  }

  function handleExactAmountChange(memberId: string, val: string) {
    setExactAmounts((prev) => ({ ...prev, [memberId]: val }))
  }

  function openParticipantsSelector(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const invalid = new Set<string>()
    if (!name.trim()) invalid.add("name")
    if (!amount.trim() || Number.parseFloat(amount) <= 0) invalid.add("amount")
    if (!paidByMemberId) invalid.add("paidByMemberId")

    setInvalidFields(invalid)
    if (invalid.size > 0) {
      toast.error("Completa el nombre, monto válido y pagador del gasto.")
      return
    }

    setIsParticipantsOpen(true)
  }

  async function handleFinalSubmit() {
    setIsSubmitting(true)
    try {
      const parsedAmount = Number.parseFloat(amount).toFixed(2)
      const parsedDate = new Date(`${expenseDate}T12:00:00Z`).toISOString()

      if (splitType === "exact") {
        const splitsPayload = Array.from(selectedMemberIds).map((memberId) => ({
          member_id: memberId,
          assigned_amount: (Number.parseFloat(exactAmounts[memberId] || "0")).toFixed(2),
        }))

        const sumSplits = splitsPayload.reduce((acc, s) => acc + Number.parseFloat(s.assigned_amount), 0)
        if (Math.abs(sumSplits - Number.parseFloat(parsedAmount)) > 0.009) {
          toast.error(
            `La suma de las cuotas (Bs. ${sumSplits.toFixed(2)}) no coincide con el total (Bs. ${parsedAmount}).`
          )
          setIsSubmitting(false)
          return
        }

        if (isEditing && expense) {
          await ExpenseApi.updateExpense(
            expense.id,
            {
              name: name.trim(),
              description: description.trim() || null,
              amount: parsedAmount,
              category,
              split_type: "exact",
              paid_by_member_id: paidByMemberId,
              expense_date: parsedDate,
              splits: splitsPayload,
            },
            receiptFile
          )
          toast.success("Gasto actualizado exitosamente.")
          router.push(`/expenses/${expense.id}`)
        } else {
          await ExpenseApi.createExpense(
            eventId,
            {
              name: name.trim(),
              description: description.trim() || null,
              amount: parsedAmount,
              category,
              split_type: "exact",
              paid_by_member_id: paidByMemberId,
              expense_date: parsedDate,
              splits: splitsPayload,
            },
            receiptFile
          )
          toast.success("Gasto registrado exitosamente.")
          router.push(`/expenses/event/${eventId}`)
        }
      } else {
        const participantIds = Array.from(selectedMemberIds)
        if (participantIds.length === 0) {
          toast.error("Debe seleccionar al menos un participante para la división equitativa.")
          setIsSubmitting(false)
          return
        }

        if (isEditing && expense) {
          await ExpenseApi.updateExpense(
            expense.id,
            {
              name: name.trim(),
              description: description.trim() || null,
              amount: parsedAmount,
              category,
              split_type: "equal",
              paid_by_member_id: paidByMemberId,
              expense_date: parsedDate,
              participant_member_ids: participantIds,
            },
            receiptFile
          )
          toast.success("Gasto actualizado exitosamente.")
          router.push(`/expenses/${expense.id}`)
        } else {
          await ExpenseApi.createExpense(
            eventId,
            {
              name: name.trim(),
              description: description.trim() || null,
              amount: parsedAmount,
              category,
              split_type: "equal",
              paid_by_member_id: paidByMemberId,
              expense_date: parsedDate,
              participant_member_ids: participantIds,
            },
            receiptFile
          )
          toast.success("Gasto registrado exitosamente.")
          router.push(`/expenses/event/${eventId}`)
        }
      }

      setIsParticipantsOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar el gasto."
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full rounded-[24px] border border-white/5 bg-[#151a30]/50 p-6 text-white shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">{isEditing ? "Editar gasto" : "Registrar gasto"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isEditing ? "Actualiza los detalles de este gasto" : "Introduce los detalles de tu gasto"}
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={openParticipantsSelector} noValidate>
          {/* Selector de categoría */}
          <div className="flex flex-col items-center gap-4">
            <div className="grid w-full max-w-[380px] grid-cols-3 gap-3">
              {EXPENSE_CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Categoría ${item.label}`}
                  aria-pressed={category === item.id}
                  onClick={() => setCategory(item.id as ExpenseCategory)}
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

          {/* Nombre */}
          <Input
            id="expense-name"
            aria-label="Nombre del gasto"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setInvalidFields((current) => {
                const next = new Set(current)
                next.delete("name")
                return next
              })
            }}
            placeholder="Nombre del gasto"
            aria-invalid={invalidFields.has("name")}
            className="h-auto w-full rounded-xl border border-border bg-[#151a30]/80 px-4 py-4 text-center text-lg text-white placeholder:text-muted-foreground/60 transition-all focus:border-[#3d3bff]/50 focus:ring-2 focus:ring-[#3d3bff]/50 aria-invalid:border-destructive"
          />

          {/* Descripción */}
          <textarea
            id="expense-description"
            aria-label="Descripción del gasto"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descripción opcional"
            className="min-h-16 w-full resize-none rounded-xl border border-border bg-[#151a30]/80 px-4 py-3 text-center text-sm text-white placeholder:text-muted-foreground/60 outline-none transition-all focus:border-[#3d3bff]/50 focus:ring-2 focus:ring-[#3d3bff]/50"
          />

          {/* Monto */}
          <Input
            id="expense-amount"
            type="number"
            inputMode="decimal"
            aria-label="Monto del gasto"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value)
              setInvalidFields((current) => {
                const next = new Set(current)
                next.delete("amount")
                return next
              })
            }}
            placeholder="Monto total (Bs.)"
            aria-invalid={invalidFields.has("amount")}
            className="h-auto w-full rounded-xl border border-border bg-[#151a30]/80 px-4 py-4 text-center text-lg text-white placeholder:text-muted-foreground/60 transition-all focus:border-[#3d3bff]/50 focus:ring-2 focus:ring-[#3d3bff]/50 aria-invalid:border-destructive"
          />

          {/* Pagador */}
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="expense-payer" className="text-xs text-muted-foreground font-medium">
              Pagado por
            </label>
            <select
              id="expense-payer"
              value={paidByMemberId}
              onChange={(e) => setPaidByMemberId(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-[#151a30]/80 px-4 text-sm text-white outline-none focus:border-[#3d3bff]/50 focus:ring-2 focus:ring-[#3d3bff]/50"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#181b27] text-white">
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="expense-date" className="text-xs text-muted-foreground font-medium">
              Fecha del gasto
            </label>
            <Input
              id="expense-date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-[#151a30]/80 px-4 text-sm text-white"
            />
          </div>

          {/* Comprobante opcional */}
          <div className="flex flex-col gap-2 text-left">
            <label className="text-xs text-muted-foreground font-medium">
              Comprobante digital (opcional, máx 5 MB)
            </label>
            {receiptPreview ? (
              <div className="relative flex items-center justify-between rounded-xl border border-border bg-[#151a30]/80 p-3">
                <span className="truncate text-xs text-white">
                  {receiptFile ? receiptFile.name : "Comprobante adjunto"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null)
                    setReceiptPreview(null)
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-[#151a30]/40 p-4 text-xs text-muted-foreground transition hover:bg-white/5 hover:text-white">
                <Upload className="size-4" />
                <span>Adjuntar imagen (JPEG, PNG, WebP)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          {/* Botones de acción */}
          <div className="mt-2 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => router.back()}
              className="order-2 h-12 w-full rounded-xl sm:order-1 sm:w-1/3"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="order-1 h-12 w-full rounded-xl bg-action-orange text-action-orange-foreground shadow-lg shadow-action-orange/30 hover:-translate-y-0.5 hover:bg-action-orange/90 sm:order-2 sm:w-2/3"
            >
              {isEditing ? "Guardar cambios" : "Registrar gasto"}
            </Button>
          </div>
        </form>
      </div>

      <ExpenseParticipantsSheet
        open={isParticipantsOpen}
        onOpenChange={setIsParticipantsOpen}
        members={members}
        splitType={splitType}
        onSplitTypeChange={setSplitType}
        selectedMemberIds={selectedMemberIds}
        onSelectedMemberIdsChange={setSelectedMemberIds}
        exactAmounts={exactAmounts}
        onExactAmountChange={handleExactAmountChange}
        totalAmount={amount}
        onConfirm={handleFinalSubmit}
      />
    </div>
  )
}
