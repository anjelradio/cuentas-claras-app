export interface NotificationItem {
  id: string;
  event_id: string;
  actor_id: string;
  actor_name: string;
  target_id: string | null;
  target_name: string | null;
  action_type: string;
  title: string;
  description: string;
  target_path: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unread_count: number;
  total: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface BatchReadResponse {
  marked_count: number;
  status: string;
}
