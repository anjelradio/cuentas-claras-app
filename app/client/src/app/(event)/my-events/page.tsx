import Link from "next/link"
import { Plus, ChevronRight } from "lucide-react"
import { getCachedUserEvents } from "../_services/server-event-api"

export default async function MyEventsPage() {
  const events = await getCachedUserEvents()

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold text-white">Mis Eventos</h2>
        <Link 
          href="/create-event"
          className="inline-flex items-center justify-center bg-[#3d3bff] hover:bg-[#3d3bff]/90 text-white border-none rounded-lg px-4 py-2 text-sm font-medium transition-all shadow-[0_4px_12px_rgba(61,59,255,0.3)]"
        >
          <Plus className="size-4 mr-2" />
          Nuevo Evento
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-[#181b27] rounded-xl border border-white/10">
          No tienes ningún evento todavía. ¡Crea uno para empezar!
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <Link key={event.id} href={`/${event.id}`} className="block group">
              <div className="bg-[#181b27] border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/5 transition-all cursor-pointer gap-4">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-2xl">
                    {event.icon || '📍'}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-semibold text-white text-lg">{event.name}</h4>
                    <p className="text-sm text-[#9699be]">{event.description}</p>
                    <p className="text-xs text-[#3d3bff] mt-1 font-medium">Empieza: {new Date(event.starts_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                  {event.status === 'open' ? (
                    <span className="px-3 py-1 rounded-full bg-[#1ee370]/10 text-[#1ee370] text-xs font-semibold uppercase tracking-wider">
                      Abierto
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-white/5 text-[#9699be] text-xs font-semibold uppercase tracking-wider">
                      Cerrado
                    </span>
                  )}
                  <ChevronRight className="text-[#9699be] group-hover:text-white transition-colors hidden md:block size-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
