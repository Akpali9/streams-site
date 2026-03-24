import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    broadcast: { ack: true },
  },
  auth: {
    persistSession: true,
  },
});

// Database Types
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  user_type: 'creator' | 'business';
  is_verified: boolean;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  campaign_type: string;
  status: string;
  budget: number | null;
  budget_spent: number;
  target_creators: number | null;
  confirmed_creators: number;
  start_date: string | null;
  end_date: string | null;
  goal: string | null;
  offer_duration: string | null;
  stream_deadline: string | null;
  promo_goal: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampaignRequest {
  id: string;
  campaign_id: string;
  creator_id: string;
  status: string;
  offer_message: string | null;
  response_message: string | null;
  responded_at: string | null;
  completion_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_id: string | null;
  last_message_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string | null;
  related_id: string | null;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPresence {
  id: string;
  user_id: string;
  is_online: boolean;
  last_activity_at: string;
  current_conversation_id: string | null;
  is_typing: boolean;
  typing_in_conversation_id: string | null;
  typing_expires_at: string | null;
}

export interface StreamUpdate {
  id: string;
  campaign_request_id: string;
  status: string;
  link: string | null;
  verification_notes: string | null;
  created_at: string;
}

// Database schema type
export type Database = {
  public: {
    Tables: {
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> };
      campaigns: { Row: Campaign; Insert: Partial<Campaign>; Update: Partial<Campaign> };
      campaign_requests: { Row: CampaignRequest; Insert: Partial<CampaignRequest>; Update: Partial<CampaignRequest> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      conversations: { Row: Conversation; Insert: Partial<Conversation>; Update: Partial<Conversation> };
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> };
      user_presence: { Row: UserPresence; Insert: Partial<UserPresence>; Update: Partial<UserPresence> };
      stream_updates: { Row: StreamUpdate; Insert: Partial<StreamUpdate>; Update: Partial<StreamUpdate> };
    };
  };
};
