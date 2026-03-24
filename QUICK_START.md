# LiveLink Quick Start Guide

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file with:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these from your Supabase project settings → API.

### 3. Run Development Server
```bash
npm run dev
```

Server runs on `http://localhost:5173`

---

## Key Routes

### Public Routes
- `/` - Home page (with auto-redirect if logged in)
- `/login/portal` - Login portal
- `/become-creator` - Creator signup
- `/become-business` - Business signup

### Creator Routes (Protected)
- `/dashboard` - Creator dashboard (incoming requests, live campaigns)
- `/campaigns` - My campaigns list
- `/messages?role=creator` - Messages inbox
- `/notifications?role=creator` - Notifications

### Business Routes (Protected)
- `/business/dashboard` - Business dashboard
- `/business/settings` - Settings
- `/login/business` - Business login

---

## Using Real-time Features

### 1. Subscribe to Dashboard Data
```tsx
import { useRealtimeDashboard } from '../lib/useRealtimeHooks';

function Dashboard() {
  const { incomingRequests, liveCampaign, earnings, loading } = 
    useRealtimeDashboard(currentUserId);
  
  // Data updates automatically when server changes
  // ...
}
```

### 2. Subscribe to Messages
```tsx
import { useRealtimeMessages } from '../lib/useRealtimeHooks';

function MessageThread() {
  const { messages, addMessage } = useRealtimeMessages(conversationId);
  
  // Messages appear instantly
  // ...
}
```

### 3. Subscribe to Notifications
```tsx
import { useRealtimeNotifications } from '../lib/useRealtimeHooks';

function NotificationsScreen() {
  const { notifications, unreadCount, markAsRead } = 
    useRealtimeNotifications(userId);
  
  // Notifications update in real-time
  // ...
}
```

### 4. Update User Presence
```tsx
import { useUserPresence } from '../lib/useRealtimeHooks';

function ChatComponent() {
  const { updateTypingStatus } = useUserPresence(userId);
  
  const handleTyping = () => {
    updateTypingStatus(true, conversationId);
  };
}
```

---

## Project Structure

```
src/
├── lib/                    # Services & utilities
│   ├── supabase.ts        # Supabase client
│   ├── useRealtimeHooks.ts # All realtime hooks
│   └── RealtimeContext.tsx # Global context
├── app/
│   ├── screens/           # Page components
│   ├── components/        # UI components
│   └── App.tsx            # Root (with RealtimeProvider)
└── main.tsx               # Entry point
```

---

## Authentication

### Sign Up (Creator)
1. Go to `/become-creator`
2. Fill in email, password, name
3. Click sign up
4. Auto-redirects to creator dashboard

### Sign Up (Business)
1. Go to `/become-business`
2. Fill in company info
3. Click sign up
4. Auto-redirects to business dashboard

### Login
1. Go to `/login/portal` or `/login/business`
2. Enter email and password
3. Auto-redirects to dashboard

### Logout
Click user menu (top right) → Sign Out

---

## Common Tasks

### Add Realtime to a New Screen
```tsx
import { useRealtimeDashboard } from '../lib/useRealtimeHooks';

export function MyScreen() {
  const { data, loading } = useRealtimeDashboard(userId);
  
  if (loading) return <div>Loading...</div>;
  
  return <div>{/* Use data */}</div>;
}
```

### Create Custom Realtime Hook
See `src/lib/useRealtimeHooks.ts` for examples.

### Add Row-Level Security
Go to Supabase Console → SQL Editor → Run migrations in `/scripts/03-rls-policies.sql`

---

## Troubleshooting

### Realtime Not Working
1. Check Supabase connection: Open browser console
2. Verify environment variables are set
3. Check Supabase Realtime is enabled in project settings

### Authentication Issues
1. Clear browser cache and cookies
2. Check email/password are correct
3. Verify user exists in Supabase → Authentication

### Messages Not Appearing
1. Check conversation ID is correct
2. Verify RLS policies allow read access
3. Check network tab for subscription errors

---

## Database Tables

### users
```sql
id (UUID) | email | full_name | user_type | is_verified | created_at
```

### campaigns
```sql
id | business_id | title | status | budget | target_creators | confirmed_creators
```

### messages
```sql
id | conversation_id | sender_id | recipient_id | content | is_read | created_at
```

### notifications
```sql
id | user_id | type | title | description | is_read | created_at
```

### user_presence
```sql
id | user_id | is_online | is_typing | typing_in_conversation_id
```

---

## Next Steps

1. **Test All Features**
   - Create accounts (creator + business)
   - Send messages and verify real-time
   - Check notifications appear instantly
   - Verify presence status

2. **Customize Branding**
   - Update colors in component classes
   - Change logo/images
   - Update copy/text

3. **Deploy to Production**
   - Build: `npm run build`
   - Deploy to Vercel/your host
   - Set production env variables

---

## Resources

- Supabase Docs: https://supabase.com/docs
- Realtime Guide: https://supabase.com/docs/guides/realtime
- React Router: https://reactrouter.com
- Tailwind CSS: https://tailwindcss.com

---

**Happy coding! 🚀**
