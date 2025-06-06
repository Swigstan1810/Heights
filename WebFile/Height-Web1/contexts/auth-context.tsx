// contexts/auth-context.tsx - Updated to redirect to home instead of dashboard
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
  profileError: string | null;
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
  retryProfileLoad: () => Promise<void>;
}

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
    profileError: null
  });

  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const initializationRef = useRef(false);
  const profileFetchRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update state helper
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    updateState({ error: null, profileError: null });
  }, [updateState]);

  // Enhanced profile fetcher with exponential backoff retry
  const fetchProfile = useCallback(async (userId: string, retries = 3, delay = 1000): Promise<Profile | null> => {
    if (profileFetchRef.current) return null;
    profileFetchRef.current = true;

    try {
      console.log(`[Auth] Fetching profile for user: ${userId}, attempt: ${4 - retries}`);
      
      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('[Auth] Profile fetch error:', fetchError);
        throw fetchError;
      }

      if (existingProfile) {
        console.log('[Auth] Profile found:', existingProfile.email);
        updateState({ profileError: null });
        return existingProfile as Profile;
      }

      // Create profile if it doesn't exist
      const currentUser = state.user;
      if (!currentUser) {
        console.log('[Auth] No current user for profile creation');
        return null;
      }

      console.log('[Auth] Creating new profile for user:', userId);

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

      if (insertError) {
        console.error('[Auth] Profile creation error:', insertError);
        throw insertError;
      }

      console.log('[Auth] Profile created successfully');
      updateState({ profileError: null });
      return newProfile as Profile;

    } catch (error) {
      console.error('[Auth] Error in fetchProfile:', error);
      
      if (retries > 0) {
        console.log(`[Auth] Retrying profile fetch in ${delay}ms, ${retries} attempts remaining`);
        await new Promise(resolve => setTimeout(resolve, delay));
        profileFetchRef.current = false;
        return fetchProfile(userId, retries - 1, Math.min(delay * 2, 10000));
      }
      
      updateState({ 
        profileError: error instanceof Error ? error.message : 'Failed to load profile'
      });
      return null;
    } finally {
      profileFetchRef.current = false;
    }
  }, [supabase, state.user, updateState]);

  // Enhanced wallet balance fetcher
  const fetchWalletBalance = useCallback(async (userId: string, retries = 2): Promise<WalletBalance | null> => {
    try {
      console.log(`[Auth] Fetching wallet balance for user: ${userId}`);
      
      const { data, error } = await supabase
        .from('wallet_balance')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[Auth] Wallet balance fetch error:', error);
        throw error;
      }

      if (!data) {
        console.log('[Auth] Creating wallet balance for user');
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
          console.error('[Auth] Wallet creation error:', createError);
          throw createError;
        }
        return newWallet as WalletBalance;
      }

      return data as WalletBalance;
    } catch (error) {
      console.error('[Auth] Error in fetchWalletBalance:', error);
      
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchWalletBalance(userId, retries - 1);
      }
      
      return null;
    }
  }, [supabase]);

  // Retry profile load function
  const retryProfileLoad = useCallback(async () => {
    if (!state.user) return;
    
    updateState({ profileError: null, loading: true });
    
    try {
      const [profileData, walletData] = await Promise.all([
        fetchProfile(state.user.id),
        fetchWalletBalance(state.user.id)
      ]);

      updateState({
        profile: profileData,
        walletBalance: walletData,
        loading: false
      });
    } catch (error) {
      console.error('[Auth] Retry profile load failed:', error);
      updateState({ loading: false });
    }
  }, [state.user, fetchProfile, fetchWalletBalance, updateState]);

  // Initialize auth state with better error handling
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initializeAuth = async () => {
      try {
        console.log('[Auth] Initializing auth state...');
        updateState({ loading: true, error: null, profileError: null });
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Session fetch error:', error);
          throw error;
        }
        
        if (session?.user) {
          console.log('[Auth] Active session found for user:', session.user.email);
          
          updateState({
            session,
            user: session.user,
            isAuthenticated: true,
            loading: true
          });

          // Fetch profile and wallet in parallel with timeout
          const fetchPromise = Promise.all([
            fetchProfile(session.user.id),
            fetchWalletBalance(session.user.id)
          ]);

          // Set a timeout for data fetching
          const timeoutPromise = new Promise<[Profile | null, WalletBalance | null]>((_, reject) => {
            setTimeout(() => reject(new Error('Data fetch timeout')), 15000);
          });

          try {
            const [profileData, walletData] = await Promise.race([fetchPromise, timeoutPromise]);
            
            updateState({
              profile: profileData,
              walletBalance: walletData,
              loading: false,
              isInitialized: true
            });
          } catch (fetchError) {
            console.error('[Auth] Data fetch error:', fetchError);
            updateState({
              loading: false,
              isInitialized: true,
              profileError: fetchError instanceof Error ? fetchError.message : 'Failed to load user data'
            });
          }
        } else {
          console.log('[Auth] No active session found');
          updateState({
            loading: false,
            isInitialized: true
          });
        }
      } catch (error) {
        console.error('[Auth] Auth initialization error:', error);
        updateState({
          error: error instanceof Error ? error.message : 'Failed to initialize authentication',
          loading: false,
          isInitialized: true
        });
      }
    };

    initializeAuth();

    // Set up auth state listener with enhanced error handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', event);
      
      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      if (event === 'SIGNED_IN' && session) {
        console.log('[Auth] User signed in:', session.user.email);
        updateState({
          session,
          user: session.user,
          isAuthenticated: true,
          loading: true,
          error: null,
          profileError: null
        });
        
        try {
          const [profileData, walletData] = await Promise.all([
            fetchProfile(session.user.id),
            fetchWalletBalance(session.user.id)
          ]);
          
          updateState({
            profile: profileData,
            walletBalance: walletData,
            loading: false
          });
        } catch (error) {
          console.error('[Auth] Post-signin data fetch error:', error);
          updateState({
            loading: false,
            profileError: error instanceof Error ? error.message : 'Failed to load user data'
          });
        }
        
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] User signed out');
        updateState({
          user: null,
          session: null,
          profile: null,
          walletBalance: null,
          isAuthenticated: false,
          loading: false,
          error: null,
          profileError: null
        });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('[Auth] Token refreshed');
        updateState({ session });
      }
    });

    return () => {
      subscription.unsubscribe();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [supabase, fetchProfile, fetchWalletBalance, updateState]);

  // Enhanced sign out with cleanup
  const signOut = useCallback(async () => {
    try {
      console.log('[Auth] Signing out user');
      updateState({ loading: true });
      
      await supabase.auth.signOut();
      
      updateState({
        user: null,
        session: null,
        profile: null,
        walletBalance: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        profileError: null
      });

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

  // Enhanced session validation
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('[Auth] Session check failed - no valid session');
        return false;
      }

      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      
      if (timeUntilExpiry <= 0) {
        console.log('[Auth] Session expired');
        await signOut();
        return false;
      }

      // Refresh token if expiring within 5 minutes
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.log('[Auth] Session expiring soon, refreshing...');
        await refreshSession();
      }

      return true;
    } catch (error) {
      console.error('[Auth] Error checking session:', error);
      return false;
    }
  }, [supabase, signOut]);

  // Enhanced session refresh
  const refreshSession = useCallback(async () => {
    try {
      console.log('[Auth] Refreshing session');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[Auth] Session refresh error:', error);
        throw error;
      }
      
      if (session) {
        updateState({ session, user: session.user });
      }
    } catch (error) {
      console.error('[Auth] Error refreshing session:', error);
      await signOut();
    }
  }, [supabase, signOut, updateState]);

  // Enhanced wallet balance refresh
  const refreshWalletBalance = useCallback(async () => {
    if (!state.user) return;
    
    try {
      console.log('[Auth] Refreshing wallet balance');
      const balance = await fetchWalletBalance(state.user.id);
      updateState({ walletBalance: balance });
    } catch (error) {
      console.error('[Auth] Error refreshing wallet balance:', error);
    }
  }, [state.user, fetchWalletBalance, updateState]);

  // Enhanced sign in - REDIRECT TO HOME
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      updateState({ loading: true, error: null, profileError: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session && data.user) {
        updateState({
          session: data.session,
          user: data.user,
          isAuthenticated: true
        });

        // Load profile and wallet data will be handled by the auth state change listener
        
        // REDIRECT TO HOME AFTER SUCCESSFUL LOGIN
        router.push('/home');
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
  }, [supabase, updateState, router]);

  // Enhanced Google sign in - with home redirect in callback
  const signInWithGoogle = useCallback(async () => {
    try {
      updateState({ loading: true, error: null, profileError: null });
      
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

  // Enhanced sign up
  const signUp = useCallback(async (email: string, password: string) => {
    try {
      updateState({ loading: true, error: null, profileError: null });
      
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

  // Enhanced update profile
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
        updateState({ profile: data as Profile });
      }

      return { error: null };
    } catch (error) {
      console.error('[Auth] Update profile error:', error);
      return { error: error as Error };
    }
  }, [state.user, supabase, updateState]);

  // Enhanced resend verification email
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
    retryProfileLoad,
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