import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Zap, Shield, BadgePoundSterling, ArrowRight, Play, Building2, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";

export function Home() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'creator' | 'business' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsAuthenticated(true);
        // Get user type
        const { data } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', session.user.id)
          .single();
        
        if (data) {
          setUserType(data.user_type as 'creator' | 'business');
        }
      }
    };

    checkAuth();

    // Auto-redirect if already logged in
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && event === 'SIGNED_IN') {
        const { data } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', session.user.id)
          .single();
        
        if (data) {
          navigate(data.user_type === 'business' ? '/business/dashboard' : '/dashboard');
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white via-[#F8F8F8] to-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#1D1D1D]/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-6 h-6 bg-[#1D1D1D] flex items-center justify-center text-white text-[9px] font-black italic">LL</div>
            <span className="text-lg font-black uppercase tracking-tighter italic text-[#1D1D1D]">LiveLink</span>
          </motion.div>
          
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => navigate(userType === 'business' ? '/business/dashboard' : '/dashboard')}
                className="px-4 py-2 bg-[#1D1D1D] text-white text-xs font-black uppercase italic"
              >
                Go to Dashboard
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2"
              >
                <Link to="/login/portal" className="px-4 py-2 text-[#1D1D1D] text-xs font-black uppercase italic border border-[#1D1D1D]/20 hover:border-[#1D1D1D]/50 transition-colors">
                  Sign In
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#389C9A]/10 border border-[#389C9A]/30 rounded-full mb-8"
        >
          <span className="w-2 h-2 bg-[#389C9A] rounded-full animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-[#389C9A] italic">
            Powered by creators, built for brands
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl leading-[1.1] font-black uppercase tracking-tighter mb-6 text-center text-[#1D1D1D]"
        >
          Stream.<br />
          Earn.<br />
          <span className="bg-gradient-to-r from-[#389C9A] to-[#1D1D1D] bg-clip-text text-transparent">
            Connect.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[#1D1D1D]/70 text-lg md:text-xl mb-12 max-w-[500px] font-medium leading-relaxed italic text-center"
        >
          The premier platform connecting livestream creators with brands for premium in-stream advertising partnerships.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-3 w-full sm:max-w-md"
        >
          <Link 
            to="/login/portal" 
            className="group flex items-center justify-between bg-[#1D1D1D] text-white px-6 py-4 font-black uppercase tracking-tight transition-all active:scale-[0.98] hover:shadow-lg italic"
          >
            <span className="flex items-center gap-2">
              <span>Sign In</span>
            </span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1 text-[#FEDB71]" />
          </Link>
          
          <Link 
            to="/become-creator" 
            className="group flex items-center justify-between border-2 border-[#1D1D1D] text-[#1D1D1D] px-6 py-4 font-black uppercase tracking-tight transition-all active:scale-[0.98] hover:bg-[#1D1D1D] hover:text-white italic"
          >
            <span className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Join as Creator
            </span>
            <ArrowRight className="w-5 h-5 text-[#389C9A]" />
          </Link>

          <Link 
            to="/become-business" 
            className="flex items-center justify-between border-2 border-[#1D1D1D] text-[#1D1D1D] px-6 py-4 font-black uppercase tracking-tight transition-all active:scale-[0.98] hover:bg-[#1D1D1D] hover:text-white italic"
          >
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Join as Business
            </span>
            <ArrowRight className="w-5 h-5 text-[#389C9A]" />
          </Link>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="bg-[#1D1D1D] text-white px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-3xl font-black uppercase tracking-tighter mb-12 italic"
          >
            Why LiveLink?
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Real-time", desc: "Live updates and instant messaging" },
              { icon: Shield, title: "Secure", desc: "Safe payments and verified creators" },
              { icon: Users, title: "Community", desc: "Network with creators and brands" }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col gap-3"
              >
                <feature.icon className="w-8 h-8 text-[#FEDB71]" />
                <h3 className="font-black uppercase italic text-lg">{feature.title}</h3>
                <p className="text-[#1D1D1D]/60 text-sm font-medium italic">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-[#1D1D1D]/10 px-6 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#1D1D1D]/40 text-xs font-bold uppercase tracking-widest italic">
            © 2024 LiveLink. Premium In-Stream Advertising Platform.
          </p>
        </div>
      </div>
    </div>
  );
}

export function HomeOld() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-start justify-center px-8 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-[#1D1D1D] text-white text-[10px] font-bold uppercase tracking-widest mb-8 italic"
        >
          <span className="w-1.5 h-1.5 bg-[#FEDB71] rounded-none animate-pulse" />
          Live Now
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[48px] leading-[0.9] font-black uppercase tracking-tighter mb-8 text-[#1D1D1D]"
        >
          Stream.<br />
          Earn.<br />
          Connect.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[#1D1D1D]/70 text-lg mb-12 max-w-[300px] font-medium leading-tight italic"
        >
          Premium in-stream banner advertising for creators and growing businesses.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-4 w-full"
        >
          <Link 
            to="/login/portal" 
            className="flex items-center justify-between border-2 border-[#1D1D1D] text-[#1D1D1D] p-6 font-black uppercase tracking-tight transition-all active:scale-[0.98] hover:bg-[#1D1D1D] hover:text-white italic"
          >
            Sign In
            <ArrowRight className="w-5 h-5 text-[#389C9A]" />
          </Link>
          <Link 
            to="/become-creator" 
            className="group flex items-center justify-between bg-[#1D1D1D] text-white p-6 font-black uppercase tracking-tight transition-all active:scale-[0.98] italic"
          >
            Become a Creator
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1 text-[#389C9A]" />
          </Link>
          <Link 
            to="/become-business" 
            className="flex items-center justify-between border-2 border-[#1D1D1D] text-[#1D1D1D] p-6 font-black uppercase tracking-tight transition-all active:scale-[0.98] hover:bg-[#1D1D1D] hover:text-white italic"
          >
            Register Business
            <ArrowRight className="w-5 h-5 text-[#389C9A]" />
          </Link>
          <Link 
            to="/browse-businesses" 
            className="flex items-center justify-between border-2 border-[#1D1D1D] text-[#1D1D1D] p-6 font-black uppercase tracking-tight transition-all active:scale-[0.98] hover:bg-[#1D1D1D] hover:text-white italic"
          >
            Find Brands
            <ArrowRight className="w-5 h-5 text-[#389C9A]" />
          </Link>
          <Link 
            to="/browse" 
            className="flex items-center justify-between border-2 border-[#1D1D1D] text-[#1D1D1D] p-6 font-black uppercase tracking-tight transition-all active:scale-[0.98] hover:bg-[#1D1D1D] hover:text-white italic"
          >
            Find Creators
            <ArrowRight className="w-5 h-5 text-[#389C9A]" />
          </Link>
        </motion.div>
      </div>

      {/* Trust Bar */}
      <div className="px-8 pb-12">
        <div className="h-[1px] bg-[#1D1D1D]/10 mb-8" />
        <div className="grid grid-cols-3 gap-8">
          <div className="flex flex-col gap-2">
            <Zap className="w-5 h-5 text-[#389C9A]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1D1D1D]/40 leading-none italic">Fast Matching</span>
          </div>
          <div className="flex flex-col gap-2">
            <Shield className="w-5 h-5 text-[#389C9A]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1D1D1D]/40 leading-none italic">Verified</span>
          </div>
          <div className="flex flex-col gap-2">
            <BadgePoundSterling className="w-5 h-5 text-[#389C9A]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1D1D1D]/40 leading-none italic">Instant Payout</span>
          </div>
        </div>
      </div>

      {/* Marquee Branding */}
      <div className="py-6 border-t border-[#1D1D1D] overflow-hidden bg-[#1D1D1D] text-white">
        <motion.div 
          animate={{ x: [0, -400] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex gap-12 items-center whitespace-nowrap"
        >
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-xl font-black uppercase italic tracking-tighter">LiveLink // <span className="text-[#389C9A]">Connect</span> // <span className="text-[#FEDB71]">Earn</span></span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
