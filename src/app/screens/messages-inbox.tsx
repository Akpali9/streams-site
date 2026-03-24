import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Search as SearchIcon } from "lucide-react";
import { BottomNav } from "../components/bottom-nav";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { AppHeader } from "../components/app-header";
import { useRealtimeConversations } from "../lib/useRealtimeHooks";
import { supabase } from "../lib/supabase";

export function MessagesInbox() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const role = searchParams.get('role');
  const userType = role === 'business' ? 'business' : 'creator';
  const backPath = userType === 'business' ? '/business/dashboard' : '/dashboard';
  
  // Get realtime conversations
  const { conversations, loading } = useRealtimeConversations(currentUserId || "");

  // Get current user
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });
    return () => subscription?.unsubscribe();
  }, []);

  // Filter conversations by search term
  const filteredConversations = conversations.filter((conv) =>
    conv.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#1D1D1D] pb-[60px]">
      <AppHeader showBack title="Messages" backPath={backPath} userType={userType} />
      <main>
        <div className="px-6 py-8">
          <div className="relative mb-6">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1D1D1D]/40" />
            <input 
              type="text" 
              placeholder="SEARCH CONVERSATIONS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 bg-[#F8F8F8] border border-[#1D1D1D]/10 rounded-none pl-11 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#1D1D1D] transition-colors italic"
            />
          </div>
        </div>
        
        <div className="bg-white border-y border-[#1D1D1D]/10">
          {loading ? (
            <div className="h-20 flex items-center justify-center text-[#1D1D1D]/40">
              <span className="text-xs font-bold uppercase">Loading conversations...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="h-20 flex items-center justify-center text-[#1D1D1D]/40">
              <span className="text-xs font-bold uppercase">No conversations</span>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div 
                key={conv.id}
                onClick={() => navigate(`/messages/${conv.id}`)}
                className="h-[80px] flex items-center px-6 gap-4 border-b border-[#1D1D1D]/10 last:border-0 active:bg-[#F8F8F8] transition-colors cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-none overflow-hidden border-2 border-[#1D1D1D]/10 shrink-0 bg-[#F8F8F8]">
                  <div className="w-full h-full bg-gradient-to-br from-[#389C9A] to-[#1D1D1D] flex items-center justify-center">
                    <span className="text-white font-black text-xs">ID</span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2 mb-1">
                    <h3 className="font-black text-sm uppercase tracking-tight group-hover:italic transition-all">Conversation</h3>
                    <span className="text-[9px] text-[#1D1D1D]/40 font-bold uppercase tracking-widest shrink-0">
                      {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className="text-[11px] text-[#1D1D1D]/60 truncate leading-none font-medium italic">
                      {conv.last_message_id ? "Last message..." : "No messages yet"}
                    </p>
                    {!conv.is_active && (
                      <div className="w-2 h-2 bg-[#389C9A] rounded-none shrink-0 border border-[#1D1D1D]/10" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
