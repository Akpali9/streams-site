import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import type { Message, Conversation, Notification, Campaign, CampaignRequest, UserPresence } from './supabase';

/**
 * Hook for realtime messages in a conversation
 */
export const useRealtimeMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const fetchInitialMessages = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;
        setMessages(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
        setError(errorMessage);
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialMessages();

    // Subscribe to realtime updates
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages(prev =>
            prev.map(m => (m.id === payload.new.id ? (payload.new as Message) : m))
          );
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [conversationId]);

  const addMessage = useCallback(async (message: Partial<Message>) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error adding message:', err);
      throw err;
    }
  }, []);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, []);

  return { messages, loading, error, addMessage, markAsRead };
};

/**
 * Hook for realtime conversations
 */
export const useRealtimeConversations = (userId: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchInitialConversations = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('conversations')
          .select('*')
          .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
          .order('last_message_at', { ascending: false });

        if (fetchError) throw fetchError;
        setConversations(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
        setError(errorMessage);
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialConversations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          const conversation = payload.new as Conversation;
          if (conversation.participant_1_id === userId || conversation.participant_2_id === userId) {
            setConversations(prev => [...prev, conversation]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          setConversations(prev =>
            prev.map(c => (c.id === payload.new.id ? (payload.new as Conversation) : c))
          );
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [userId]);

  return { conversations, loading, error };
};

/**
 * Hook for realtime notifications
 */
export const useRealtimeNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchInitialNotifications = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.is_read).length || 0);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
        setError(errorMessage);
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialNotifications();

    // Subscribe to realtime updates
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
          const updatedNotification = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => (n.id === updatedNotification.id ? updatedNotification : n))
          );
          if (payload.old.is_read !== updatedNotification.is_read) {
            setUnreadCount(prev => (updatedNotification.is_read ? prev - 1 : prev + 1));
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  return { notifications, unreadCount, loading, error, markAsRead };
};

/**
 * Hook for realtime campaigns
 */
export const useRealtimeCampaigns = (businessId?: string) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    const fetchInitialCampaigns = async () => {
      try {
        setLoading(true);
        let query = supabase.from('campaigns').select('*');

        if (businessId) {
          query = query.eq('business_id', businessId);
        }

        const { data, error: fetchError } = await query.order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setCampaigns(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaigns';
        setError(errorMessage);
        console.error('Error fetching campaigns:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialCampaigns();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('campaigns:all')
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

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [businessId]);

  return { campaigns, loading, error };
};

/**
 * Hook for realtime campaign requests
 */
export const useRealtimeCampaignRequests = (userId?: string) => {
  const [requests, setRequests] = useState<CampaignRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    const fetchInitialRequests = async () => {
      try {
        setLoading(true);
        let query = supabase.from('campaign_requests').select('*');

        if (userId) {
          query = query.or(`creator_id.eq.${userId},campaign_id.in(select id from campaigns where business_id = '${userId}')`);
        }

        const { data, error: fetchError } = await query.order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setRequests(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaign requests';
        setError(errorMessage);
        console.error('Error fetching campaign requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialRequests();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('campaign_requests:all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_requests',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRequests(prev => [payload.new as CampaignRequest, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setRequests(prev =>
              prev.map(r => (r.id === payload.new.id ? (payload.new as CampaignRequest) : r))
            );
          } else if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [userId]);

  return { requests, loading, error };
};

/**
 * Hook for user presence tracking
 */
export const useUserPresence = (userId: string) => {
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (!userId) return;

    const updatePresence = async (isOnline: boolean) => {
      try {
        const { data, error } = await supabase
          .from('user_presence')
          .upsert(
            {
              user_id: userId,
              is_online: isOnline,
              last_activity_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .select()
          .single();

        if (error) throw error;
        setPresence(data);
      } catch (err) {
        console.error('Error updating presence:', err);
      }
    };

    // Set online
    updatePresence(true);

    // Subscribe to presence updates
    const channel = supabase
      .channel(`presence:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setPresence(payload.new as UserPresence);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    // Set offline on unmount
    return () => {
      updatePresence(false);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [userId]);

  const updateTypingStatus = useCallback(
    async (isTyping: boolean, conversationId: string) => {
      try {
        const { error } = await supabase
          .from('user_presence')
          .update({
            is_typing: isTyping,
            typing_in_conversation_id: isTyping ? conversationId : null,
            typing_expires_at: isTyping ? new Date(Date.now() + 3000).toISOString() : null,
          })
          .eq('user_id', userId);

        if (error) throw error;
      } catch (err) {
        console.error('Error updating typing status:', err);
      }
    },
    [userId]
  );

  return { presence, updateTypingStatus };
};
