import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ActivityLogEntry } from "../../_types/activity-types"
import { TYPE_CONFIG } from "../activity/_components/activity-item"
import { cn } from "@/lib/utils"

interface RecentActivitiesCardProps {
  eventId: string
  activities: ActivityLogEntry[]
}

/**
 * Presenta la actividad reciente con texto e iconos para complementar el color.
 */
export function RecentActivitiesCard({ eventId, activities }: RecentActivitiesCardProps) {
  return (
    <Card className="glass-panel rounded-[24px] border-border/60 bg-surface/80 py-0 text-body shadow-none">
      <CardHeader className="flex-row items-center justify-between p-6">
        <CardTitle className="text-lg text-headline">Actividad reciente</CardTitle>
        <Link href={`/${eventId}/activity`} className="flex items-center gap-1 text-sm text-tertiary hover:text-primary transition-colors">
          Ver todo <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {activities.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-body/70">
            Todavía no hay actividad para mostrar.
          </p>
        ) : (
          <ul className="grid gap-4" aria-label="Actividad reciente del evento">
            {activities.map((activity) => {
              const config = TYPE_CONFIG[activity.type]
              const Icon = config.icon
              return (
                <li key={activity.id} className="-mx-2 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/5">
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", config.bgClass, config.textClass)}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-headline">{activity.description || config.label}</p>
                    <p className="text-xs text-muted-foreground">{activity.createdAt}</p>
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
