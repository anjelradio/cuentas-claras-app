interface ActivityItem {
  id: string
  type: string
  actorName: string
  targetName?: string | null
  createdAt: string
  description: string
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffSeconds < 60) return "hace un momento"
    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `hace ${diffMinutes}m`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `hace ${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `hace ${diffDays}d`
    return date.toLocaleDateString("es-BO", { day: "numeric", month: "short" })
  } catch {
    return ""
  }
}

export function RecentActivityCard({ activities }: { activities: ActivityItem[] }) {
  return (
    <section className="glass-panel rounded-[24px] p-6 h-fit relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-white">Actividad reciente</h3>
        <span className="text-sm text-[#bd7aff]">Reciente</span>
      </div>
      
      <div className="flex flex-col gap-5 relative">
        {/* Línea vertical decorativa */}
        <div className="absolute left-[3px] top-2 bottom-2 w-[1px] bg-border z-0"></div>

        {!activities || activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No hay actividad reciente.</p>
        ) : (
          activities.map((act) => {
            const isSuccess =
              act.type.includes("paid") ||
              act.type.includes("payment_confirmed") ||
              act.description.includes("confirmó") ||
              act.description.includes("saldó")
            const isWarning =
              act.type.includes("payment_declared") ||
              act.type.includes("rejected") ||
              act.type.includes("deleted")
            
            const dotColorClass = isSuccess 
              ? "bg-[#1ee370] shadow-[0_0_8px_rgba(30,227,112,0.6)]" 
              : isWarning 
                ? "bg-[#ff6b1a] shadow-[0_0_8px_rgba(255,107,26,0.6)]"
                : "bg-[#bd7aff] shadow-[0_0_8px_rgba(189,122,255,0.6)]"

            const timeAgo = formatRelativeTime(act.createdAt)

            return (
              <div key={act.id} className="flex gap-4 relative z-10">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColorClass}`}></div>
                <div>
                  <p className="text-sm font-medium text-white mb-0.5">
                    {act.description || `${act.actorName} realizó una acción`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo} {act.targetName ? `· ${act.targetName}` : ""}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

