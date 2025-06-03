
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthUser extends User {
  channelName?: string;
  isLive?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, channelName: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Fetch user profile to get channel info
          const { data: profile } = await supabase
            .from('profiles')
            .select('channel_name')
            .eq('id', session.user.id)
            .single();
            
          // Check if user has a live stream
          const { data: channels } = await supabase
            .from('channels')
            .select('is_live')
            .eq('user_id', session.user.id)
            .single();
            
          const authUser: AuthUser = {
            ...session.user,
            channelName: profile?.channel_name || `${session.user.email?.split('@')[0]}'s Channel`,
            isLive: channels?.is_live || false
          };
          
          setUser(authUser);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Trigger the auth state change handler
        return;
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error:', error);
        setIsLoading(false);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (email: string, password: string, channelName: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            channel_name: channelName
          }
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        setIsLoading(false);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
