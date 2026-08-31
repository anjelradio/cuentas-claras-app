import { MembersClient } from "./members-view"
import { getCachedEventDetail, getCachedEventMembers } from "../../_services/server-event-api"

interface MembersPageProps {
  params: Promise<{ eventId: string }>
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { eventId } = await params
  
  // These fetch requests are executed on the server and use the layout's cache
  const [eventDetail, members] = await Promise.all([
    getCachedEventDetail(eventId),
    getCachedEventMembers(eventId)
  ])

  return <MembersClient eventId={eventId} initialMembers={members} isOwner={eventDetail.is_owner} isEventOpen={eventDetail.status === "open"} />
}
