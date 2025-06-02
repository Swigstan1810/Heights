// contexts/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  kycCompleted: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [kycCompleted, setKycCompleted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
        if (session?.user) {
        checkKycStatus(session.user.id);
      }
      setLoading(false);
      console.log('[AuthProvider] getSession:', session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkKycStatus(session.user.id);
            }
      console.log('[AuthProvider] onAuthStateChange:', event, session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkKycStatus = async (userId: string) => {
    const { data, error } = await supabase
            .from('profiles')
            .select('kyc_completed')
      .eq('id', userId)
            .single();
          
    if (data) {
      setKycCompleted(data.kyc_completed || false);
        }
  };

  const signIn = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    console.log('[AuthProvider] signIn result:', result);
    return result;
  };

  const signUp = async (email: string, password: string) => {
    const result = await supabase.auth.signUp({ email, password });
    console.log('[AuthProvider] signUp result:', result);
    return result;
  };

  const signOut = async () => {
      await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      isLoading: loading,
      kycCompleted,
      signIn, 
      signUp, 
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};