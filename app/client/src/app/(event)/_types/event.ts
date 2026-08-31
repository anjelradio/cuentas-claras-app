import type { EventDetail as EventDetailSchema, EventMemberInfo as EventMemberInfoSchema, EventRead as EventReadSchema, EventSummary as EventSummarySchema } from "../_schemas/event-api-schemas";

export interface EventDetail extends EventDetailSchema {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  starts_at: string;
  ends_at: string;
  status: 'open' | 'closed';
  user_id: string; // The owner
  owner_name?: string | null;
  is_owner: boolean;
}

export interface EventSummary extends EventSummarySchema {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  starts_at: string;
  ends_at: string;
  status: 'open' | 'closed';
  member_count: number;
}

export type EventRead = EventReadSchema

export interface EventMemberInfo extends EventMemberInfoSchema {
  user_id: string;
  name: string;
  email: string;
  image?: string | null;
  role: 'owner' | 'member';
  joined_at: string; 
}

export interface EventInvitation {
  id: string;
  event_id: string;
  token_hash: string;
  expires_at: string;
}

export interface EventCreatePayload {
  name: string;
  description?: string;
  icon: string;
  starts_at: string;
  ends_at: string;
}

export interface EventUpdatePayload {
  name?: string;
  description?: string;
  icon?: string;
  starts_at?: string;
  ends_at?: string;
  status?: 'open' | 'closed';
}
