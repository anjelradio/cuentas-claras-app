export interface EventView {
  id: string
  name: string
  description: string
  dateLabel: string
  icon: string
  memberCount?: number
}

export interface InvitationOption {
  id: string
  type: string
  name: string
  label: string
  description: string
  url?: string
}

export interface DebtSummary {
  id: string
  amount: number
  amountLabel?: string
  dateLabel?: string
  creditor?: string
  direction?: 'owed' | 'owing'
  person?: string
  description?: string
}

export interface ExpenseSummary {
  id: string
  description: string
  amount: number
  date: string
  category: string
  title?: string
  payer?: string
  amountLabel?: string
  dateLabel?: string
}

export interface ActivityItem {
  id: string
  title: string
  description: string
  status: 'success' | 'info' | 'warning'
  date: string
  actor?: string
  actionLabel?: string
  dateLabel?: string
}

export interface EventStatistics {
  currency?: string
  totalAmount: number
  categories: { 
    name: string; 
    percentage: number; 
    tone: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning';
    label?: string; 
    payer?: string; 
    amount: number 
  }[]
}

export type EventOverlayState = "invite" | "expense" | "debts" | "join" | "select"
