import type { EventStatistics, ActivityItem } from "../_types/event-home-types"
import { Utensils, Hotel, Car, ShoppingBasket } from "lucide-react"

export const STATISTICS_DEMO: EventStatistics = {
  currency: "Bs.",
  totalAmount: 4800,
  categories: [
    { name: "Comida", icon: Utensils, amount: 1920, percentage: 40, tone: "warning" },
    { name: "Transporte", icon: Car, amount: 1200, percentage: 25, tone: "tertiary" },
    { name: "Hospedaje", icon: Hotel, amount: 960, percentage: 20, tone: "primary" },
    { name: "Compras", icon: ShoppingBasket, amount: 720, percentage: 15, tone: "success" },
  ],
}

export const ACTIVITIES_DEMO: ActivityItem[] = [
  {
    id: "act-1",
    title: "José ya pagó su deuda",
    description: "José completó su pago.",
    status: "success",
    date: new Date().toISOString(),
    dateLabel: "Hace 5 min",
  },
  {
    id: "act-2",
    title: 'Lucía editó el gasto "Cena"',
    description: "Se actualizó el monto de la cena.",
    status: "info",
    date: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    dateLabel: "Hace 12 min",
  }
]
