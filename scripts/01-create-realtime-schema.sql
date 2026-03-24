-- Realtime Database Schema for Streams Site
-- This script creates the core tables needed for real-time functionality

-- Enable the required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users Table (extends existing Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('creator', 'business')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT users_email_key UNIQUE(email)
);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    business_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN ('banner', 'banner-promo', 'promo-only', 'stream')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    budget DECIMAL(10, 2),
    budget_spent DECIMAL(10, 2) DEFAULT 0,
    target_creators INTEGER,
    confirmed_creators INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    goal TEXT,
    offer_duration TEXT,
    stream_deadline TEXT,
    promo_goal TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    
    INDEX idx_business_id (business_id),
    INDEX idx_status (status),
    INDEX idx_campaign_type (campaign_type)
);

-- Campaign Requests Table (Incoming offers)
CREATE TABLE IF NOT EXISTS public.campaign_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'completed')),
    offer_message TEXT,
    response_message TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_creator_id (creator_id),
    INDEX idx_status (status),
    CONSTRAINT campaign_requests_unique UNIQUE(campaign_id, creator_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    attachment_url TEXT,
    attachment_type TEXT CHECK (attachment_type IN ('image', 'document', 'video', NULL)),
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_recipient_id (recipient_id),
    INDEX idx_is_read (is_read)
);

-- Message Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    participant_1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    participant_2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    last_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    archived_by TEXT[], -- Array of user IDs who archived this conversation
    
    INDEX idx_participant_1_id (participant_1_id),
    INDEX idx_participant_2_id (participant_2_id),
    INDEX idx_last_message_at (last_message_at),
    CONSTRAINT conversations_unique UNIQUE(participant_1_id, participant_2_id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('message', 'campaign_request', 'campaign_accepted', 'campaign_rejected', 'earnings', 'announcement')),
    title TEXT NOT NULL,
    description TEXT,
    related_id UUID, -- ID of related entity (campaign_id, message_id, etc.)
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- User Presence Table (for online status and typing indicators)
CREATE TABLE IF NOT EXISTS public.user_presence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT FALSE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    current_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    is_typing BOOLEAN DEFAULT FALSE,
    typing_in_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    typing_expires_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_is_online (is_online),
    INDEX idx_current_conversation_id (current_conversation_id)
);

-- Stream Updates Table (for live streaming status)
CREATE TABLE IF NOT EXISTS public.stream_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    campaign_request_id UUID NOT NULL REFERENCES public.campaign_requests(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Verified', 'Under Review', 'Upload Required')),
    link TEXT,
    verification_notes TEXT,
    
    INDEX idx_campaign_request_id (campaign_request_id),
    INDEX idx_status (status)
);

-- Update user's updated_at timestamp on modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER campaign_requests_updated_at BEFORE UPDATE ON public.campaign_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER messages_updated_at BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER notifications_updated_at BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_presence_updated_at BEFORE UPDATE ON public.user_presence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER stream_updates_updated_at BEFORE UPDATE ON public.stream_updates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_updates;

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_updates ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile and public profiles
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view all public profiles" ON public.users
    FOR SELECT USING (is_active = TRUE);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Campaigns - Business can view/edit own, creators can view public
CREATE POLICY "Businesses can view their own campaigns" ON public.campaigns
    FOR SELECT USING (business_id = auth.uid());

CREATE POLICY "Creators can view public campaigns" ON public.campaigns
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Businesses can insert campaigns" ON public.campaigns
    FOR INSERT WITH CHECK (business_id = auth.uid());

CREATE POLICY "Businesses can update their own campaigns" ON public.campaigns
    FOR UPDATE USING (business_id = auth.uid())
    WITH CHECK (business_id = auth.uid());

-- Campaign Requests - Involved parties can view
CREATE POLICY "Campaign request parties can view" ON public.campaign_requests
    FOR SELECT USING (
        creator_id = auth.uid() OR 
        campaign_id IN (SELECT id FROM campaigns WHERE business_id = auth.uid())
    );

CREATE POLICY "Creators can insert campaign requests" ON public.campaign_requests
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Relevant parties can update campaign requests" ON public.campaign_requests
    FOR UPDATE USING (
        creator_id = auth.uid() OR 
        campaign_id IN (SELECT id FROM campaigns WHERE business_id = auth.uid())
    )
    WITH CHECK (
        creator_id = auth.uid() OR 
        campaign_id IN (SELECT id FROM campaigns WHERE business_id = auth.uid())
    );

-- Messages - Only involved parties can view/insert
CREATE POLICY "Message participants can view messages" ON public.messages
    FOR SELECT USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

CREATE POLICY "Message participants can insert messages" ON public.messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    )
    WITH CHECK (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

-- Conversations - Only participants can view
CREATE POLICY "Conversation participants can view" ON public.conversations
    FOR SELECT USING (
        participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    );

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (
        participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    );

CREATE POLICY "Participants can update conversations" ON public.conversations
    FOR UPDATE USING (
        participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    )
    WITH CHECK (
        participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    );

-- Notifications - Users can only view their own
CREATE POLICY "Users can view their notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- User Presence - Public read, users can update their own
CREATE POLICY "Anyone can view user presence" ON public.user_presence
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can update their own presence" ON public.user_presence
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their presence" ON public.user_presence
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Stream Updates - Related parties can view
CREATE POLICY "Campaign parties can view stream updates" ON public.stream_updates
    FOR SELECT USING (
        campaign_request_id IN (
            SELECT id FROM campaign_requests 
            WHERE creator_id = auth.uid() OR 
                  campaign_id IN (SELECT id FROM campaigns WHERE business_id = auth.uid())
        )
    );

CREATE POLICY "Campaign creators can insert stream updates" ON public.stream_updates
    FOR INSERT WITH CHECK (
        campaign_request_id IN (
            SELECT id FROM campaign_requests WHERE creator_id = auth.uid()
        )
    );
