"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session, AuthError } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  kycCompleted: boolean;
  kycSubmitted: boolean; // New property for tracking KYC submission status
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  setKycCompleted: (value: boolean) => void;
  setKycSubmitted: (value: boolean) => void; // New method for updating KYC submission status
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [kycCompleted, setKycCompleted] = useState(false);
  const [kycSubmitted, setKycSubmitted] = useState(false); // New state for tracking KYC submission

  useEffect(() => {
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          // Fetch KYC status
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('kyc_completed')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              console.error("Error fetching profile:", error);
            } else {
              setKycCompleted(profile?.kyc_completed || false);
            }
            
            // Check if KYC has been submitted but not yet approved
            const { data: kycDetails, error: kycError } = await supabase
              .from('kyc_details')
              .select('created_at')
              .eq('user_id', session.user.id)
              .single();
              
            if (kycError && kycError.code !== 'PGRST116') { // PGRST116 is "not found" error
              console.error("Error checking KYC submission:", kycError);
            } else {
              // Set kycSubmitted to true if we found a record
              setKycSubmitted(!!kycDetails);
            }
          } catch (error) {
            console.error("Error in KYC status check:", error);
          }
        } else {
          setKycCompleted(false);
          setKycSubmitted(false);
        }
        
        setLoading(false);
      }
    );

    // Initial session check
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSession(session);
        setUser(session.user);
        
        // Fetch KYC status
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('kyc_completed')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error("Error fetching profile:", error);
          } else {
            setKycCompleted(profile?.kyc_completed || false);
          }
          
          // Check if KYC has been submitted but not yet approved
          const { data: kycDetails, error: kycError } = await supabase
            .from('kyc_details')
            .select('created_at')
            .eq('user_id', session.user.id)
            .single();
            
          if (kycError && kycError.code !== 'PGRST116') { // PGRST116 is "not found" error
            console.error("Error checking KYC submission:", kycError);
          } else {
            // Set kycSubmitted to true if we found a record
            setKycSubmitted(!!kycDetails);
          }
        } catch (error) {
          console.error("Error in KYC status check:", error);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      // Note: We don't need to set user and session here because the onAuthStateChange listener will handle it
      
      return { error };
    } catch (error) {
      console.error("Error in signIn:", error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });
      
      return { error };
    } catch (error) {
      console.error("Error in signUp:", error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      // The onAuthStateChange listener will handle setting user and session to null
    } catch (error) {
      console.error("Error in signOut:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      loading,
      kycCompleted,
      kycSubmitted,
      signIn, 
      signUp, 
      signOut,
      setKycCompleted,
      setKycSubmitted
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}