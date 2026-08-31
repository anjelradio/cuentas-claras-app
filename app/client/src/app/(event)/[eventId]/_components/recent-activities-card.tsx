import { AlertCircle, ArrowRight, CheckCircle2, Info } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ActivityItem } from "../../_types/event-home-types"

interface RecentActivitiesCardProps {
  activities: ActivityItem[]
}

const statusIcon = {
  success: CheckCircle2,
  info: Info,
  warning: AlertCircle,
} as const

const statusColor = {
  success: "text-success bg-success/15",
  info: "text-info bg-info/15",
  warning: "text-warning bg-warning/15",
} as const

/**
 * Presenta la actividad reciente con texto e iconos para complementar el color.
 */
export function RecentActivitiesCard({ activities }: RecentActivitiesCardProps) {
  return (
    <Card className="glass-panel rounded-[24px] border-border/60 bg-surface/80 py-0 text-body shadow-none">
      <CardHeader className="flex-row items-center justify-between p-6">
        <CardTitle className="text-lg text-headline">Actividad reciente</CardTitle>
        <span className="flex items-center gap-1 text-sm text-tertiary">Ver todo <ArrowRight className="size-4" aria-hidden="true" /></span>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {activities.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-body/70">
            Todavía no hay actividad para mostrar.
          </p>
        ) : (
          <ul className="grid gap-4" aria-label="Actividad reciente del evento">
            {activities.map((activity) => {
              const Icon = statusIcon[activity.status]
              return (
                <li key={activity.id} className="flex items-start gap-3">
                  <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${statusColor[activity.status]}`}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-body">
                      <span className="font-semibold text-headline">{activity.actor}</span>{" "}
                      {activity.actionLabel}
                    </p>
                    <p className="mt-0.5 text-xs text-body/60">{activity.dateLabel}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
