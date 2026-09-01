export type ActivityType = 
  | "event_created"
  | "event_updated"
  | "event_closed"
  | "member_joined"
  | "member_left"
  | "member_removed"
  | "owner_transferred"
  | "expense_created"
  | "expense_updated"
  | "expense_voided"
  | "expense_receipt_analyzed"
  | "payment_declared"
  | "payment_confirmed"
  | "payment_rejected"

export interface ActivityLogEntry {
  id: string
  type: ActivityType
  actorName: string
  targetName?: string
  createdAt: string
  description?: string
}
