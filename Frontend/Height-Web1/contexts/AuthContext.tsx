// contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

// Define the User type
type User = {
  id: string;
  email: string;
  name?: string;
};

// Define the Auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

// Create the Auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock authentication service (replace with your actual auth service)
const mockAuth = {
  signIn: async (email: string, password: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, accept any email with a password length > 5
    if (password.length <= 5) {
      return { error: new Error("Invalid credentials. Password must be at least 6 characters.") };
    }
    
    // Create a mock user
    const user = {
      id: "user-" + Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0]
    };
    
    // Store in localStorage for persistence
    localStorage.setItem('user', JSON.stringify(user));
    
    return { error: null };
  },
  
  signUp: async (email: string, password: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, accept any email with a password length > 7
    if (password.length <= 7) {
      return { error: new Error("Password must be at least 8 characters.") };
    }
    
    // Create a mock user
    const user = {
      id: "user-" + Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0]
    };
    
    // Store in localStorage for persistence
    localStorage.setItem('user', JSON.stringify(user));
    
    return { error: null };
  },
  
  signOut: async () => {
    // Remove user from localStorage
    localStorage.removeItem('user');
  },
  
  getUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }
};

// Auth Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing user session on initial load
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      try {
        const currentUser = mockAuth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to restore authentication state:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await mockAuth.signIn(email, password);
      if (!error) {
        const currentUser = mockAuth.getUser();
        setUser(currentUser);
      }
      return { error };
    } catch (error) {
      console.error("Sign in error:", error);
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await mockAuth.signUp(email, password);
      if (!error) {
        const currentUser = mockAuth.getUser();
        setUser(currentUser);
      }
      return { error };
    } catch (error) {
      console.error("Sign up error:", error);
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    setIsLoading(true);
    try {
      await mockAuth.signOut();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the Auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}