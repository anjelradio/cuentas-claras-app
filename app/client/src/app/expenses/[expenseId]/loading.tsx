import { Skeleton } from "@/components/ui/skeleton"

export default function ExpenseDetailLoading() {
  return (
    <section className="mx-auto w-full max-w-4xl animate-in fade-in duration-300">
      {/* Barra superior de navegación */}
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-4.5 w-36" />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Columna Izquierda: Resumen del Gasto */}
        <div className="space-y-8 lg:col-span-7">
          {/* Header del gasto: Icono, Título y Creadores */}
          <div className="flex flex-col items-center text-center">
            <Skeleton className="mb-4 size-16 rounded-full" />
            <Skeleton className="mb-2 h-8 w-56 rounded-lg" />
            <Skeleton className="mb-3 h-4 w-72 max-w-full rounded" />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Skeleton className="h-7 w-36 rounded-full" />
              <Skeleton className="h-7 w-36 rounded-full" />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>

          {/* Tarjeta de Comprobante y Desglose Financiero */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-24" />
            </div>

            <div className="rounded-2xl border border-white/5 bg-surface/80 p-4 shadow-xl">
              <Skeleton className="h-40 w-full rounded-xl" />
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Participantes */}
        <div className="space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3.5 w-16" />
          </div>

          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-surface/80 p-4 shadow"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
