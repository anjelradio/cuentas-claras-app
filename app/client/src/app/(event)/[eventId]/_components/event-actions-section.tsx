"use client"

import Link from "next/link"
import { FileUp, KeyRound, Pencil, QrCode, Users, UserRound } from "lucide-react"
import { toast } from "sonner"
import * as React from "react"
import { useRouter } from "next/navigation"

import { QuickActionButton } from "@/components/custom/quick-action-button"

import type { DebtSummary, EventOverlayState, EventView, InvitationOption } from "../../_types/event-home-types"
import { EventOverlayFlows } from "./event-overlay-flows"

/**
 * Expone las acciones principales de un evento y concentra sus overlays locales.
 */
interface EventActionsSectionProps {
  event: EventView
  invitations?: InvitationOption[]
  debts?: DebtSummary[]
}

export function EventActionsSection({
  event,
  invitations = [],
  debts = [],
  isOwner = false
}: EventActionsSectionProps & { isOwner?: boolean }) {
  const [openOverlay, setOpenOverlay] = React.useState<EventOverlayState | null>(null)
  const router = useRouter()

  return (
    <section aria-labelledby="event-actions-title" className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="event-actions-title" className="text-lg font-semibold text-headline">Acciones del evento</h2>
        {isOwner && (
        <Link href={`/${event.id}/edit-event`} className="inline-flex h-8 items-center gap-1 px-0 text-xs font-semibold uppercase tracking-wider text-tertiary transition-colors hover:text-tertiary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Pencil className="size-3.5" aria-hidden="true" />
          Editar evento
        </Link>
        )}
      </div>

      <div className="sr-only" aria-label="Flujos adicionales de presentación">
        <button type="button" onClick={() => setOpenOverlay("join")}>Unirme a un evento</button>
        <button type="button" onClick={() => setOpenOverlay("select")}>Seleccionar evento</button>
      </div>

      {isOwner && (
      <QuickActionButton
        icon={Users}
        title="Invitar personas"
        description="Comparte el código para que otros se unan"
        variant="primary-orange"
        layout="horizontal"
        onClick={() => setOpenOverlay("invite")}
      />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <QuickActionButton
          icon={FileUp}
          title="Registrar gasto"
          description="Añade un nuevo gasto al grupo"
          variant="primary-purple"
          onClick={() => setOpenOverlay("expense")}
        />
        <QuickActionButton
          icon={KeyRound}
          title="Mis deudas"
          description="Consulta tus saldos pendientes"
          variant="secondary-purple"
          onClick={() => setOpenOverlay("debts")}
        />
        <QuickActionButton
          icon={UserRound}
          title="Ver miembros"
          description="Gestiona quién participa en el grupo"
          variant="secondary-purple"
          onClick={() => router.push(`/${event.id}/members`)}
        />
        <QuickActionButton
          icon={QrCode}
          title="Registrar QR"
          description="Sube un comprobante de pago QR"
          variant="primary-blue"
          onClick={() => toast.info("El registro QR estará disponible próximamente.")}
        />
      </div>

      <EventOverlayFlows
        openOverlay={openOverlay}
        event={event}
        invitations={invitations}
        debts={debts}
        onOpenChange={setOpenOverlay}
      />
    </section>
  )
}
