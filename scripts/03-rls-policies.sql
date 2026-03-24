-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_updates ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view all active profiles" ON public.users
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Campaigns policies
CREATE POLICY "Businesses can view their own campaigns" ON public.campaigns
    FOR SELECT USING (business_id = auth.uid());

CREATE POLICY "Creators can view public campaigns" ON public.campaigns
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Businesses can insert campaigns" ON public.campaigns
    FOR INSERT WITH CHECK (business_id = auth.uid());

CREATE POLICY "Businesses can update their own campaigns" ON public.campaigns
    FOR UPDATE USING (business_id = auth.uid())
    WITH CHECK (business_id = auth.uid());

-- Campaign Requests policies
CREATE POLICY "Campaign parties can view requests" ON public.campaign_requests
    FOR SELECT USING (
        creator_id = auth.uid() OR 
        campaign_id IN (SELECT id FROM campaigns WHERE business_id = auth.uid())
    );

CREATE POLICY "Creators can insert campaign requests" ON public.campaign_requests
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Parties can update campaign requests" ON public.campaign_requests
    FOR UPDATE USING (
        creator_id = auth.uid() OR 
        campaign_id IN (SELECT id FROM campaigns WHERE business_id = auth.uid())
    )
    WITH CHECK (
        creator_id = auth.uid() OR 
        campaign_id IN (SELECT id FROM campaigns WHERE business_id = auth.uid())
    );

-- Messages policies
CREATE POLICY "Message participants can view" ON public.messages
    FOR SELECT USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

CREATE POLICY "Users can insert messages" ON public.messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update messages" ON public.messages
    FOR UPDATE USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    )
    WITH CHECK (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

-- Conversations policies
CREATE POLICY "Participants can view conversations" ON public.conversations
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

-- Notifications policies
CREATE POLICY "Users view their notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users update their notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- User Presence policies
CREATE POLICY "Anyone can view user presence" ON public.user_presence
    FOR SELECT USING (TRUE);

CREATE POLICY "Users update their presence" ON public.user_presence
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users insert their presence" ON public.user_presence
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Stream Updates policies
CREATE POLICY "Campaign parties view updates" ON public.stream_updates
    FOR SELECT USING (
        campaign_request_id IN (
            SELECT id FROM campaign_requests 
            WHERE creator_id = auth.uid() OR 
                  campaign_id IN (SELECT id FROM campaigns WHERE business_id = auth.uid())
        )
    );

CREATE POLICY "Creators insert stream updates" ON public.stream_updates
    FOR INSERT WITH CHECK (
        campaign_request_id IN (
            SELECT id FROM campaign_requests WHERE creator_id = auth.uid()
        )
    );
