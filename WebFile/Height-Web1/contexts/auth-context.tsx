"use client";

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { 
  User, 
  Session, 
  AuthChangeEvent 
} from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ 
    error: any; 
    data: any;
  }>;
  signIn: (email: string, password: string) => Promise<{
    error: any;
    data: any;
  }>;
  signOut: () => Promise<void>;
  kycCompleted: boolean;
  setKycCompleted: (completed: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kycCompleted, setKycCompleted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check KYC status if user is logged in
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('kyc_completed')
          .eq('id', session.user.id)
          .single();
        
        setKycCompleted(profile?.kyc_completed || false);
      }
      
      setIsLoading(false);
    };

    getSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Check KYC status on auth change
        if (currentSession?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('kyc_completed')
            .eq('id', currentSession.user.id)
            .single();
          
          setKycCompleted(profile?.kyc_completed || false);
        } else {
          setKycCompleted(false);
        }
        
        setIsLoading(false);
        
        // Force refresh to update UI based on auth state
        router.refresh();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Sign up function
  const signUp = async (email: string, password: string) => {
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    // If successful registration, create a profile record
    if (response.data.user) {
      await supabase.from('profiles').insert({
        id: response.data.user.id,
        email: email,
        created_at: new Date().toISOString(),
        kyc_completed: false
      });
    }
    
    return response;
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    kycCompleted,
    setKycCompleted
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};