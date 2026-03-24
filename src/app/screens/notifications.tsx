import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router";
import { 
  ArrowLeft, 
  PoundSterling as Pound, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Target, 
  Bell,
  Trash2,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useRealtimeNotifications } from "../lib/useRealtimeHooks";
import { supabase } from "../lib/supabase";

type NotificationType = 'earnings' | 'message' | 'confirmed' | 'action' | 'warning' | 'match' | 'announcement';

interface NotificationGroup {
  id: string;
  type: string;
  title: string;
  description: string | null;
  is_read: boolean;
  created_at: string;
  related_id: string | null;
  action_url: string | null;
  group: 'TODAY' | 'YESTERDAY' | 'THIS WEEK' | 'EARLIER';
}

export function Notifications() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const role = searchParams.get('role');
  const backPath = role === 'business' ? '/business/dashboard' : '/dashboard';
  
  // Get realtime notifications
  const { notifications, unreadCount, markAsRead } = useRealtimeNotifications(currentUserId || "");

  // Get current user
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });
    return () => subscription?.unsubscribe();
  }, []);

  const markAllRead = async () => {
    for (const notif of notifications) {
      if (!notif.is_read) {
        await markAsRead(notif.id);
      }
    }
  };

  const clearAll = async () => {
    // Delete all notifications
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', currentUserId);
    
    if (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const notificationTypeMap: Record<string, NotificationType> = {
    'earnings': 'earnings',
    'message': 'message',
    'confirmed': 'confirmed',
    'action': 'action',
    'warning': 'warning',
    'match': 'match',
    'announcement': 'announcement',
  };

  const getIcon = (type: string): NotificationType => {
    const typeStr = type.toLowerCase();
    if (typeStr.includes('earn')) return 'earnings';
    if (typeStr.includes('message')) return 'message';
    if (typeStr.includes('confirm')) return 'confirmed';
    if (typeStr.includes('action')) return 'action';
    if (typeStr.includes('warn')) return 'warning';
    if (typeStr.includes('match')) return 'match';
    return 'announcement';
  };

  const getIconElement = (type: string) => {
    const iconType = getIcon(type);
    switch (iconType) {
      case 'earnings': return <Pound className="w-5 h-5 text-[#389C9A]" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-[#389C9A]" />;
      case 'confirmed': return <CheckCircle2 className="w-5 h-5 text-[#389C9A]" />;
      case 'action': return <Clock className="w-5 h-5 text-[#FEDB71]" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-[#D2691E]" />;
      case 'match': return <Target className="w-5 h-5 text-[#FEDB71]" />;
      case 'announcement': return <Bell className="w-5 h-5 text-[#1D1D1D]" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getGroup = (date: string): 'TODAY' | 'YESTERDAY' | 'THIS WEEK' | 'EARLIER' => {
    const notificationDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (notificationDate.toDateString() === today.toDateString()) return 'TODAY';
    if (notificationDate.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    if (notificationDate > weekAgo) return 'THIS WEEK';
    return 'EARLIER';
  };

  const groupedNotifications = notifications.reduce((acc, n) => {
    const group = getGroup(n.created_at);
    if (!acc[group]) acc[group] = [];
    acc[group].push({ ...n, group } as NotificationGroup);
    return acc;
  }, {} as Record<string, NotificationGroup[]>);

  const groups: Array<'TODAY' | 'YESTERDAY' | 'THIS WEEK' | 'EARLIER'> = ['TODAY', 'YESTERDAY', 'THIS WEEK', 'EARLIER'];

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#1D1D1D] pb-[80px]">
      {/* Top Bar */}
      <header className="px-5 pt-10 pb-4 border-b border-[#1D1D1D]/10 sticky top-0 bg-white z-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(backPath)} 
              className="p-1 -ml-1 active:bg-[#1D1D1D]/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black uppercase tracking-tighter italic">Notifications</h1>
          </div>
          {notifications.length > 0 && (
            <button 
              onClick={markAllRead}
              className="text-[10px] font-black uppercase tracking-widest text-[#389C9A] italic hover:opacity-70 active:scale-95 transition-all"
            >
              Mark All Read
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-[480px] mx-auto w-full">
        {notifications.length > 0 ? (
          <>
            {/* Unread Indicator */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#1D1D1D]/5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1D1D1D]/40">
                {unreadCount} unread
              </span>
              <button 
                onClick={clearAll}
                className="text-[10px] font-bold uppercase tracking-widest text-[#1D1D1D]/40 hover:text-[#1D1D1D] transition-colors italic"
              >
                Clear All
              </button>
            </div>

            {/* Notification Groups */}
            <div className="flex flex-col">
              {groups.map(group => {
                const groupNotifications = groupedNotifications[group];
                if (!groupNotifications || groupNotifications.length === 0) return null;

                return (
                  <div key={group} className="flex flex-col">
                    <div className="px-6 py-6 pb-2">
                      <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1D1D1D]/30 italic">
                        {group}
                      </h3>
                    </div>
                    <div className="flex flex-col">
                      <AnimatePresence mode="popLayout">
                        {groupNotifications.map((n) => (
                          <motion.div
                            layout
                            key={n.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.action_url) {
                                navigate(n.action_url);
                              }
                            }}
                            className={`flex w-full items-start gap-4 px-6 py-6 cursor-pointer relative transition-colors active:bg-[#F8F8F8] border-b border-[#1D1D1D]/5 ${
                              !n.is_read ? "bg-[#389C9A]/5 border-l-4 border-l-[#389C9A]" : "bg-white border-l-4 border-l-transparent"
                            }`}
                          >
                            <div className="flex-shrink-0 w-12 h-12 rounded-full border border-[#1D1D1D]/10 flex items-center justify-center bg-white">
                              {getIconElement(n.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className={`text-sm font-black uppercase tracking-tight leading-none truncate ${!n.is_read ? 'text-[#1D1D1D]' : 'text-[#1D1D1D]/70'}`}>
                                  {n.title}
                                </h4>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-[#1D1D1D]/30 whitespace-nowrap ml-2 italic">
                                  {new Date(n.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-[10px] font-medium text-[#1D1D1D]/50 truncate italic">
                                {n.description}
                              </p>
                            </div>

                            {!n.is_read && (
                              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                <div className="w-2 h-2 bg-[#389C9A] rounded-full" />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center pt-32 px-10 text-center">
            <div className="w-24 h-24 rounded-none border-2 border-[#1D1D1D]/10 flex items-center justify-center mb-8">
              <Bell className="w-10 h-10 text-[#1D1D1D]/10 stroke-[1.5]" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-4 leading-none">
              You're all caught up
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#1D1D1D]/40 leading-relaxed italic max-w-[280px]">
              When businesses send offers, payments process or campaigns update you will see it here.
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="mt-12 px-8 py-4 border-2 border-[#1D1D1D] text-[10px] font-black uppercase tracking-widest hover:bg-[#1D1D1D] hover:text-white transition-all italic active:scale-95"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
