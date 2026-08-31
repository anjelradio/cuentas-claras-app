export interface EventDetail {
  id: string;
  name: string;
  description?: string;
  icon: string;
  starts_at: string;
  status: 'open' | 'closed';
  user_id: string; // The owner
  owner_name?: string;
  is_owner: boolean;
}

export interface EventSummary {
  id: string;
  name: string;
  description?: string;
  icon: string;
  starts_at: string;
  status: 'open' | 'closed';
}

export interface EventMemberInfo {
  user_id: string;
  name: string;
  email: string;
  image?: string;
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
}

export interface EventUpdatePayload {
  name?: string;
  description?: string;
  icon?: string;
  starts_at?: string;
  status?: 'open' | 'closed';
}
