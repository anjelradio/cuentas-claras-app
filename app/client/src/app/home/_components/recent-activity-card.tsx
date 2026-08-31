import type { RecentActivity } from "./home-mock-data"

export function RecentActivityCard({ activities }: { activities: RecentActivity[] }) {
  return (
    <section className="glass-panel rounded-[24px] p-6 h-fit relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-white">Actividad reciente</h3>
        <span className="text-sm text-[#bd7aff]">Reciente</span>
      </div>
      
      <div className="flex flex-col gap-5 relative">
        {/* Línea vertical decorativa */}
        <div className="absolute left-[3px] top-2 bottom-2 w-[1px] bg-border z-0"></div>

        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No hay actividad.</p>
        ) : (
          activities.map((act, i) => {
            // Asignar colores aleatorios o según tipo de acción para el dot
            const isSuccess = act.action.includes("saldó") || act.action.includes("pagó")
            const isWarning = act.action.includes("unió") || act.action.includes("eliminó")
            
            const dotColorClass = isSuccess 
              ? "bg-[#1ee370] shadow-[0_0_8px_rgba(30,227,112,0.6)]" 
              : isWarning 
                ? "bg-[#ff6b1a] shadow-[0_0_8px_rgba(255,107,26,0.6)]"
                : "bg-[#bd7aff] shadow-[0_0_8px_rgba(189,122,255,0.6)]"

            return (
              <div key={act.id} className="flex gap-4 relative z-10">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColorClass}`}></div>
                <div>
                  <p className="text-sm font-medium text-white mb-0.5">
                    {act.actor} {act.action} {act.amount && `por Bs. ${act.amount}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{act.timeAgo} · {act.eventOrTarget}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
