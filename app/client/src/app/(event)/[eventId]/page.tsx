import { EventActionsSection } from "./_components/event-actions-section"
import { EventStatisticsCard } from "./_components/event-statistics-card"
import { RecentActivitiesCard } from "./_components/recent-activities-card"
import { RecentExpensesCard } from "./_components/recent-expenses-card"
import { getCachedEventDetail, getCachedMyQr } from "../_services/server-event-api"
import { listEventActivities } from "../_services/activity"
import { getCachedEventExpenses } from "@/app/expenses/_services/server-expense-api"
import { formatEventDate } from "../_lib/format-event-date"
import { STATISTICS_DEMO } from "../_demo/event-home-demo"

interface EventHomePageProps {
  params: Promise<{ eventId: string }>
}

export default async function EventHomePage({ params }: EventHomePageProps) {
  const { eventId } = await params
  
  const [event, qrImage, activitiesData, expensesData] = await Promise.all([
    getCachedEventDetail(eventId), 
    getCachedMyQr(eventId),
    listEventActivities(eventId, 3, 0).catch(() => ({ items: [] })),
    getCachedEventExpenses(eventId, "all").catch(() => []),
  ])

  // Transform EventDetail into EventView for the components
  const eventView = {
    id: event.id,
    name: event.name,
    description: event.description || "",
    dateLabel: `Del ${formatEventDate(event.starts_at)} al ${formatEventDate(event.ends_at)}`,
    icon: event.icon || "📅",
    status: event.status,
  }
  
  const recentActivities = activitiesData.items
  const recentExpenses = expensesData.slice(0, 3).map((expense) => ({
    id: expense.id,
    description: expense.description ?? expense.name,
    amount: Number(expense.amount),
    date: expense.expense_date,
    category: expense.category,
    title: expense.name,
    payer: expense.paid_by_member_name,
    amountLabel: `Bs. ${Number(expense.amount).toFixed(2)}`,
    dateLabel: new Date(expense.expense_date).toLocaleDateString("es-BO", {
      day: "numeric",
      month: "short",
    }),
  }))

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-8 lg:col-span-7">
        <section className="mb-2 flex flex-col items-center text-center">
          <span className="mb-4 text-6xl leading-none" aria-hidden="true">{eventView.icon}</span>
          <h1 className="mb-2 text-4xl font-semibold text-headline">{eventView.name}</h1>
          <p className="mb-2 text-muted-foreground">{eventView.description}</p>
          <div className="mt-1 flex flex-col items-center gap-1 text-sm text-muted-foreground">
            <span>Inicia el {formatEventDate(event.starts_at)}</span>
            <span>Termina el {formatEventDate(event.ends_at)}</span>
          </div>
        </section>

        <EventActionsSection
          event={eventView}
          isOwner={event.is_owner}
          invitations={[
            { id: "generate-code", type: "code", name: "Código", label: "Generar código", description: "Crea un código único de acceso" },
            { id: "generate-qr", type: "qr", name: "QR", label: "Generar QR", description: "Código escaneable para unirse rápido" },
            { id: "generate-link", type: "link", name: "Link", label: "Generar link de invitación", description: "Enlace directo para compartir" }
          ]}
          debts={[]}
          qrImage={qrImage}
        />
        <EventStatisticsCard statistics={STATISTICS_DEMO} />
      </div>

      <aside className="flex flex-col gap-6 lg:col-span-5">
        <RecentExpensesCard eventId={event.id} expenses={recentExpenses} />
        <RecentActivitiesCard eventId={event.id} activities={recentActivities} />
      </aside>
    </div>
  )
}
