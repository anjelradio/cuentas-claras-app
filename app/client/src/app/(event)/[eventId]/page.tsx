import { notFound } from "next/navigation"
import { EventActionsSection } from "./_components/event-actions-section"
import { EventStatisticsCard } from "./_components/event-statistics-card"
import { RecentActivitiesCard } from "./_components/recent-activities-card"
import { RecentExpensesCard } from "./_components/recent-expenses-card"
import { getCachedEventDetail } from "../_services/server-event-api"

interface EventHomePageProps {
  params: Promise<{ eventId: string }>
}

export default async function EventHomePage({ params }: EventHomePageProps) {
  const { eventId } = await params
  
  const event = await getCachedEventDetail(eventId)

  // Transform EventDetail into EventView for the components
  const eventView = {
    id: event.id,
    name: event.name,
    description: event.description || "",
    dateLabel: `Inicio: ${new Date(event.starts_at).toLocaleDateString()}`,
    icon: event.icon || "📅"
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-8 lg:col-span-7">
        <section className="mb-2 flex flex-col items-center text-center">
          <span className="mb-4 text-6xl leading-none" aria-hidden="true">{eventView.icon}</span>
          <h1 className="mb-2 text-4xl font-semibold text-headline">{eventView.name}</h1>
          <p className="mb-2 text-muted-foreground">{eventView.description}</p>
          <p className="text-sm text-muted-foreground">{eventView.dateLabel}</p>
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
        />
        <EventStatisticsCard statistics={{ categories: [], totalAmount: 0 }} />
      </div>

      <aside className="flex flex-col gap-6 lg:col-span-5">
        <RecentExpensesCard expenses={[]} />
        <RecentActivitiesCard activities={[]} />
      </aside>
    </div>
  )
}
