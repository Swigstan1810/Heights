// contexts/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  kyc_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// List of public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/ai', '/market'];

// List of protected routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/portfolio', '/trade', '/profile', '/wallet'];

// List of routes that require KYC completion
const KYC_REQUIRED_ROUTES = ['/trade', '/wallet'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient<Database>();

  // Activity tracking for session timeout
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    // Track user activity
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  // Session timeout check
  useEffect(() => {
    const checkTimeout = setInterval(() => {
      if (session && Date.now() - lastActivity > SESSION_TIMEOUT) {
        console.log('Session timeout - logging out user');
        signOut();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkTimeout);
  }, [session, lastActivity]);

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, [supabase]);

  // Check if route requires authentication
  const isProtectedRoute = useCallback((path: string) => {
    return PROTECTED_ROUTES.some(route => path.startsWith(route));
  }, []);

  // Check if route requires KYC
  const requiresKYC = useCallback((path: string) => {
    return KYC_REQUIRED_ROUTES.some(route => path.startsWith(route));
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setLoading(false);
          return;
        }

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile(initialSession.user.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [supabase, fetchProfile]);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);

      if (event === 'SIGNED_IN' && session) {
        setSession(session);
        setUser(session.user);
        await fetchProfile(session.user.id);
        setLastActivity(Date.now());
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session);
        setLastActivity(Date.now());
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  // Route protection
  useEffect(() => {
    if (!loading) {
      const currentPath = pathname;
      
      // Check if current route is protected
      if (isProtectedRoute(currentPath) && !user) {
        console.log('Redirecting to login - protected route without auth');
        router.push('/login');
        return;
      }

      // Check if route requires KYC
      if (user && requiresKYC(currentPath) && profile && !profile.kyc_completed) {
        console.log('Redirecting to KYC - route requires KYC completion');
        router.push('/kyc');
        return;
      }
    }
  }, [pathname, user, profile, loading, router, isProtectedRoute, requiresKYC]);

  const signIn = async (email: string, password: string) => {
    try {
      // Add rate limiting check
      const attempts = sessionStorage.getItem(`login_attempts_${email}`);
      const lastAttempt = sessionStorage.getItem(`last_attempt_${email}`);
      
      if (attempts && lastAttempt) {
        const attemptCount = parseInt(attempts);
        const lastAttemptTime = parseInt(lastAttempt);
        const timeSinceLastAttempt = Date.now() - lastAttemptTime;
        
        // Lock account for 15 minutes after 5 failed attempts
        if (attemptCount >= 5 && timeSinceLastAttempt < 15 * 60 * 1000) {
          const remainingTime = Math.ceil((15 * 60 * 1000 - timeSinceLastAttempt) / 60000);
          return { 
            error: new Error(`Too many login attempts. Please try again in ${remainingTime} minutes.`) 
          };
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Track failed attempts
        const currentAttempts = parseInt(sessionStorage.getItem(`login_attempts_${email}`) || '0');
        sessionStorage.setItem(`login_attempts_${email}`, (currentAttempts + 1).toString());
        sessionStorage.setItem(`last_attempt_${email}`, Date.now().toString());
        
        return { error };
      }

      // Clear failed attempts on successful login
      sessionStorage.removeItem(`login_attempts_${email}`);
      sessionStorage.removeItem(`last_attempt_${email}`);

      if (data.user) {
        await fetchProfile(data.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Password strength validation
      if (password.length < 8) {
        return { error: new Error('Password must be at least 8 characters long') };
      }
      
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
        return { error: new Error('Password must contain uppercase, lowercase, and numbers') };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            created_from: 'web_app',
          }
        }
      });

      if (error) return { error };

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      // Clear any sensitive data from local storage
      localStorage.removeItem('portfolio_data');
      localStorage.removeItem('watchlist');
      sessionStorage.clear();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (session) {
        setSession(session);
        setLastActivity(Date.now());
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      // If refresh fails, sign out the user
      await signOut();
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) return { error };

      // Refresh profile data
      await fetchProfile(user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const checkSession = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return !error && !!session;
    } catch {
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user && !!session,
    signIn,
    signUp,
    signOut,
    refreshSession,
    updateProfile,
    checkSession,
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