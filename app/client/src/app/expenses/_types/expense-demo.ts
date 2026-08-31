import type { LucideIcon } from "lucide-react"
import { Car, Hotel, ShoppingBasket, Utensils, Ticket, Package } from "lucide-react"

/** Datos de presentación compartidos por las rutas estáticas de gastos. */
export type ExpenseCategory = "food" | "lodging" | "transport" | "shopping" | "entertainment" | "other"
export type ExpenseFilter = "mine" | "others" | "all"
export type PaymentStatus = "paid" | "pending" | "unpaid"

export interface ExpenseCategoryDemo {
  id: ExpenseCategory
  label: string
  emoji: string
  icon: LucideIcon
  accentClassName: string
}

export interface ExpenseParticipantDemo {
  id: string
  name: string
  initials: string
  share: string
  paymentStatus: PaymentStatus
  isCurrentUser?: boolean
}

export interface ExpenseDemo {
  id: string
  eventId: string
  name: string
  category: ExpenseCategory
  description?: string
  amount: string
  date: string
  dateInput: string
  payer: string
  payerInitials: string
  receiptLabel?: string
  receiptImageUrl?: string
  status: PaymentStatus
  participants: ExpenseParticipantDemo[]
}

export const EXPENSE_CATEGORIES: ExpenseCategoryDemo[] = [
  { id: "food", label: "Comida", emoji: "🍴", icon: Utensils, accentClassName: "bg-action-orange/15 text-action-orange" },
  { id: "lodging", label: "Hospedaje", emoji: "🏨", icon: Hotel, accentClassName: "bg-secondary/15 text-secondary" },
  { id: "transport", label: "Transporte", emoji: "🚗", icon: Car, accentClassName: "bg-tertiary/15 text-tertiary" },
  { id: "shopping", label: "Compras", emoji: "🛒", icon: ShoppingBasket, accentClassName: "bg-success/15 text-success" },
  { id: "entertainment", label: "Entretenimiento", emoji: "🎟️", icon: Ticket, accentClassName: "bg-primary/15 text-primary" },
  { id: "other", label: "Otra", emoji: "📦", icon: Package, accentClassName: "bg-muted-foreground/15 text-muted-foreground" },
]

export const EXPENSE_PARTICIPANTS: ExpenseParticipantDemo[] = [
  { id: "ana", name: "Ana López", initials: "AL", share: "Bs. 90.00", paymentStatus: "pending", isCurrentUser: true },
  { id: "diego", name: "Diego Rojas", initials: "DR", share: "Bs. 90.00", paymentStatus: "pending" },
  { id: "sofia", name: "Sofía Cruz", initials: "SC", share: "Bs. 90.00", paymentStatus: "paid" },
  { id: "mateo", name: "Mateo Pérez", initials: "MP", share: "Bs. 90.00", paymentStatus: "unpaid" },
  { id: "lucia", name: "Lucía Fernández", initials: "LF", share: "Bs. 90.00", paymentStatus: "unpaid" },
  { id: "carlos", name: "Carlos Méndez", initials: "CM", share: "Bs. 90.00", paymentStatus: "pending" },
  { id: "elena", name: "Elena Vargas", initials: "EV", share: "Bs. 90.00", paymentStatus: "unpaid" },
  { id: "beto", name: "Beto Rojas", initials: "BR", share: "Bs. 90.00", paymentStatus: "pending" },
  { id: "carla", name: "Carla Martínez", initials: "CM", share: "Bs. 90.00", paymentStatus: "paid" },
  { id: "jose", name: "José Ramírez", initials: "JR", share: "Bs. 90.00", paymentStatus: "unpaid" },
]

export const EXPENSES_DEMO: ExpenseDemo[] = [
  {
    id: "cena-puerto",
    eventId: "demo-event",
    name: "Cena en el puerto",
    category: "food",
    description: "Cena compartida después de llegar al evento.",
    amount: "Bs. 360.00",
    date: "18 de agosto de 2026",
    dateInput: "2026-08-18",
    payer: "Ana López",
    payerInitials: "AL",
    receiptLabel: "Factura de la cena",
    receiptImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBYgMMO40kYevxuzA0odbJxGOW85WsUNW8SUJrayqJwXzXE-m5SKy17mNlQ4PQM72plwUhUULNnSYRaRVsA3QakO0xO3-cVWBvVO8ANpPosksBZ3ZQzMDBCfawgV0hWo3AkRauB0lYk-zV48lxLoD9g9bKAvYJTlTBa-zuA-SAsA3dkcNY7T22Cr36frQh2ZD7NY9TeGl7A1EkTxcQ0bS-kXKYVkwKoD9dio5qVR8aWBsZnq5bs6f0lWQ",
    status: "pending",
    participants: EXPENSE_PARTICIPANTS,
  },
  {
    id: "cabaña-samaitapa",
    eventId: "demo-event",
    name: "Cabaña Samaipata",
    category: "lodging",
    description: "Hospedaje para el fin de semana.",
    amount: "Bs. 1,200.00",
    date: "17 de agosto de 2026",
    dateInput: "2026-08-17",
    payer: "Diego Rojas",
    payerInitials: "DR",
    status: "paid",
    participants: EXPENSE_PARTICIPANTS.map((participant) => ({ ...participant, paymentStatus: "paid" })),
  },
  {
    id: "combustible-viaje",
    eventId: "demo-event",
    name: "Combustible del viaje",
    category: "transport",
    description: "Traslado de ida al evento.",
    amount: "Bs. 280.00",
    date: "16 de agosto de 2026",
    dateInput: "2026-08-16",
    payer: "Sofía Cruz",
    payerInitials: "SC",
    status: "pending",
    participants: EXPENSE_PARTICIPANTS,
  },
  {
    id: "snacks-grupo",
    eventId: "demo-event",
    name: "Snacks para el grupo",
    category: "shopping",
    description: "Compras para compartir durante el viaje.",
    amount: "Bs. 145.00",
    date: "16 de agosto de 2026",
    dateInput: "2026-08-16",
    payer: "Mateo Pérez",
    payerInitials: "MP",
    status: "paid",
    participants: EXPENSE_PARTICIPANTS.map((participant) => ({ ...participant, paymentStatus: "paid" })),
  },
]

export function getExpenseCategory(category: ExpenseCategory) {
  return EXPENSE_CATEGORIES.find((item) => item.id === category) ?? EXPENSE_CATEGORIES[0]
}

export function getExpenseById(expenseId: string) {
  return EXPENSES_DEMO.find((expense) => expense.id === expenseId)
}

/** Devuelve la vista demo para cualquier slug hasta conectar el backend. */
export function getExpenseForDisplay(expenseId: string) {
  const expense = getExpenseById(expenseId)
  return { ...(expense ?? EXPENSES_DEMO[0]), id: expenseId, receiptImageUrl: expense?.receiptImageUrl ?? EXPENSES_DEMO[0].receiptImageUrl }
}

/**
 * Mientras Expenses sea una interfaz estática, la colección demo se muestra en
 * cualquier evento para que las rutas reales del usuario nunca queden vacías.
 */
export function getExpensesByFilter(_eventId: string, filter: ExpenseFilter) {
  const expenses = EXPENSES_DEMO

  if (filter === "all") return expenses
  if (filter === "mine") return expenses.filter((expense) => expense.payer === "Ana López")
  return expenses.filter((expense) => expense.payer !== "Ana López")
}
