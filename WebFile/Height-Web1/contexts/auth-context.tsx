// Updated auth-context.tsx with better error handling and session management
"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Session } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  google_avatar_url: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  location: string | null;
  website: string | null;
  timezone: string | null;
  auth_provider: string;
  google_id: string | null;
  email_verified: boolean;
  kyc_completed: boolean;
  two_factor_enabled: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

interface WalletBalance {
  id: string;
  user_id: string;
  balance: number;
  locked_balance: number;
  currency: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  walletBalance: WalletBalance | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshWalletBalance: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<{ error: Error | null }>;
  profileError: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionCheckInterval, setSessionCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  // Fetch user profile with retry logic and auto-create if missing
  const fetchProfile = useCallback(async (userId: string, retries = 3): Promise<Profile | null> => {
    try {
      setProfileError(false);
      
      // First try to get the profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single
      
      if (data) {
        return data as Profile;
      }
      
      // If no profile exists, create one
      if (!data && !error) {
        const currentUser = user || session?.user;
        if (!currentUser) return null;
        
        console.log('Creating new profile for user:', userId);
        
        const newProfileData = {
          id: userId,
          email: currentUser.email!,
          auth_provider: currentUser.app_metadata?.provider || 'email',
          google_id: currentUser.app_metadata?.provider === 'google' ? currentUser.user_metadata?.sub : null,
          google_avatar_url: currentUser.app_metadata?.provider === 'google' ? currentUser.user_metadata?.avatar_url : null,
          full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || null,
          email_verified: currentUser.email_confirmed_at ? true : false,
          kyc_completed: false,
          two_factor_enabled: false,
          timezone: 'Asia/Kolkata'
        };

        // Insert the profile
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert(newProfileData)
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
          if (retries > 0) {
            console.log(`Retrying profile creation... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchProfile(userId, retries - 1);
          }
          return null;
        }
        
        return newProfile as Profile;
      }
      
      if (error) {
        console.error('Error fetching profile:', error);
        if (retries > 0) {
          console.log(`Retrying profile fetch... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProfile(userId, retries - 1);
        }
        return null;
      }
      
      return null;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      if (retries > 0) {
        console.log(`Retrying profile fetch after error... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchProfile(userId, retries - 1);
      }
      return null;
    }
  }, [supabase, user, session]);

  // Fetch wallet balance with better error handling
  const fetchWalletBalance = useCallback(async (userId: string): Promise<WalletBalance | null> => {
    try {
      const { data, error } = await supabase
        .from('wallet_balance')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching wallet balance:', error);
        return null;
      }

      if (!data) {
        // Create wallet balance if not exists
        console.log('Creating wallet balance for user:', userId);
        
        const { data: newWallet, error: createError } = await supabase
          .from('wallet_balance')
          .insert({
            user_id: userId,
            balance: 0,
            locked_balance: 0,
            currency: 'INR'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating wallet balance:', createError);
          return null;
        }
        
        return newWallet as WalletBalance;
      }

      return data as WalletBalance;
    } catch (error) {
      console.error('Error in fetchWalletBalance:', error);
      return null;
    }
  }, [supabase]);

  // Initialize auth state with proper error boundaries
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setSession(null);
          setUser(null);
          setProfile(null);
          setWalletBalance(null);
          setIsAuthenticated(false);
        } else if (session?.user) {
          console.log('Session found for user:', session.user.id);
          setSession(session);
          setUser(session.user);
          setIsAuthenticated(true);
          
          // Fetch profile and wallet data in background
          Promise.all([
            fetchProfile(session.user.id),
            fetchWalletBalance(session.user.id)
          ]).then(([profileData, walletData]) => {
            if (mounted) {
              setProfile(profileData);
              setWalletBalance(walletData);
            }
          }).catch(error => {
            console.error('Error loading user data:', error);
          });
        } else {
          console.log('No session found');
          setSession(null);
          setUser(null);
          setProfile(null);
          setWalletBalance(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setWalletBalance(null);
        setIsAuthenticated(false);
      } finally {
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
          console.log('Auth initialization complete');
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user.id);
        setSession(session);
        setUser(session.user);
        setIsAuthenticated(true);
        
        // Load user data
        const [profileData, walletData] = await Promise.all([
          fetchProfile(session.user.id),
          fetchWalletBalance(session.user.id)
        ]);
        
        setProfile(profileData);
        setWalletBalance(walletData);
        
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        if (sessionCheckInterval) {
          clearInterval(sessionCheckInterval);
          setSessionCheckInterval(null);
        }
        setSession(null);
        setUser(null);
        setProfile(null);
        setWalletBalance(null);
        setIsAuthenticated(false);
        setProfileError(false);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session);
        console.log('Token refreshed successfully');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, [supabase, fetchProfile, fetchWalletBalance]);

  // Enhanced sign out
  const signOut = useCallback(async () => {
    try {
      console.log('Signing out user');
      
      // Clear session check interval
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        setSessionCheckInterval(null);
      }

      await supabase.auth.signOut();

      // Clear all state
      setSession(null);
      setUser(null);
      setProfile(null);
      setWalletBalance(null);
      setIsAuthenticated(false);
      setProfileError(false);

      // Clear any stored session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      }

      console.log('Redirecting to login page');
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      router.push('/login');
    }
  }, [supabase, router, sessionCheckInterval]);

  // Session management functions
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return false;
      }

      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      
      if (timeUntilExpiry <= 0) {
        console.log('Session expired');
        await signOut();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  }, [supabase, signOut]);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        await signOut();
        return;
      }

      if (session) {
        setSession(session);
        setUser(session.user);
        console.log('Session refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      await signOut();
    }
  }, [supabase, signOut]);

  const refreshWalletBalance = useCallback(async () => {
    if (!user) return;
    console.log('Refreshing wallet balance for user:', user.id);
    const balance = await fetchWalletBalance(user.id);
    setWalletBalance(balance);
  }, [user, fetchWalletBalance]);

  // Authentication methods
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Load user data in background
        Promise.all([
          fetchProfile(data.user.id),
          fetchWalletBalance(data.user.id)
        ]).then(([profileData, walletData]) => {
          setProfile(profileData);
          setWalletBalance(walletData);
        });
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [supabase, fetchProfile, fetchWalletBalance]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile'
        }
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }, [supabase]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            email: email,
            auth_provider: 'email'
          }
        },
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }, [supabase]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') };
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { error };
      }

      if (data) {
        setProfile(data as Profile);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [user, supabase]);

  const resendVerificationEmail = useCallback(async () => {
    try {
      if (!user?.email) {
        return { error: new Error('No email address found') };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }, [user, supabase]);

  const value = {
    user,
    session,
    profile,
    walletBalance,
    loading: loading || !isInitialized,
    isAuthenticated,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    updateProfile,
    refreshWalletBalance,
    refreshSession,
    checkSession,
    resendVerificationEmail,
    profileError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}