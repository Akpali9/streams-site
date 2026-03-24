-- Seed Initial Data for Streams Site Realtime Demo
-- This script populates demo data for testing realtime features

-- Note: User IDs would need to be actual Supabase auth user IDs
-- Replace these UUIDs with real user IDs from your Supabase project

-- Sample creator user ID (replace with actual)
-- Sample business user ID (replace with actual)

-- For testing, we'll insert some demo campaigns and notifications
-- Adjust the UUIDs below based on your actual Supabase users

-- Insert sample campaigns (assumes creator and business IDs exist)
-- INSERT INTO public.campaigns (business_id, title, description, campaign_type, status, budget, target_creators, start_date, end_date, goal, offer_duration, stream_deadline, is_public)
-- VALUES 
--     ('00000000-0000-0000-0000-000000000001'::UUID, 'Summer Promo 2024', 'Promote summer collection across creator channels', 'banner-promo', 'active', 5000, 10, NOW(), NOW() + INTERVAL '30 days', 'awareness', '30', '2', TRUE),
--     ('00000000-0000-0000-0000-000000000001'::UUID, 'New Product Launch', 'Launch of premium product line', 'promo-only', 'active', 3000, 5, NOW(), NOW() + INTERVAL '14 days', 'sales', '14', '3', TRUE);

-- Create sample notifications (for testing)
-- INSERT INTO public.notifications (user_id, type, title, description, is_read)
-- VALUES 
--     ('00000000-0000-0000-0000-000000000002'::UUID, 'message', 'New Message from Marketing Team', 'Click to view the message', FALSE),
--     ('00000000-0000-0000-0000-000000000002'::UUID, 'campaign_request', 'You have a new campaign offer', 'A business wants to work with you', FALSE),
--     ('00000000-0000-0000-0000-000000000001'::UUID, 'earnings', 'Earnings Updated', 'Your earnings have been updated', TRUE);

-- Note: For production, you would:
-- 1. Create Supabase auth users first
-- 2. Use their real IDs in the INSERT statements
-- 3. Populate with realistic test data
-- 4. Consider using Supabase's API or Admin SDK for user creation

-- Helper: Function to create demo notification
CREATE OR REPLACE FUNCTION create_demo_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_description TEXT,
    p_related_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, description, related_id, is_read)
    VALUES (p_user_id, p_type, p_title, p_description, p_related_id, FALSE)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Helper: Function to setup user presence
CREATE OR REPLACE FUNCTION setup_user_presence(p_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.user_presence (user_id, is_online, last_activity_at)
    VALUES (p_user_id, FALSE, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        last_activity_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- These helper functions are available for use when testing realtime features
-- They help with creating test data without needing raw SQL

-- Note: To run actual seed data, you'll need:
-- 1. Valid user IDs from your Supabase auth.users table
-- 2. To uncomment and adjust the INSERT statements above
-- 3. To execute them against your Supabase database
