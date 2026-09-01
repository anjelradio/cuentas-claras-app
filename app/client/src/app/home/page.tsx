import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { HomeHeader } from "@/components/layout/home-header"
import { RequireAttentionList } from "./_components/require-attention-card"
import { RecentEventsCard } from "./_components/recent-events-card"
import { RecentActivityCard } from "./_components/recent-activity-card"
import { JoinEventModal } from "./_components/join-event-modal"
import { CreateEventButton } from "./_components/create-event-button"
import { MyDebtsSheet } from "./_components/my-debts-sheet"
import { AddExpenseSheet } from "./_components/add-expense-sheet"
import { getCachedUserEvents } from "../(event)/_services/server-event-api"
import {
  getCachedPendingVerificationPayments,
  getCachedRecentEvents,
  getCachedUserRecentActivities,
} from "../expenses/_services/server-expense-api"

export default async function HomeDashboard() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/auth/login")
  }

  const firstName = session.user.name.split(" ")[0]

  const [activeEvents, pendingPayments, recentEvents, recentActivities] = await Promise.all([
    getCachedUserEvents({ activeOnly: true }).catch(() => []),
    getCachedPendingVerificationPayments().catch(() => []),
    getCachedRecentEvents(2).catch(() => []),
    getCachedUserRecentActivities(3).catch(() => []),
  ])

  const today = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())


  return (
    <div className="theme-stitch relative min-h-screen overflow-x-hidden">
      <HomeHeader user={session.user} />

      {/* Main App Container, ajustado para el espacio del header fijo */}
      <main className="max-w-5xl mx-auto min-h-screen px-5 pt-32 pb-24 relative z-0 md:px-8">
        
        {/* Layout Columnar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Welcome, Actions & Alerts */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            {/* Welcome Message */}
            <section>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h2 className="text-4xl font-semibold mb-2 text-white flex items-center gap-2">
                    Hola, {firstName} <span aria-hidden="true">👋</span>
                  </h2>
                  <p className="text-muted-foreground">¿Qué quieres resolver hoy?</p>
                </div>
                <p className="text-sm text-muted-foreground hidden md:block capitalize">{today}</p>
              </div>
            </section>

            {/* Quick Actions */}
            <section id="quick-actions" className="pt-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Accesos rápidos</h3>
                <span className="text-xs text-[#bd7aff] uppercase tracking-wider font-semibold flex items-center gap-1">TODO EMPIEZA AQUÍ ✨</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <CreateEventButton />
                <MyDebtsSheet />
                <AddExpenseSheet activeEvents={activeEvents} />
                <JoinEventModal />
              </div>
            </section>

            {/* Requires Attention */}
            <RequireAttentionList items={pendingPayments} />

          </div>

          {/* Right Column: Lists & Activity */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <RecentEventsCard events={recentEvents} />
            <RecentActivityCard activities={recentActivities} />
          </div>

        </div>

      </main>
    </div>
  )
}
