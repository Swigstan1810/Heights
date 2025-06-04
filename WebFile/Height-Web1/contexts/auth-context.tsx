// contexts/auth-context.tsx
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

// Security configuration
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionCheckInterval, setSessionCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [profileError, setProfileError] = useState(false);
  
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  // Fetch user profile with retry logic and auto-create if missing
  const fetchProfile = useCallback(async (userId: string, retries = 3): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') { // Not found
        // Create a new profile if missing
        const currentUser = user || session?.user;
        if (!currentUser) return null;

        const newProfileData = {
          id: userId,
          email: currentUser.email!,
          auth_provider: currentUser.app_metadata?.provider || 'email',
          google_id: currentUser.app_metadata?.provider === 'google' ? currentUser.user_metadata?.sub : null,
          google_avatar_url: currentUser.app_metadata?.provider === 'google' ? currentUser.user_metadata?.avatar_url : null,
          full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || null,
          email_verified: currentUser.email_confirmed_at ? true : false,
        };

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert(newProfileData)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          setProfileError(true);
          return null;
        }
        return newProfile as Profile;
      }
      
      if (error) {
        if (retries > 0) {
          console.log(`Retrying profile fetch... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProfile(userId, retries - 1);
        }
        console.error('Error fetching profile:', error);
        setProfileError(true);
        return null;
      }
      
      return data as Profile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfileError(true);
      return null;
    }
  }, [supabase, user, session]);

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async (userId: string): Promise<WalletBalance | null> => {
    try {
      const { data: existingWallet, error: checkError } = await supabase
        .from('wallet_balance')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // Create wallet balance if not exists
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

      if (checkError) {
        console.error('Error fetching wallet balance:', checkError);
        return null;
      }

      return existingWallet as WalletBalance;
    } catch (error) {
      console.error('Error in fetchWalletBalance:', error);
      return null;
    }
  }, [supabase]);

  // Refresh wallet balance
  const refreshWalletBalance = useCallback(async () => {
    if (!user) return;
    const balance = await fetchWalletBalance(user.id);
    setWalletBalance(balance);
  }, [user, fetchWalletBalance]);

  // Enhanced sign out with session cleanup
  const signOut = useCallback(async () => {
    try {
      // Clear session check interval
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        setSessionCheckInterval(null);
      }

      // Log security event before signing out
      if (user) {
        try {
          await supabase.rpc('log_security_event', {
            p_user_id: user.id,
            p_event_type: 'logout',
            p_event_details: { method: 'manual' },
            p_ip_address: window.location.hostname,
            p_user_agent: navigator.userAgent
          });
        } catch (err) {
          console.warn('Failed to log security event:', err);
        }
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        // Force local cleanup even if server error
      }

      // Clear all state
      setSession(null);
      setUser(null);
      setProfile(null);
      setWalletBalance(null);
      setIsAuthenticated(false);

      // Clear any stored session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      }

      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect even on error
      router.push('/login');
    }
  }, [user, supabase, router, sessionCheckInterval]);

  // Check session validity with enhanced security
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        return false;
      }

      if (!session) {
        return false;
      }

      // Check if session is expired
      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      
      if (timeUntilExpiry <= 0) {
        console.log('Session expired');
        await signOut();
        return false;
      }

      // Refresh if close to expiry
      if (timeUntilExpiry <= REFRESH_THRESHOLD) {
        console.log('Session expiring soon, refreshing...');
        await refreshSession();
      }

      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  }, [supabase, signOut]);

  // Refresh session with retry logic
  const refreshSession = useCallback(async (retries = 3) => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        if (retries > 0 && error.message.includes('refresh_token')) {
          console.log(`Retrying session refresh... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return refreshSession(retries - 1);
        }
        console.error('Session refresh error:', error);
        await signOut();
        return;
      }

      if (session) {
        setSession(session);
        setUser(session.user);
        console.log('Session refreshed successfully');

        // Log security event
        try {
          await supabase.rpc('log_security_event', {
            p_user_id: session.user.id,
            p_event_type: 'session_refresh',
            p_event_details: { automatic: true },
            p_ip_address: window.location.hostname,
            p_user_agent: navigator.userAgent
          });
        } catch (err) {
          console.warn('Failed to log session refresh event:', err);
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      if (retries > 0) {
        return refreshSession(retries - 1);
      }
      await signOut();
    }
  }, [supabase, signOut]);

  // Sign in with email/password
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
        
        const profileData = await fetchProfile(data.user.id);
        if (profileData) {
          setProfile(profileData);
        }
        
        const walletData = await fetchWalletBalance(data.user.id);
        setWalletBalance(walletData);

        // Update last login
        try {
          await supabase.rpc('update_last_login', {
            p_user_id: data.user.id
          });
        } catch (err) {
          console.warn('Failed to update last login:', err);
        }

        // Log successful login
        try {
          await supabase.rpc('log_security_event', {
            p_user_id: data.user.id,
            p_event_type: 'login_success',
            p_event_details: { method: 'password' },
            p_ip_address: window.location.hostname,
            p_user_agent: navigator.userAgent
          });
        } catch (err) {
          console.warn('Failed to log login event:', err);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  }, [supabase, fetchProfile, fetchWalletBalance]);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    try {
      // Check rate limiting first
      const canProceed = await supabase.rpc('check_oauth_rate_limit', {
        p_identifier: window.location.hostname,
        p_provider: 'google'
      });

      if (!canProceed) {
        return { 
          error: new Error('Too many authentication attempts. Please try again later.') 
        };
      }

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

      if (error) {
        // Log failed attempt
        try {
          await supabase.rpc('log_security_event', {
            p_user_id: null,
            p_event_type: 'oauth_login_failed',
            p_event_details: { 
              provider: 'google',
              error: error.message 
            },
            p_ip_address: window.location.hostname,
            p_user_agent: navigator.userAgent
          });
        } catch (err) {
          console.warn('Failed to log oauth error:', err);
        }
        return { error };
      }

      // OAuth will redirect, so no need to handle success here
      return { error: null };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { error: error as Error };
    }
  }, [supabase]);

  // Sign up with email/password
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

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error };
    }
  }, [supabase]);

  // Update profile
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
      console.error('Update profile error:', error);
      return { error: error as Error };
    }
  }, [user, supabase]);

  // Resend verification email
  const resendVerificationEmail = useCallback(async () => {
    try {
      if (!user?.email) {
        return { error: new Error('No email address found') };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { error: error as Error };
    }
  }, [user, supabase]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setSession(null);
          setUser(null);
          setProfile(null);
          setWalletBalance(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setSession(session);
          setUser(session.user);
          setIsAuthenticated(true);
          
          try {
            const [profileData, walletData] = await Promise.all([
              fetchProfile(session.user.id),
              fetchWalletBalance(session.user.id)
            ]);
            
            if (mounted) {
              setProfile(profileData);
              setWalletBalance(walletData);
            }
          } catch (profileError) {
            console.error('Profile/wallet fetch error:', profileError);
            setProfile(null);
            setWalletBalance(null);
          }

          // Start session monitoring
          const interval = setInterval(() => {
            checkSession();
          }, 60000); // Check every minute
          setSessionCheckInterval(interval);
        } else {
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
        setSession(session);
        setUser(session.user);
        setIsAuthenticated(true);
        
        const [profileData, walletData] = await Promise.all([
          fetchProfile(session.user.id),
          fetchWalletBalance(session.user.id)
        ]);
        
        setProfile(profileData);
        setWalletBalance(walletData);

        // Log security event based on provider
        const provider = session.user.app_metadata.provider || 'email';
        try {
          await supabase.rpc('log_security_event', {
            p_user_id: session.user.id,
            p_event_type: 'login_success',
            p_event_details: { 
              method: provider,
              provider: provider 
            },
            p_ip_address: window.location.hostname,
            p_user_agent: navigator.userAgent
          });
        } catch (err) {
          console.warn('Failed to log auth state change:', err);
        }
        
      } else if (event === 'SIGNED_OUT') {
        if (sessionCheckInterval) {
          clearInterval(sessionCheckInterval);
          setSessionCheckInterval(null);
        }
        setSession(null);
        setUser(null);
        setProfile(null);
        setWalletBalance(null);
        setIsAuthenticated(false);
        router.push('/login');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session);
        console.log('Token refreshed successfully');
      } else if (event === 'USER_UPDATED' && session) {
        setUser(session.user);
        const profileData = await fetchProfile(session.user.id);
        if (profileData) {
          setProfile(profileData);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, [supabase, router, fetchProfile, fetchWalletBalance, checkSession]);

  const value = {
    user,
    session,
    profile,
    walletBalance,
    loading,
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