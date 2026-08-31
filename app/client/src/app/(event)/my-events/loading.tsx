import { Plus } from "lucide-react"

export default function MyEventsLoading() {
  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full animate-pulse">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold text-transparent bg-muted rounded">Mis Eventos</h2>
        <div className="inline-flex items-center justify-center bg-muted text-transparent rounded-lg px-4 py-2">
          <Plus className="size-4 mr-2" />
          Nuevo Evento
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted/20 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="w-12 h-12 bg-muted rounded-full"></div>
              <div className="flex flex-col gap-2">
                <div className="h-5 w-40 bg-muted rounded"></div>
                <div className="h-4 w-64 bg-muted rounded"></div>
                <div className="h-3 w-32 bg-muted rounded mt-1"></div>
              </div>
            </div>
            <div className="h-6 w-20 bg-muted rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
