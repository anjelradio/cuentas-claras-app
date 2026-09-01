import { ArrowRight } from "lucide-react"
import Link from "next/link"

import type { RecentEvent } from "../../expenses/_types/expense"

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
        {!events || events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No tienes eventos recientes.</p>
        ) : (
          events.map((event) => (
            <Link
              key={event.id}
              href={`/${event.id}`}
              className="flex items-center justify-between p-3 -mx-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border-b border-border last:border-0 pb-4 mb-1"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#2d314f] rounded-full flex items-center justify-center text-xl overflow-hidden border border-border shrink-0">
                  {event.icon || "📅"}
                </div>
                <div>
                  <h4 className="font-medium text-white mb-0.5">{event.name}</h4>
                  <p className="text-xs text-muted-foreground">{event.member_count} miembros · {event.expense_count} gastos</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-white text-sm">
                  Gastaste
                </p>
                <p className="text-sm font-semibold text-primary">
                  Bs. {Number(event.personal_spent_amount).toFixed(2)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  )
}

