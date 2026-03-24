import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { 
  MessageSquare, 
  Bell, 
  User, 
  ArrowLeft,
  X,
  Settings,
  LogOut,
  ChevronDown,
  Home,
  LineChart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  backPath?: string;
  showLogo?: boolean;
  userType?: "creator" | "business";
  subtitle?: string;
}

export function AppHeader({ 
  title, 
  showBack = false, 
  backPath, 
  showLogo = false,
  userType = "creator",
  subtitle
}: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userName, setUserName] = useState(userType === "business" ? "Business" : "Creator");
  const [userEmail, setUserEmail] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const profilePath = userType === "business" ? "/business/profile" : "/profile/me";

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        const { data: userData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (userData?.full_name) {
          setUserName(userData.full_name);
        }
      }
    };
    fetchUser();
  }, []);

  const isHome = location.pathname === "/";
  const isMessages = location.pathname.startsWith("/messages");
  const showActions = !isHome && !isMessages;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="px-5 pt-10 pb-4 border-b border-[#1D1D1D]/10 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {showBack && (
            <button 
              onClick={() => backPath ? navigate(backPath) : navigate(-1)} 
              className="p-2 -ml-2 hover:bg-[#1D1D1D]/5 active:bg-[#1D1D1D]/10 transition-colors rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-[#1D1D1D]" />
            </button>
          )}
          
          {showLogo && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col cursor-pointer" 
              onClick={() => navigate(userType === 'business' ? '/business/dashboard' : '/dashboard')}
            >
              <h1 className="text-lg font-black uppercase tracking-tighter italic leading-none flex items-center gap-2">
                <div className="w-5 h-5 bg-[#1D1D1D] flex items-center justify-center text-white text-[7px] font-black italic">LL</div>
                LiveLink
              </h1>
              {subtitle && <span className="text-[7px] font-bold uppercase tracking-[0.3em] opacity-40 mt-0.5">{subtitle}</span>}
            </motion.div>
          )}

          {title && !showLogo && (
            <h1 className="text-lg font-black uppercase tracking-tighter italic text-[#1D1D1D]">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showActions && (
            <>
              <Link 
                to={userType === 'business' ? "/messages?role=business" : "/messages?role=creator"} 
                className="relative p-2.5 hover:bg-[#1D1D1D]/5 active:bg-[#1D1D1D]/10 transition-colors rounded-lg"
              >
                <MessageSquare className="w-5 h-5 text-[#1D1D1D]" />
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#389C9A] rounded-full" 
                />
              </Link>
              
              <Link 
                to={userType === 'business' ? "/notifications?role=business" : "/notifications?role=creator"} 
                className="relative p-2.5 hover:bg-[#1D1D1D]/5 active:bg-[#1D1D1D]/10 transition-colors rounded-lg"
              >
                <Bell className="w-5 h-5 text-[#1D1D1D]" />
                {unreadCount > 0 && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-[#FEDB71] text-[#1D1D1D] text-[7px] font-black flex items-center justify-center rounded-full border border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </Link>
            </>
          )}

          <div className="relative ml-2">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)} 
              className="w-9 h-9 border border-[#1D1D1D]/20 hover:border-[#1D1D1D] rounded-lg flex items-center justify-center bg-white active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <User className="w-4 h-4 text-[#1D1D1D]" />
              <ChevronDown className={`w-3 h-3 text-[#1D1D1D] transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showProfileMenu && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 8, scale: 0.95 }} 
                    className="absolute right-0 mt-2 w-56 bg-white border border-[#1D1D1D]/10 rounded-lg shadow-lg z-50"
                  >
                    <div className="p-4 border-b border-[#1D1D1D]/10 bg-gradient-to-r from-[#1D1D1D]/5 to-transparent">
                      <p className="text-[8px] font-black uppercase tracking-widest text-[#1D1D1D]/40 mb-1.5 italic">Account</p>
                      <p className="text-[11px] font-black uppercase tracking-tight text-[#1D1D1D] mb-0.5">{userName}</p>
                      <p className="text-[8px] font-medium text-[#1D1D1D]/50 truncate">{userEmail}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <button 
                        onClick={() => {
                          navigate(userType === 'business' ? '/business/profile' : '/profile/me');
                          setShowProfileMenu(false);
                        }} 
                        className="w-full text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-[#1D1D1D]/5 flex items-center gap-2.5 transition-colors italic rounded"
                      >
                        <User className="w-4 h-4 text-[#389C9A]" /> 
                        {userType === 'business' ? 'Business Profile' : 'My Profile'}
                      </button>
                      <button 
                        onClick={() => {
                          navigate(userType === 'business' ? '/business/settings' : '/settings');
                          setShowProfileMenu(false);
                        }} 
                        className="w-full text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-[#1D1D1D]/5 flex items-center gap-2.5 transition-colors italic rounded"
                      >
                        <Settings className="w-4 h-4 text-[#389C9A]" /> 
                        Settings
                      </button>
                    </div>
                    <div className="border-t border-[#1D1D1D]/10 p-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest hover:bg-red-50 text-red-600 flex items-center gap-2.5 transition-colors italic rounded"
                      >
                        <LogOut className="w-4 h-4" /> 
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
