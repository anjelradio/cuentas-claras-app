import { Bell } from "lucide-react"

import type { RequireAttentionItem } from "./home-mock-data"

export function RequireAttentionList({ items }: { items: RequireAttentionItem[] }) {
  if (!items || items.length === 0) return null

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Requiere tu atención</h3>
        <span className="text-xs text-warning border border-warning/30 px-3 py-1 rounded-full text-[#ff6b1a]">
          {items.length} pendiente{items.length !== 1 && "s"}
        </span>
      </div>
      
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="glass-panel border-warning/20 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center text-warning shrink-0 text-[#ff6b1a]">
                <Bell className="size-6" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">{item.title} de Bs. {item.amount}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <button className="w-full sm:w-auto bg-[#ff6b1a] hover:bg-[#ff8540] text-white font-medium px-6 py-2.5 rounded-xl transition-colors shrink-0 shadow-[0_4px_12px_rgba(255,107,26,0.3)]">
              Revisar
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
