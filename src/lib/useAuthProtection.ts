import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from './supabase';

export function useAuthProtection(requiredType?: 'creator' | 'business') {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<'creator' | 'business' | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session || error) {
        setIsAuthenticated(false);
        setUserType(null);
        setLoading(false);
        navigate('/login/portal');
        return;
      }

      // Get user from users table to check type
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (userError || !userData) {
        setIsAuthenticated(false);
        setUserType(null);
        setLoading(false);
        navigate('/login/portal');
        return;
      }

      const type = userData.user_type as 'creator' | 'business';

      // Check if user type matches required type
      if (requiredType && type !== requiredType) {
        setIsAuthenticated(false);
        setLoading(false);
        navigate(type === 'business' ? '/business/dashboard' : '/dashboard');
        return;
      }

      setUser(session.user);
      setUserType(type);
      setIsAuthenticated(true);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        setUserType(null);
        navigate('/login/portal');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate, requiredType]);

  return { isAuthenticated, userType, loading, user };
}
