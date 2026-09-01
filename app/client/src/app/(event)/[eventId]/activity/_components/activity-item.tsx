import { type LucideIcon, Wallet, Pencil, Plus, Trash2, UserPlus, UserMinus, ShieldAlert, ArrowRightLeft, CalendarCheck, Sparkles, Activity } from "lucide-react"
import { type ActivityLogEntry, type ActivityType } from "../../../_types/activity-types"
import { cn } from "@/lib/utils"

interface ActivityItemProps {
  activity: ActivityLogEntry
}

export const DEFAULT_ACTIVITY_CONFIG = {
  icon: Activity,
  label: "Actividad",
  bgClass: "bg-primary/20",
  textClass: "text-primary",
}

export const TYPE_CONFIG: Record<ActivityType, { icon: LucideIcon; label: string; bgClass: string; textClass: string }> = {
  event_created: { icon: CalendarCheck, label: "Evento creado", bgClass: "bg-primary/20", textClass: "text-primary" },
  event_updated: { icon: Pencil, label: "Evento editado", bgClass: "bg-tertiary/20", textClass: "text-tertiary" },
  event_closed: { icon: ShieldAlert, label: "Evento cerrado", bgClass: "bg-error/20", textClass: "text-error" },
  member_joined: { icon: UserPlus, label: "Miembro unido", bgClass: "bg-success/20", textClass: "text-success" },
  member_left: { icon: UserMinus, label: "Miembro abandonó", bgClass: "bg-muted/20", textClass: "text-muted-foreground" },
  member_removed: { icon: UserMinus, label: "Miembro expulsado", bgClass: "bg-error/20", textClass: "text-error" },
  owner_transferred: { icon: ArrowRightLeft, label: "Organizador transferido", bgClass: "bg-action-orange/20", textClass: "text-action-orange" },
  expense_created: { icon: Plus, label: "Gasto registrado", bgClass: "bg-primary/20", textClass: "text-primary" },
  expense_updated: { icon: Pencil, label: "Gasto editado", bgClass: "bg-tertiary/20", textClass: "text-tertiary" },
  expense_voided: { icon: Trash2, label: "Gasto anulado", bgClass: "bg-error/20", textClass: "text-error" },
  expense_receipt_analyzed: { icon: Sparkles, label: "Comprobante analizado", bgClass: "bg-primary/20", textClass: "text-primary" },
  payment_declared: { icon: Wallet, label: "Pago declarado", bgClass: "bg-action-orange/20", textClass: "text-action-orange" },
  payment_confirmed: { icon: Wallet, label: "Pago verificado", bgClass: "bg-success/20", textClass: "text-success" },
  payment_rejected: { icon: ShieldAlert, label: "Pago rechazado", bgClass: "bg-error/20", textClass: "text-error" },
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const config = TYPE_CONFIG[activity.type] || DEFAULT_ACTIVITY_CONFIG
  const Icon = config.icon

  return (
    <div className="flex items-center gap-4 border-b border-white/5 p-5 transition-colors hover:bg-white/5">
      <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-full text-2xl", config.bgClass, config.textClass)}>
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <div className="flex-grow">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-white">{config.label}</h4>
          <span className="text-xs text-muted-foreground">{activity.createdAt}</span>
        </div>
        {activity.description && (
          <p className="text-sm text-muted-foreground">{activity.description}</p>
        )}
        <p className="mt-1 text-xs text-[#bd7aff]">Realizado por: {activity.actorName}</p>
      </div>
    </div>
  )
}
