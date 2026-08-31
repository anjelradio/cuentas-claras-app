import { Card, CardContent } from "@/components/ui/card"
import type { EventStatistics } from "../../_types/event-home-types"

const toneColors = {
  primary: "var(--primary)",
  secondary: "var(--secondary)",
  tertiary: "var(--tertiary)",
  success: "var(--success)",
  warning: "var(--warning)",
} as const

interface EventStatisticsCardProps {
  statistics: EventStatistics
}

/**
 * Replica el resumen vertical de Stitch con una alternativa textual completa
 * para que el gráfico no sea la única fuente de información.
 */
export function EventStatisticsCard({ statistics }: EventStatisticsCardProps) {
  return (
    <section aria-labelledby="event-statistics-section-title" className="grid gap-4">
      <h2 id="event-statistics-section-title" className="text-lg font-medium text-headline">Resumen estadístico</h2>
      <Card className="glass-panel rounded-2xl border-border/60 bg-surface/80 py-0 text-body shadow-none">
        <CardContent className="items-center gap-8 p-6">
          <figure
            className="relative size-56 shrink-0"
            role="figure"
            aria-label="Gastos totales"
          >
            <svg className="size-full -rotate-90" viewBox="0 0 32 32" aria-hidden="true">
              {statistics.categories.map((category, index) => {
                const dash = category.percentage
                const offset = statistics.categories
                  .slice(0, index)
                  .reduce((total, current) => total + current.percentage, 0)

                return (
                  <circle
                    key={category.label}
                    cx="16"
                    cy="16"
                    r="12"
                    fill="transparent"
                    stroke={toneColors[category.tone]}
                    strokeDasharray={`${dash} ${100 - dash}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt"
                    strokeWidth="6"
                    pathLength="100"
                  />
                )
              })}
            </svg>
            <figcaption className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center">
              <span id="event-statistics-description" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</span>
              <span id="event-statistics-title" className="text-2xl font-bold text-headline">
                {statistics.currency} {statistics.totalAmount.toLocaleString("es-BO")}
              </span>
            </figcaption>
          </figure>

          <ul className="flex w-full flex-col gap-1" aria-label="Distribución de gastos por categoría">
            {statistics.categories.map((category) => (
              <li key={category.label} className="flex items-center justify-between gap-4 border-b border-border/60 p-3 last:border-b-0">
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: toneColors[category.tone] }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-headline">{category.label}</span>
                    <span className="block text-xs text-muted-foreground">Pagado por {category.payer}</span>
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-headline">
                  {statistics.currency} {category.amount.toLocaleString("es-BO")}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex w-full items-center justify-between border-t border-border pt-4">
            <span className="text-sm font-medium text-muted-foreground">Resumen final</span>
            <span className="text-2xl font-bold text-primary">{statistics.currency} {statistics.totalAmount.toLocaleString("es-BO")}</span>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
