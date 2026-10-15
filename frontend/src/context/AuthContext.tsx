import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface User {
  id: string;
  email?: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  resetPassword: (newPassword: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = 'idp_demo_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isDemoMode = !isSupabaseConfigured;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // In demo mode without cloud Supabase credentials, restore local demo session
      const saved = localStorage.getItem(DEMO_USER_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUser(parsed);
          setToken('mock-dev-token');
        } catch {
          localStorage.removeItem(DEMO_USER_KEY);
        }
      }
      setLoading(false);
      return;
    }

    // Live Supabase Auth session listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
        });
        setToken(session.access_token);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
        });
        setToken(session.access_token);
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) {
      // Demo authentication simulation
      const mockUser: User = {
        id: '00000000-0000-0000-0000-000000000001',
        email,
        displayName: email.split('@')[0] || 'Demo User',
      };
      setUser(mockUser);
      setToken('mock-dev-token');
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(mockUser));
      return {};
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return {};
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) {
      const mockUser: User = {
        id: '00000000-0000-0000-0000-000000000001',
        email,
        displayName: displayName || email.split('@')[0],
      };
      setUser(mockUser);
      setToken('mock-dev-token');
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(mockUser));
      return {};
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }
    return {};
  };

  const signOut = async (): Promise<void> => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setToken(null);
      localStorage.removeItem(DEMO_USER_KEY);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
  };

  const requestPasswordReset = async (email: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) {
      return {};
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      return { error: error.message };
    }
    return {};
  };

  const resetPassword = async (newPassword: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) {
      return {};
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { error: error.message };
    }
    return {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isDemoMode,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
