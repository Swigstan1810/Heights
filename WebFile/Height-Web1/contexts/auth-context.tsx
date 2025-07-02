// contexts/auth-context.tsx - Production-ready authentication with robust security
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
  login_attempts: number | null;
  locked_until: string | null;
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
  isAccountLocked: boolean;
  sessionExpiry: Date | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null; requiresEmailVerification?: boolean }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: Error | null; requiresEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshWalletBalance: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  clearError: () => void;
  checkAccountLockStatus: () => Promise<boolean>;
}

// Security utilities
const SecurityUtils = {
  // Validate password strength
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Check for disposable email domains
  isDisposableEmail(email: string): boolean {
    const disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
      'mailinator.com', 'temp-mail.org', 'throwaway.email'
    ];
    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  },

  // Rate limiting helper
  checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
    if (typeof window === 'undefined') return true;
    
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]')
      .filter((timestamp: number) => now - timestamp < windowMs);
    
    if (attempts.length >= maxAttempts) {
      return false;
    }
    
    attempts.push(now);
    localStorage.setItem(`rate_limit_${key}`, JSON.stringify(attempts));
    return true;
  }
};

// Secure cache implementation
class SecureCache {
  private cache = new Map<string, { data: any; timestamp: number; hash: string }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  private generateHash(data: any): string {
    return btoa(JSON.stringify(data)).slice(0, 10);
  }
  
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hash: this.generateHash(data)
    });
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

const dataCache = new SecureCache();

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
    isAccountLocked: false,
    sessionExpiry: null,
  });

  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const initializationRef = useRef(false);
  const fetchingRef = useRef<Set<string>>(new Set());
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update state helper with validation
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // Auto-set sessionExpiry when session changes
      if (updates.session && updates.session.expires_at) {
        newState.sessionExpiry = new Date(updates.session.expires_at * 1000);
      }
      
      return newState;
    });
  }, []);

  // Security event logger
  const logSecurityEvent = useCallback(async (event: string, details: any = {}) => {
    try {
      if (!state.user) return;
      
      await supabase.from('ai_errors').insert({
        error: event,
        error_message: `Security Event: ${event}`,
        context: {
          user_id: state.user.id,
          timestamp: new Date().toISOString(),
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          ...details
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [supabase, state.user]);

  // Check account lock status
  const checkAccountLockStatus = useCallback(async (): Promise<boolean> => {
    if (!state.user?.email) return false;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('locked_until, login_attempts')
        .eq('email', state.user.email)
        .single();
      
      if (data?.locked_until) {
        const lockUntil = new Date(data.locked_until);
        const isLocked = lockUntil > new Date();
        updateState({ isAccountLocked: isLocked });
        return isLocked;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking account lock status:', error);
      return false;
    }
  }, [supabase, state.user, updateState]);

  // Clear error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Get cached data
  const getCachedData = useCallback((key: string) => {
    return dataCache.get(key);
  }, []);

  // Set cached data
  const setCachedData = useCallback((key: string, data: any) => {
    dataCache.set(key, data);
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
        
        // Check if account is locked
        if (data.locked_until) {
          const lockUntil = new Date(data.locked_until);
          updateState({ isAccountLocked: lockUntil > new Date() });
        }
        
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
        timezone: 'Asia/Kolkata',
        login_attempts: 0,
        last_login_at: new Date().toISOString(),
        // Add missing required fields with defaults
        avatar_url: null,
        username: null,
        bio: null,
        phone_number: null,
        location: null,
        website: null,
        date_of_birth: null,
        password_changed_at: new Date().toISOString(),
        security_questions: {},
        backup_codes: null,
        two_factor_verified_at: null,
        preferences: { notifications: true, dark_mode: false, language: 'en' },
        privacy_settings: { profile_visible: false, portfolio_visible: false },
        risk_tolerance: 'moderate',
        investment_experience: 'beginner',
        annual_income_range: null,
        terms_accepted_at: null,
        privacy_accepted_at: null,
        gdpr_consent: false,
        marketing_consent: false,
        data_retention_consent: true,
        created_by: null,
        updated_by: null,
        version: 1,
        status: 'pending_verification'
      };

      // Try to create profile with explicit error handling
      console.log('[Auth] Attempting to create profile with data:', newProfileData);
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert(newProfileData)
        .select()
        .single();
      
      console.log('[Auth] Profile creation result:', { newProfile, insertError });

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

  // Enhanced sign in with security features
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // Validate inputs
      if (!SecurityUtils.validateEmail(email)) {
        throw new Error('Invalid email format');
      }
      
      // Check rate limiting
      if (!SecurityUtils.checkRateLimit(`signin_${email}`, 5, 15 * 60 * 1000)) {
        throw new Error('Too many login attempts. Please try again in 15 minutes.');
      }
      
      updateState({ loading: true, error: null });
      
      // Check if account is locked first
      const { data: profileData } = await supabase
        .from('profiles')
        .select('locked_until, login_attempts')
        .eq('email', email)
        .maybeSingle();
      
      if (profileData?.locked_until) {
        const lockUntil = new Date(profileData.locked_until);
        if (lockUntil > new Date()) {
          const minutesLeft = Math.ceil((lockUntil.getTime() - Date.now()) / (1000 * 60));
          throw new Error(`Account is locked. Try again in ${minutesLeft} minutes.`);
        }
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Update failed login attempts
        if (profileData) {
          const attempts = (profileData.login_attempts || 0) + 1;
          const updates: any = { login_attempts: attempts };
          
          // Lock account after 5 failed attempts
          if (attempts >= 5) {
            updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          }
          
          await supabase
            .from('profiles')
            .update(updates)
            .eq('email', email);
        }
        
        await logSecurityEvent('login_failed', { 
          email, 
          error: error.message,
          attempts: (profileData?.login_attempts || 0) + 1
        });
        
        throw error;
      }

      if (data.session && data.user) {
        // Reset failed login attempts on successful login
        await supabase
          .from('profiles')
          .update({ 
            login_attempts: 0, 
            locked_until: null,
            last_login_at: new Date().toISOString()
          })
          .eq('email', email);
        
        // Clear any stale cache for this user
        dataCache.delete(`profile:${data.user.id}`);
        dataCache.delete(`wallet:${data.user.id}`);
        
        updateState({
          session: data.session,
          user: data.user,
          isAuthenticated: true,
          loading: false,
          sessionExpiry: new Date(data.session.expires_at! * 1000),
        });

        // Check if email verification is required
        const requiresEmailVerification = !data.user.email_confirmed_at;
        
        if (!requiresEmailVerification) {
          // Redirect immediately for verified users
          router.push('/portfolio');
        }
        
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
        
        return { error: null, requiresEmailVerification };
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

  // Enhanced sign up with security validation
  const signUp = useCallback(async (email: string, password: string, userData: any = {}) => {
    try {
      // Validate inputs
      if (!SecurityUtils.validateEmail(email)) {
        throw new Error('Invalid email format');
      }
      
      if (SecurityUtils.isDisposableEmail(email)) {
        throw new Error('Disposable email addresses are not allowed');
      }
      
      const passwordValidation = SecurityUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join('. '));
      }
      
      // Check rate limiting
      if (!SecurityUtils.checkRateLimit(`signup_${email}`, 3, 60 * 60 * 1000)) {
        throw new Error('Too many signup attempts. Please try again in 1 hour.');
      }
      
      updateState({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
          data: {
            email: email,
            auth_provider: 'email',
            full_name: userData.fullName || null,
            ...userData
          }
        },
      });

      if (error) {
        await logSecurityEvent('signup_failed', { 
          email, 
          error: error.message 
        });
        throw error;
      }

      await logSecurityEvent('signup_success', { 
        email,
        user_id: data.user?.id 
      });

      updateState({ loading: false });
      
      // All signups require email verification
      return { error: null, requiresEmailVerification: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      console.error('[Auth] Sign up error:', errorMessage);
      updateState({ 
        error: errorMessage,
        loading: false 
      });
      return { error: error as Error };
    }
  }, [supabase, updateState, logSecurityEvent]);

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

  // Password reset with security
  const resetPassword = useCallback(async (email: string) => {
    try {
      if (!SecurityUtils.validateEmail(email)) {
        throw new Error('Invalid email format');
      }
      
      // Check rate limiting
      if (!SecurityUtils.checkRateLimit(`reset_${email}`, 3, 60 * 60 * 1000)) {
        throw new Error('Too many reset attempts. Please try again in 1 hour.');
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : ''
      });
      
      if (error) throw error;
      
      await logSecurityEvent('password_reset_requested', { email });
      return { error: null };
    } catch (error) {
      console.error('[Auth] Password reset error:', error);
      await logSecurityEvent('password_reset_failed', { 
        email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { error: error as Error };
    }
  }, [supabase, logSecurityEvent]);

  // Update password with validation
  const updatePassword = useCallback(async (password: string) => {
    try {
      const passwordValidation = SecurityUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join('. '));
      }
      
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      await logSecurityEvent('password_updated');
      return { error: null };
    } catch (error) {
      console.error('[Auth] Password update error:', error);
      await logSecurityEvent('password_update_failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { error: error as Error };
    }
  }, [supabase, logSecurityEvent]);

  // Enhanced resend verification email
  const resendVerificationEmail = useCallback(async () => {
    try {
      if (!state.user?.email) {
        throw new Error('No email address found');
      }

      // Check rate limiting
      if (!SecurityUtils.checkRateLimit(`verify_${state.user.email}`, 3, 60 * 60 * 1000)) {
        throw new Error('Too many verification emails sent. Please try again in 1 hour.');
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: state.user.email,
      });

      if (error) throw error;
      
      await logSecurityEvent('verification_email_resent');
      return { error: null };
    } catch (error) {
      console.error('[Auth] Resend verification error:', error);
      await logSecurityEvent('verification_email_failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { error: error as Error };
    }
  }, [state.user, supabase, logSecurityEvent]);

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
    resetPassword,
    updatePassword,
    clearError,
    checkAccountLockStatus,
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

// Export security utilities for use in other components
export { SecurityUtils };