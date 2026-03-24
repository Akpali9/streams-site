import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import type { Conversation, Message, Notification, Campaign, CampaignRequest, UserPresence } from './supabase';

interface RealtimeContextType {
  // Messages
  messages: Message[];
  addMessage: (message: Message) => void;
  
  // Conversations
  conversations: Conversation[];
  addConversation: (conversation: Conversation) => void;
  
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  
  // Campaigns
  campaigns: Campaign[];
  updateCampaign: (campaign: Campaign) => void;
  
  // Campaign Requests
  campaignRequests: CampaignRequest[];
  updateCampaignRequest: (request: CampaignRequest) => void;
  
  // User Presence
  userPresence: Map<string, UserPresence>;
  updateUserPresence: (presence: UserPresence) => void;
  
  // Connection Status
  isConnected: boolean;
  connectionError: string | null;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignRequests, setCampaignRequests] = useState<CampaignRequest[]>([]);
  const [userPresence, setUserPresence] = useState<Map<string, UserPresence>>(new Map());
  const [isConnected, setIsConnected] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const subscriptionsRef = useRef<{ unsubscribe: () => void }[]>([]);

  useEffect(() => {
    const setupSubscriptions = async () => {
      try {
        // Messages subscription
        const messagesSubscription = supabase
          .channel('messages')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'messages',
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setMessages(prev => [...prev, payload.new as Message]);
              } else if (payload.eventType === 'UPDATE') {
                setMessages(prev =>
                  prev.map(m => (m.id === payload.new.id ? (payload.new as Message) : m))
                );
              } else if (payload.eventType === 'DELETE') {
                setMessages(prev => prev.filter(m => m.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        // Conversations subscription
        const conversationsSubscription = supabase
          .channel('conversations')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'conversations',
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setConversations(prev => [...prev, payload.new as Conversation]);
              } else if (payload.eventType === 'UPDATE') {
                setConversations(prev =>
                  prev.map(c => (c.id === payload.new.id ? (payload.new as Conversation) : c))
                );
              } else if (payload.eventType === 'DELETE') {
                setConversations(prev => prev.filter(c => c.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        // Notifications subscription
        const notificationsSubscription = supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setNotifications(prev => [...prev, payload.new as Notification]);
              } else if (payload.eventType === 'UPDATE') {
                setNotifications(prev =>
                  prev.map(n => (n.id === payload.new.id ? (payload.new as Notification) : n))
                );
              } else if (payload.eventType === 'DELETE') {
                setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        // Campaigns subscription
        const campaignsSubscription = supabase
          .channel('campaigns')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'campaigns',
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setCampaigns(prev => [...prev, payload.new as Campaign]);
              } else if (payload.eventType === 'UPDATE') {
                setCampaigns(prev =>
                  prev.map(c => (c.id === payload.new.id ? (payload.new as Campaign) : c))
                );
              } else if (payload.eventType === 'DELETE') {
                setCampaigns(prev => prev.filter(c => c.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        // Campaign Requests subscription
        const requestsSubscription = supabase
          .channel('campaign_requests')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'campaign_requests',
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setCampaignRequests(prev => [...prev, payload.new as CampaignRequest]);
              } else if (payload.eventType === 'UPDATE') {
                setCampaignRequests(prev =>
                  prev.map(r => (r.id === payload.new.id ? (payload.new as CampaignRequest) : r))
                );
              } else if (payload.eventType === 'DELETE') {
                setCampaignRequests(prev => prev.filter(r => r.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        // User Presence subscription
        const presenceSubscription = supabase
          .channel('user_presence')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_presence',
            },
            (payload) => {
              const presence = payload.new as UserPresence;
              setUserPresence(prev => new Map(prev).set(presence.user_id, presence));
            }
          )
          .subscribe();

        subscriptionsRef.current = [
          messagesSubscription,
          conversationsSubscription,
          notificationsSubscription,
          campaignsSubscription,
          requestsSubscription,
          presenceSubscription,
        ];

        setIsConnected(true);
        setConnectionError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to setup subscriptions';
        setConnectionError(errorMessage);
        setIsConnected(false);
        console.error('Failed to setup realtime subscriptions:', error);
      }
    };

    setupSubscriptions();

    return () => {
      subscriptionsRef.current.forEach(sub => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      });
    };
  }, []);

  const value: RealtimeContextType = {
    messages,
    addMessage: (message) => setMessages(prev => [...prev, message]),
    conversations,
    addConversation: (conversation) => setConversations(prev => [...prev, conversation]),
    notifications,
    addNotification: (notification) => setNotifications(prev => [...prev, notification]),
    campaigns,
    updateCampaign: (campaign) =>
      setCampaigns(prev => prev.map(c => (c.id === campaign.id ? campaign : c))),
    campaignRequests,
    updateCampaignRequest: (request) =>
      setCampaignRequests(prev => prev.map(r => (r.id === request.id ? request : r))),
    userPresence,
    updateUserPresence: (presence) =>
      setUserPresence(prev => new Map(prev).set(presence.user_id, presence)),
    isConnected,
    connectionError,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
