import { ActivityList } from "./_components/activity-list"
import { listEventActivities } from "../../_services/activity"

import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface ActivityPageProps {
  params: Promise<{ eventId: string }>
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { eventId } = await params

  // Fetch initial data on the server
  let initialActivities: any[] = []
  let initialHasMore = false
  
  try {
    const data = await listEventActivities(eventId, 20, 0)
    initialActivities = data.items
    initialHasMore = data.has_more
  } catch (error: any) {
    if (error.status === 404 || error.status === 422) {
      notFound()
    }
    console.error("Failed to load initial activities", error)
  }

  return (
    <div className="mx-auto w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex flex-col items-start gap-4">
        <Link 
          href={`/${eventId}`} 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-headline transition-colors"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-headline">Bitácora de actividades</h1>
          <p className="text-sm text-muted-foreground">Historial de cambios y movimientos en el evento.</p>
        </div>
      </div>
      
      <ActivityList 
        eventId={eventId}
        initialActivities={initialActivities} 
        initialHasMore={initialHasMore}
      />
    </div>
  )
}
