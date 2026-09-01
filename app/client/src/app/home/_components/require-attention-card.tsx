import Link from "next/link"
import { Bell, QrCode, Banknote } from "lucide-react"

import type { PendingVerificationPayment } from "../../expenses/_types/expense"

export function RequireAttentionList({ items }: { items: PendingVerificationPayment[] }) {
  if (!items || items.length === 0) return null

  return (
    <section id="require-attention">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Requiere tu atención</h3>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#ff6b1a]/15 text-[#ff6b1a] border border-[#ff6b1a]/30">
          {items.length} {items.length === 1 ? "pendiente" : "pendientes"}
        </span>
      </div>
      
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const methodLabel = item.payment_method === "qr" ? "QR" : "Efectivo"
          const MethodIcon = item.payment_method === "qr" ? QrCode : Banknote

          return (
            <div
              key={item.payment_id}
              className="glass-panel border-[#ff6b1a]/20 bg-surface/80 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#ff6b1a]/10 rounded-full flex items-center justify-center text-[#ff6b1a] shrink-0">
                  <MethodIcon className="size-6" />
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">
                    {item.debtor_name} declaró un pago de Bs. {Number(item.amount).toFixed(2)}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {item.expense_name} ({item.event_name}) • {methodLabel}
                  </p>
                </div>
              </div>
              <Link
                href={`/expenses/${item.expense_id}?action=verify&splitId=${item.split_id}`}
                className="w-full sm:w-auto text-center bg-[#ff6b1a] hover:bg-[#ff8540] text-white font-medium px-6 py-2.5 rounded-xl transition-colors shrink-0 shadow-[0_4px_12px_rgba(255,107,26,0.3)]"
              >
                Revisar
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}

