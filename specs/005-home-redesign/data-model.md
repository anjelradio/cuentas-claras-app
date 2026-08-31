# Data Model (Mock)

Dado que no hay persistencia, definiremos las interfaces de los datos estáticos que simularán el estado del Home.

```typescript
// app/client/src/app/home/_components/home-mock-data.ts

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
  totalExpenses: number;
  imageUrl?: string;
}

export interface RecentActivity {
  id: string;
  actor: string;
  action: string; // ej. "registró un gasto", "saldó una deuda"
  eventOrTarget: string;
  timeAgo: string;
  amount?: number;
}
```
