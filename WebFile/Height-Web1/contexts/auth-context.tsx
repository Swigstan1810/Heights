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
      setProfileError(false); // Reset error state
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') { // Not found
        // Create a new profile if missing
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
          setProfileError(true);
          return null;
        }
        
        console.log('Profile created successfully:', newProfile);
        return newProfile as Profile;
      }
      
      if (error) {
        console.error('Error fetching profile:', error);
        if (retries > 0) {
          console.log(`Retrying profile fetch... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProfile(userId, retries - 1);
        }
        setProfileError(true);
        return null;
      }
      
      return data as Profile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      if (retries > 0) {
        console.log(`Retrying profile fetch after error... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchProfile(userId, retries - 1);
      }
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
        
        console.log('Wallet balance created successfully:', newWallet);
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
    console.log('Refreshing wallet balance for user:', user.id);
    const balance = await fetchWalletBalance(user.id);
    setWalletBalance(balance);
  }, [user, fetchWalletBalance]);

  // Enhanced sign out with session cleanup
  const signOut = useCallback(async () => {
    try {
      console.log('Signing out user');
      
      // Clear session check interval
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        setSessionCheckInterval(null);
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
      // Force redirect even on error
      router.push('/login');
    }
  }, [supabase, router, sessionCheckInterval]);

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
      console.log('Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }

      if (data.session && data.user) {
        console.log('Sign in successful:', data.user.id);
        setSession(data.session);
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Fetch profile and wallet data
        const [profileData, walletData] = await Promise.all([
          fetchProfile(data.user.id),
          fetchWalletBalance(data.user.id)
        ]);
        
        setProfile(profileData);
        setWalletBalance(walletData);
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
      console.log('Attempting Google sign in');
      
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
        console.error('Google sign in error:', error);
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
      console.log('Attempting sign up for:', email);
      
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
        console.error('Sign up error:', error);
        return { error };
      }

      console.log('Sign up successful');
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

      console.log('Updating profile for user:', user.id);

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
        console.error('Update profile error:', error);
        return { error };
      }

      if (data) {
        setProfile(data as Profile);
        console.log('Profile updated successfully');
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
        console.log('Initializing auth state...');
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
          console.log('Session found for user:', session.user.id);
          setSession(session);
          setUser(session.user);
          setIsAuthenticated(true);
          
          try {
            console.log('Fetching profile and wallet data...');
            const [profileData, walletData] = await Promise.all([
              fetchProfile(session.user.id),
              fetchWalletBalance(session.user.id)
            ]);
            
            if (mounted) {
              setProfile(profileData);
              setWalletBalance(walletData);
              console.log('Profile and wallet data loaded successfully');
            }
          } catch (profileError) {
            console.error('Profile/wallet fetch error:', profileError);
            if (mounted) {
              setProfile(null);
              setWalletBalance(null);
            }
          }

          // Start session monitoring
          const interval = setInterval(() => {
            checkSession();
          }, 60000); // Check every minute
          setSessionCheckInterval(interval);
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