// contexts/auth-context.tsx - Optimized version with caching and better performance
"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  walletBalance: WalletBalance | null;
  loading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshWalletBalance: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<{ error: Error | null }>;
  clearError: () => void;
}

// Cache for profile and wallet data
const dataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    walletBalance: null,
    loading: true,
    isAuthenticated: false,
    isInitialized: false,
    error: null,
  });

  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const initializationRef = useRef(false);
  const fetchingRef = useRef<Set<string>>(new Set());

  // Update state helper
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Get cached data
  const getCachedData = useCallback((key: string) => {
    const cached = dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    dataCache.delete(key);
    return null;
  }, []);

  // Set cached data
  const setCachedData = useCallback((key: string, data: any) => {
    dataCache.set(key, { data, timestamp: Date.now() });
  }, []);

  // Profile fetcher with caching and deduplication
  const fetchProfile = useCallback(async (userId: string, forceRefresh = false): Promise<Profile | null> => {
    const cacheKey = `profile:${userId}`;
    
    // Check cache first
    if (!forceRefresh) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log('[Auth] Using cached profile data');
        return cached;
      }
    }

    // Prevent duplicate fetches
    if (fetchingRef.current.has(cacheKey)) {
      console.log('[Auth] Profile fetch already in progress');
      return null;
    }

    fetchingRef.current.add(cacheKey);

    try {
      console.log('[Auth] Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCachedData(cacheKey, data);
        return data as Profile;
      }

      // Create profile if it doesn't exist
      const currentUser = state.user;
      if (!currentUser) return null;

      const newProfileData = {
        id: userId,
        email: currentUser.email!,
        auth_provider: currentUser.app_metadata?.provider || 'email',
        google_id: currentUser.app_metadata?.provider === 'google' ? currentUser.user_metadata?.sub : null,
        google_avatar_url: currentUser.app_metadata?.provider === 'google' ? 
          (currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture) : null,
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

      if (insertError) throw insertError;

      setCachedData(cacheKey, newProfile);
      return newProfile as Profile;

    } catch (error) {
      console.error('[Auth] Error fetching profile:', error);
      return null;
    } finally {
      fetchingRef.current.delete(cacheKey);
    }
  }, [supabase, state.user, getCachedData, setCachedData]);

  // Wallet balance fetcher with caching
  const fetchWalletBalance = useCallback(async (userId: string, forceRefresh = false): Promise<WalletBalance | null> => {
    const cacheKey = `wallet:${userId}`;
    
    // Check cache first
    if (!forceRefresh) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log('[Auth] Using cached wallet data');
        return cached;
      }
    }

    // Prevent duplicate fetches
    if (fetchingRef.current.has(cacheKey)) {
      console.log('[Auth] Wallet fetch already in progress');
      return null;
    }

    fetchingRef.current.add(cacheKey);

    try {
      console.log('[Auth] Fetching wallet balance for user:', userId);
      
      const { data, error } = await supabase
        .from('wallet_balance')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
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

        if (createError) throw createError;
        setCachedData(cacheKey, newWallet);
        return newWallet as WalletBalance;
      }

      setCachedData(cacheKey, data);
      return data as WalletBalance;
    } catch (error) {
      console.error('[Auth] Error fetching wallet:', error);
      return null;
    } finally {
      fetchingRef.current.delete(cacheKey);
    }
  }, [supabase, getCachedData, setCachedData]);

  // Initialize auth state
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          // Set basic auth state immediately
          updateState({
            session,
            user: session.user,
            isAuthenticated: true,
            loading: false,
            isInitialized: true,
          });

          // Load profile and wallet asynchronously without blocking
          Promise.all([
            fetchProfile(session.user.id),
            fetchWalletBalance(session.user.id)
          ]).then(([profileData, walletData]) => {
            updateState({
              profile: profileData,
              walletBalance: walletData,
            });
          }).catch(console.error);
        } else {
          updateState({
            loading: false,
            isInitialized: true
          });
        }
      } catch (error) {
        console.error('[Auth] Initialization error:', error);
        updateState({
          error: error instanceof Error ? error.message : 'Failed to initialize',
          loading: false,
          isInitialized: true
        });
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        // Set basic auth state immediately
        updateState({
          session,
          user: session.user,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
        
        // Load additional data asynchronously
        Promise.all([
          fetchProfile(session.user.id),
          fetchWalletBalance(session.user.id)
        ]).then(([profileData, walletData]) => {
          updateState({
            profile: profileData,
            walletBalance: walletData,
          });
        }).catch(console.error);
        
      } else if (event === 'SIGNED_OUT') {
        // Clear cache on sign out
        dataCache.clear();
        fetchingRef.current.clear();
        
        updateState({
          user: null,
          session: null,
          profile: null,
          walletBalance: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        updateState({ session });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, fetchWalletBalance, updateState]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      updateState({ loading: true });
      
      // Clear cache
      dataCache.clear();
      fetchingRef.current.clear();
      
      await supabase.auth.signOut();
      
      // Clear browser storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      }

      router.push('/login');
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      updateState({ 
        error: 'Failed to sign out',
        loading: false 
      });
    }
  }, [supabase, router, updateState]);

  // Check session
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) return false;

      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      
      if (timeUntilExpiry <= 0) {
        await signOut();
        return false;
      }

      // Refresh token if expiring within 5 minutes
      if (timeUntilExpiry < 5 * 60 * 1000) {
        await refreshSession();
      }

      return true;
    } catch (error) {
      console.error('[Auth] Error checking session:', error);
      return false;
    }
  }, [supabase, signOut]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      if (session) {
        updateState({ session, user: session.user });
      }
    } catch (error) {
      console.error('[Auth] Error refreshing session:', error);
      await signOut();
    }
  }, [supabase, signOut, updateState]);

  // Refresh wallet balance
  const refreshWalletBalance = useCallback(async () => {
    if (!state.user) return;
    
    try {
      const balance = await fetchWalletBalance(state.user.id, true); // Force refresh
      updateState({ walletBalance: balance });
    } catch (error) {
      console.error('[Auth] Error refreshing wallet:', error);
    }
  }, [state.user, fetchWalletBalance, updateState]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      updateState({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session && data.user) {
        // Clear any stale cache for this user
        dataCache.delete(`profile:${data.user.id}`);
        dataCache.delete(`wallet:${data.user.id}`);
        
        updateState({
          session: data.session,
          user: data.user,
          isAuthenticated: true,
          loading: false,
        });

        // Redirect immediately, don't wait for profile/wallet
        router.push('/ai');
        
        // Load profile and wallet in background
        Promise.all([
          fetchProfile(data.user.id),
          fetchWalletBalance(data.user.id)
        ]).then(([profileData, walletData]) => {
          updateState({
            profile: profileData,
            walletBalance: walletData,
          });
        }).catch(console.error);
      }

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      console.error('[Auth] Sign in error:', errorMessage);
      updateState({ 
        error: errorMessage,
        loading: false 
      });
      return { error: error as Error };
    }
  }, [supabase, updateState, router, fetchProfile, fetchWalletBalance]);

  // Google sign in
  const signInWithGoogle = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile'
        }
      });

      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      console.error('[Auth] Google sign in error:', errorMessage);
      updateState({ 
        error: errorMessage,
        loading: false 
      });
      return { error: error as Error };
    }
  }, [supabase, updateState]);

  // Sign up
  const signUp = useCallback(async (email: string, password: string) => {
    try {
      updateState({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
          data: {
            email: email,
            auth_provider: 'email'
          }
        },
      });

      if (error) throw error;
      
      updateState({ loading: false });
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      console.error('[Auth] Sign up error:', errorMessage);
      updateState({ 
        error: errorMessage,
        loading: false 
      });
      return { error: error as Error };
    }
  }, [supabase, updateState]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    try {
      if (!state.user) {
        throw new Error('No user logged in');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', state.user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Update cache
        setCachedData(`profile:${state.user.id}`, data);
        updateState({ profile: data as Profile });
      }

      return { error: null };
    } catch (error) {
      console.error('[Auth] Update profile error:', error);
      return { error: error as Error };
    }
  }, [state.user, supabase, updateState, setCachedData]);

  // Resend verification email
  const resendVerificationEmail = useCallback(async () => {
    try {
      if (!state.user?.email) {
        throw new Error('No email address found');
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: state.user.email,
      });

      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('[Auth] Resend verification error:', error);
      return { error: error as Error };
    }
  }, [state.user, supabase]);

  const value = {
    ...state,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    updateProfile,
    refreshWalletBalance,
    refreshSession,
    checkSession,
    resendVerificationEmail,
    clearError,
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