import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import type { Message, Conversation, Notification, Campaign, CampaignRequest, UserPresence } from './supabase';

export const useRealtimeMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        const { data, error: err } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (err) throw err;
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

  const addMessage = useCallback(async (message: Partial<Message>) => {
    const { data, error } = await supabase.from('messages').insert([message]).select().single();
    if (error) throw error;
    return data;
  }, []);

  return { messages, loading, error, addMessage };
};

export const useRealtimeConversations = (userId: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchConversations = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      setConversations(data || []);
      setLoading(false);
    };

    fetchConversations();

    const channel = supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConversations(prev => [payload.new as Conversation, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setConversations(prev =>
              prev.map(c => (c.id === payload.new.id ? (payload.new as Conversation) : c))
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return { conversations, loading };
};

export const useRealtimeNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
      setLoading(false);
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => (n.id === updated.id ? updated : n))
          );
          if (!payload.old.is_read && updated.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  }, []);

  return { notifications, unreadCount, loading, markAsRead };
};

export const useRealtimeCampaigns = (businessId?: string) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      let query = supabase.from('campaigns').select('*');
      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      const { data } = await query.order('created_at', { ascending: false });
      setCampaigns(data || []);
      setLoading(false);
    };

    fetchCampaigns();

    const channel = supabase
      .channel('campaigns')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
        },
        (payload) => {
          const campaign = payload.new as Campaign;
          if (!businessId || campaign.business_id === businessId) {
            if (payload.eventType === 'INSERT') {
              setCampaigns(prev => [campaign, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setCampaigns(prev =>
                prev.map(c => (c.id === campaign.id ? campaign : c))
              );
            } else if (payload.eventType === 'DELETE') {
              setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [businessId]);

  return { campaigns, loading };
};

export const useUserPresence = (userId: string) => {
  const updateTypingStatus = useCallback(
    async (isTyping: boolean, conversationId: string) => {
      if (!userId) return;
      await supabase.from('user_presence').upsert({
        user_id: userId,
        is_typing: isTyping,
        typing_in_conversation_id: isTyping ? conversationId : null,
        typing_expires_at: isTyping ? new Date(Date.now() + 3000).toISOString() : null,
      });
    },
    [userId]
  );

  return { updateTypingStatus };
};

export const useRealtimeDashboard = (userId: string) => {
  const [incomingRequests, setIncomingRequests] = useState<CampaignRequest[]>([]);
  const [liveCampaign, setLiveCampaign] = useState<Campaign | null>(null);
  const [earnings, setEarnings] = useState({
    totalEarned: 0,
    pending: 0,
    paidOut: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch campaign requests for this creator
        const { data: requests } = await supabase
          .from('campaign_requests')
          .select('*')
          .eq('creator_id', userId)
          .order('created_at', { ascending: false });

        if (requests) setIncomingRequests(requests);

        // Calculate earnings (mock calculation for now)
        setEarnings({
          totalEarned: 1240.0,
          pending: 145.0,
          paidOut: 1095.0,
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Subscribe to campaign request changes
    const channel = supabase
      .channel(`dashboard:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_requests',
          filter: `creator_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setIncomingRequests(prev => [payload.new as CampaignRequest, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setIncomingRequests(prev =>
              prev.map(req => (req.id === payload.new.id ? (payload.new as CampaignRequest) : req))
            );
          } else if (payload.eventType === 'DELETE') {
            setIncomingRequests(prev => prev.filter(req => req.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return { incomingRequests, liveCampaign, earnings, loading };
};

