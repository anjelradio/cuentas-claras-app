# Data Model: Event Pages

This feature uses static mock data for the UI implementation. The models below define the shape of that data.

## Event (My Events)
```typescript
type EventStatus = 'abierto' | 'cerrado'

interface MockEvent {
  id: string
  title: string
  description: string
  emoji: string
  totalExpense: number
  status: EventStatus
}
```

## Member (Event Members)
```typescript
type MemberRole = 'organizador' | 'miembro'

interface MockMember {
  id: string
  name: string
  role: MemberRole
  imageUrl?: string
  initials?: string
  joinedDate: string // e.g., 'Se unió el 12 Ago, 2026'
}
```
