"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { EXPENSE_CATEGORIES, type ExpenseDemo } from "@/app/expenses/_types/expense-demo"
import { ExpenseParticipantsSheet } from "./expense-participants-sheet"

interface ExpenseFormProps {
  eventId: string
  mode: "create" | "edit"
  expense?: ExpenseDemo
}

/** Formulario compartido de gastos con la misma composición visual de Event Form. */
export function ExpenseForm({ mode, expense }: ExpenseFormProps) {
  const router = useRouter()
  const isEditing = mode === "edit"
  const [name, setName] = React.useState(expense?.name ?? "")
  const [description, setDescription] = React.useState(expense?.description ?? "")
  const [amount, setAmount] = React.useState(expense?.amount.replace(/[^0-9.]/g, "") ?? "")
  const [category, setCategory] = React.useState(expense?.category ?? "food")
  const [invalidFields, setInvalidFields] = React.useState<Set<"name" | "amount">>(new Set())
  const [isParticipantsOpen, setIsParticipantsOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const invalid = new Set<"name" | "amount">()
    if (!name.trim()) invalid.add("name")
    if (!amount.trim()) invalid.add("amount")
    setInvalidFields(invalid)
    if (invalid.size) {
      toast.error("Completa el nombre y el monto del gasto.")
      return
    }
    setIsParticipantsOpen(true)
  }

  function confirmParticipants() {
    setIsSubmitting(true)
    window.setTimeout(() => {
      setIsSubmitting(false)
      setIsParticipantsOpen(false)
      toast.success(isEditing ? "Los cambios se revisaron. La edición real llegará próximamente." : "El gasto se revisó. El registro real llegará próximamente.")
    }, 350)
  }

  return (
    <div className="mx-auto flex w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full rounded-[24px] border border-white/5 bg-[#151a30]/50 p-6 text-white shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">{isEditing ? "Editar gasto" : "Registrar gasto"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{isEditing ? "Actualiza los detalles de este gasto" : "Introduce los detalles de tu gasto"}</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={submitForm} noValidate>
          <div className="flex flex-col items-center gap-4">
            <div className="grid w-full max-w-[380px] grid-cols-3 gap-3">
              {EXPENSE_CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Categoría ${item.label}`}
                  aria-pressed={category === item.id}
                  onClick={() => setCategory(item.id)}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl border transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d3bff]/50",
                    category === item.id ? "border-white bg-white/20" : "border-border bg-[#151a30]/80 hover:bg-white/10",
                  )}
                >
                  <span aria-hidden="true" className="text-3xl leading-none">{item.emoji}</span>
                  <span className={cn("text-[10px] font-medium leading-tight sm:text-xs", category === item.id ? "text-white" : "text-muted-foreground")}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Input
            id="expense-name"
            aria-label="Nombre del gasto"
            value={name}
            onChange={(event) => { setName(event.target.value); setInvalidFields((current) => { const next = new Set(current); next.delete("name"); return next }) }}
            placeholder="Nombre del gasto"
            aria-invalid={invalidFields.has("name")}
            className="h-auto w-full rounded-xl border border-border bg-[#151a30]/80 px-4 py-5 text-center text-lg text-white placeholder:text-muted-foreground/60 transition-all focus:border-[#3d3bff]/50 focus:ring-2 focus:ring-[#3d3bff]/50 aria-invalid:border-destructive"
          />

          <textarea
            id="expense-description"
            aria-label="Descripción del gasto"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descripción opcional"
            className="min-h-20 w-full resize-none rounded-xl border border-border bg-[#151a30]/80 px-4 py-4 text-center text-base text-white placeholder:text-muted-foreground/60 outline-none transition-all focus:border-[#3d3bff]/50 focus:ring-2 focus:ring-[#3d3bff]/50"
          />

          <Input
            id="expense-amount"
            type="number"
            inputMode="decimal"
            aria-label="Monto del gasto"
            value={amount}
            onChange={(event) => { setAmount(event.target.value); setInvalidFields((current) => { const next = new Set(current); next.delete("amount"); return next }) }}
            placeholder="Monto del gasto"
            aria-invalid={invalidFields.has("amount")}
            className="h-auto w-full rounded-xl border border-border bg-[#151a30]/80 px-4 py-5 text-center text-lg text-white placeholder:text-muted-foreground/60 transition-all focus:border-[#3d3bff]/50 focus:ring-2 focus:ring-[#3d3bff]/50 aria-invalid:border-destructive"
          />

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => router.back()} className="order-2 h-12 w-full rounded-xl sm:order-1 sm:w-1/3">Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="order-1 h-12 w-full rounded-xl bg-action-orange text-action-orange-foreground shadow-lg shadow-action-orange/30 hover:-translate-y-0.5 hover:bg-action-orange/90 sm:order-2 sm:w-2/3">{isEditing ? "Guardar cambios" : "Registrar gasto"}</Button>
          </div>
        </form>
      </div>
      <ExpenseParticipantsSheet open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen} onConfirm={confirmParticipants} />
    </div>
  )
}
