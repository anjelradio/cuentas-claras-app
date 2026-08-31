export interface RequireAttentionItem {
  id: string;
  type: "DEBT" | "EXPENSE" | "EVENT";
  title: string;
  amount: number;
  dueDate?: string;
  description: string;
}

export interface RecentEvent {
  id: string;
  name: string;
  date: string;
  participants: number;
  expenseCount: number;
  amount: number;
  amountType: "positive" | "negative";
  emoji: string;
}

export interface RecentActivity {
  id: string;
  actor: string;
  action: string;
  eventOrTarget: string;
  timeAgo: string;
  amount?: number;
}

export const mockRequireAttention: RequireAttentionItem[] = [
  {
    id: "1",
    type: "EXPENSE",
    title: "Diego declaró un pago",
    amount: 200.00,
    description: "Samaipata 2026 · Espera tu confirmación"
  }
];

export const mockRecentEvents: RecentEvent[] = [
  {
    id: "1",
    name: "Samaipata 2026",
    date: "Ayer",
    participants: 4,
    expenseCount: 4,
    amount: 360.00,
    amountType: "positive",
    emoji: "✈️"
  },
  {
    id: "2",
    name: "Junte del viernes",
    date: "Hace 2 días",
    participants: 6,
    expenseCount: 2,
    amount: 15.50,
    amountType: "negative",
    emoji: "🍕"
  }
];

export const mockRecentActivity: RecentActivity[] = [
  {
    id: "1",
    actor: "Carla",
    action: "registró \"Gasolina\"",
    eventOrTarget: "Samaipata 2026",
    timeAgo: "Hace 18 min",
    amount: 240.00
  },
  {
    id: "2",
    actor: "Beto",
    action: "actualizó \"Cena\"",
    eventOrTarget: "Samaipata 2026",
    timeAgo: "Hace 1 h"
  },
  {
    id: "3",
    actor: "Lucía",
    action: "se unió al evento",
    eventOrTarget: "Junte del viernes",
    timeAgo: "Ayer"
  }
];
