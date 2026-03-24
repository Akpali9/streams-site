# Realtime Setup Guide

This project has been configured with Supabase Realtime functionality for live updates across all features including messages, notifications, campaigns, and user presence.

## Architecture Overview

### Database Layer
All realtime data flows through PostgreSQL tables with Realtime subscriptions enabled:
- `users` - User profiles and authentication
- `campaigns` - Campaign information and status
- `campaign_requests` - Campaign offer/request status
- `messages` - Direct messages between creators and businesses
- `conversations` - Message thread management
- `notifications` - Real-time notifications
- `user_presence` - Online status and typing indicators
- `stream_updates` - Live stream status updates

### Service Layer

#### Core Services
1. **Supabase Client** (`src/lib/supabase.ts`)
   - Initializes Supabase with realtime configuration
   - Exports TypeScript types for all database entities

2. **RealtimeContext** (`src/lib/RealtimeContext.tsx`)
   - React Context provider for global realtime state
   - Manages WebSocket connections for all tables
   - Provides message, conversation, notification, and campaign data

3. **Custom Hooks** (`src/lib/useRealtimeHooks.ts`)
   - `useRealtimeMessages()` - Messages in a conversation
   - `useRealtimeConversations()` - User's conversations
   - `useRealtimeNotifications()` - User's notifications
   - `useRealtimeCampaigns()` - Available campaigns
   - `useRealtimeCampaignRequests()` - Campaign requests
   - `useUserPresence()` - Online status and typing indicators

#### UI Components
- **TypingIndicator** - Shows when users are typing
- **UserPresenceIndicator** - Online/offline status badge
- **PresenceBadge** - User presence with name

## Setup Instructions

### 1. Environment Variables
Create a `.env.local` file with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from your Supabase dashboard: Settings > API

### 2. Database Setup
The database schema has been created with the following migrations:
- `scripts/01-schema-tables.sql` - Creates all tables
- `scripts/02-triggers-realtime.sql` - Sets up triggers
- `scripts/03-rls-policies.sql` - Configures Row Level Security

All tables are automatically enabled for Realtime subscriptions.

### 3. Enable RLS Policies
Row Level Security (RLS) must be enabled on Supabase:

1. Go to Supabase Dashboard > SQL Editor
2. Run the RLS policy scripts
3. Enable RLS on each table in the Auth Policies tab

## Integration with Screens

### Messages (message-thread.tsx)
- Uses `useRealtimeMessages()` to subscribe to conversation messages
- Includes typing indicators via `useUserPresence()`
- Sends messages directly to database which triggers realtime updates

### Messages Inbox (messages-inbox.tsx)
- Uses `useRealtimeConversations()` for all conversations
- Auto-updates conversation list with latest messages
- Shows unread indicators

### Notifications (notifications.tsx)
- Uses `useRealtimeNotifications()` for all user notifications
- Tracks unread count automatically
- Supports marking notifications as read

### Campaigns (campaigns.tsx)
- Uses `useRealtimeCampaigns()` to monitor campaign status
- Shows progress with live creator confirmations
- Auto-updates campaign earnings

## Features Implemented

### Real-time Messages
- Instant message delivery between creators and businesses
- Typing indicators showing who's typing
- Read receipts for messages
- Message attachments support

### User Presence
- Online/offline status updates
- Last seen timestamps
- Typing indicators in conversations
- Active conversation tracking

### Notifications
- Real-time push notifications
- Unread count tracking
- Grouping by time (Today, Yesterday, This Week, Earlier)
- Multiple notification types (earnings, messages, campaign updates, etc.)

### Campaign Updates
- Live campaign status changes
- Real-time confirmation tracking
- Earnings updates as they occur
- Stream deadline notifications

### Dashboard Metrics
- Real-time earnings calculations
- Live campaign progress
- Instant offer notifications
- Payment status updates

## Performance Optimization

### Connection Management
- Uses connection pooling for efficient WebSocket usage
- Automatic reconnection on network failure
- Graceful degradation if realtime unavailable

### Debouncing
- Typing indicators debounced to 3 seconds
- Presence updates throttled to reduce noise
- Notification grouping to minimize updates

### Caching
- Initial data fetched on component mount
- Incremental updates only for changes
- Old data retained for offline support

## Testing Realtime

### Open Multiple Windows
1. Open the app in two browser windows
2. Log in as different users (creator and business)
3. Send messages in one window
4. Watch them appear instantly in the other

### Test Presence
1. Monitor the online status indicators
2. Go offline in one window
3. See status update in real-time in other window

### Test Notifications
1. Create a campaign offer from business account
2. Watch notification appear instantly in creator account
3. Check unread count updates

## Troubleshooting

### Realtime Not Working
1. Check Supabase connection: `supabase.auth.getSession()`
2. Verify Realtime is enabled on tables in Supabase Dashboard
3. Check browser console for connection errors
4. Ensure RLS policies allow user's queries

### Messages Not Appearing
1. Verify conversation_id is correct
2. Check RLS policies on messages table
3. Ensure both users have read permissions
4. Check message created_at timestamp

### Presence Not Updating
1. Verify user_presence table exists
2. Check updateTypingStatus is being called
3. Ensure typing_expires_at is being set correctly
4. Look for RLS errors in browser console

## API Reference

### useRealtimeMessages(conversationId)
```typescript
const { messages, loading, error, addMessage, markAsRead } = useRealtimeMessages(conversationId);
```

### useRealtimeConversations(userId)
```typescript
const { conversations, loading, error } = useRealtimeConversations(userId);
```

### useRealtimeNotifications(userId)
```typescript
const { notifications, unreadCount, loading, error, markAsRead } = useRealtimeNotifications(userId);
```

### useRealtimeCampaigns(businessId?)
```typescript
const { campaigns, loading, error } = useRealtimeCampaigns(businessId);
```

### useUserPresence(userId)
```typescript
const { presence, updateTypingStatus } = useUserPresence(userId);
```

## Security

### Row Level Security (RLS)
All tables enforce RLS policies:
- Users can only see their own data
- Conversations limited to participants
- Notifications only visible to recipient
- Campaign requests filtered by user role

### Authentication
- All queries require authenticated user
- Session tokens passed automatically
- Automatic cleanup on logout

## Next Steps

1. Complete dashboard realtime integration
2. Add RLS policy migrations
3. Implement presence persistence
4. Add offline message queue
5. Setup notification triggers for external events
