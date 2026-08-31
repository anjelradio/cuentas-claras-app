import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { RecentEvent } from "./home-mock-data"

interface RecentEventsCardProps {
  events: RecentEvent[]
}

export function RecentEventsCard({ events }: RecentEventsCardProps) {
  return (
    <section className="glass-panel rounded-[24px] p-6 h-fit">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-white">Eventos recientes</h3>
        <Link href="/my-events" className="text-sm text-[#bd7aff] hover:text-[#ddb7ff] flex items-center gap-1 transition-colors">
          Ver todos <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {events.map((event) => (
          <div 
            key={event.id}
            className="flex items-center justify-between p-3 -mx-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border-b border-border last:border-0 pb-4 mb-1"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2d314f] rounded-full flex items-center justify-center text-xl overflow-hidden border border-border shrink-0">
                {event.emoji}
              </div>
              <div>
                <h4 className="font-medium text-white mb-0.5">{event.name}</h4>
                <p className="text-xs text-muted-foreground">{event.participants} miembros · {event.expenseCount} gastos</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-medium ${event.amountType === "positive" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                {event.amountType === "positive" ? "+" : "-"} Bs. {event.amount.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">{event.date}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
