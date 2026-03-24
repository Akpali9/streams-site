import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Paperclip, Send } from "lucide-react";
import { BottomNav } from "../components/bottom-nav";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useRealtimeMessages, useUserPresence } from "../lib/useRealtimeHooks";
import { TypingIndicator } from "../components/TypingIndicator";
import { supabase } from "../lib/supabase";

export function MessageThread() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  // Get realtime messages
  const { messages, addMessage } = useRealtimeMessages(id || "");
  const { updateTypingStatus } = useUserPresence(currentUserId || "");
  
  // Get current user
  useEffect(() => {
    const { data: { user } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });
  }, []);

  // Subscribe to typing status updates
  useEffect(() => {
    if (!id) return;
    
    const channel = supabase
      .channel(`typing:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_presence',
          filter: `typing_in_conversation_id=eq.${id}`,
        },
        (payload) => {
          const presence = payload.new;
          if (presence.is_typing && presence.user_id !== currentUserId) {
            setTypingUsers(prev => new Set(prev).add(presence.user_id));
            
            // Clear typing indicator after 3 seconds
            setTimeout(() => {
              setTypingUsers(prev => {
                const next = new Set(prev);
                next.delete(presence.user_id);
                return next;
              });
            }, 3000);
          }
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [id, currentUserId]);
  
  const business = {
    name: "CloudSaaS",
    campaign: "Spring Property Showcase",
    logo: "https://images.unsplash.com/photo-1644088379091-d574269d422f?w=100&h=100&fit=crop"
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentUserId || !id) return;

    try {
      // Clear typing indicator
      await updateTypingStatus(false, id);

      // Send message
      await addMessage({
        conversation_id: id,
        sender_id: currentUserId,
        recipient_id: "placeholder", // Will be filled by business logic
        content: inputText,
        is_read: false,
      });

      setInputText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleTyping = async () => {
    if (!id || !currentUserId) return;
    await updateTypingStatus(true, id);
  };

  return (
    <div className="flex flex-col h-screen bg-white text-[#1D1D1D]">
      {/* Top Thread Bar */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-14 bg-[#1D1D1D] flex items-center px-4 z-50">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        
        <div className="flex-1 flex items-center gap-3 ml-2">
          <div className="w-8 h-8 rounded-none overflow-hidden border border-white/20 bg-white/10 shrink-0">
            <ImageWithFallback src={business.logo} className="w-full h-full object-cover grayscale" />
          </div>
          <div className="flex flex-col leading-none">
            <h3 className="text-[14px] font-black uppercase tracking-tight text-white">{business.name}</h3>
            <span className="text-[9px] font-bold text-white/60 truncate max-w-[150px] uppercase tracking-widest italic">{business.campaign}</span>
          </div>
        </div>
        
        <button className="text-[10px] font-black uppercase tracking-widest text-white underline italic">
          View Gig
        </button>
      </div>

      {/* Messages Area */}
      <main className="flex-1 pt-14 pb-[120px] overflow-y-auto px-4 flex flex-col">
        <div className="mt-6 mb-8 text-center">
          <div className="inline-block px-4 py-2 bg-[#1D1D1D]/5 rounded-none border border-[#1D1D1D]/5">
            <p className="text-[10px] font-bold italic text-[#1D1D1D]/40 uppercase tracking-tight">
              Campaign accepted 20 Feb 2026 · Use this thread to coordinate your partnership.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex flex-col ${msg.sender_id === currentUserId ? "items-end" : "items-start"}`}
            >
              <div 
                className={`max-w-[75%] p-4 rounded-none text-[13px] leading-relaxed font-medium italic border-2 ${
                  msg.sender_id === currentUserId
                    ? "bg-[#1D1D1D] text-white border-[#1D1D1D]" 
                    : "bg-[#F8F8F8] text-[#1D1D1D] border-[#1D1D1D]/10"
                }`}
              >
                {msg.content}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[9px] font-bold text-[#1D1D1D]/30 uppercase tracking-widest italic">
                  {new Date(msg.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.sender_id === currentUserId && msg.is_read && (
                  <span className="text-[9px] font-black text-[#389C9A] uppercase tracking-widest italic">Seen</span>
                )}
              </div>
            </div>
          ))}
          {typingUsers.size > 0 && <TypingIndicator isVisible={true} userName="Someone" />}
        </div>
      </main>

      {/* Input Bar */}
      <div className="fixed bottom-[60px] left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[60px] bg-white border-t border-[#1D1D1D]/10 px-4 flex items-center gap-3 z-50">
        <button className="p-2 text-[#1D1D1D]/40 hover:text-[#1D1D1D] transition-colors">
          <Paperclip className="w-5 h-5 text-[#389C9A]" />
        </button>
        
        <div className="flex-1 bg-[#F8F8F8] h-10 rounded-none flex items-center px-4 border border-[#1D1D1D]/10">
          <input 
            type="text" 
            placeholder="Type a message..."
            className="w-full bg-transparent text-xs font-bold uppercase outline-none italic placeholder:text-[#1D1D1D]/20"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
        </div>
        
        <button 
          onClick={handleSendMessage}
          className={`w-10 h-10 rounded-none flex items-center justify-center transition-all ${
            inputText.trim() 
              ? "bg-[#1D1D1D] text-white scale-100" 
              : "bg-[#1D1D1D]/5 text-[#1D1D1D]/30 scale-95"
          }`}
        >
          <Send className="w-4 h-4 fill-current text-[#FEDB71]" />
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
