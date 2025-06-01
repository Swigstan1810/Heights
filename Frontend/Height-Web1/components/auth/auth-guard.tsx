// components/auth/auth-guard.tsx
"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  fallbackUrl?: string;
}

export function AuthGuard({ children, fallbackUrl = "/login" }: AuthGuardProps) {
  const [isClient, setIsClient] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    
    // If fully loaded and no user is authenticated, redirect to login
    if (!isLoading && !user && isClient) {
      router.push(fallbackUrl);
    }
  }, [user, isLoading, router, isClient, fallbackUrl]);

  // Show loading state while checking authentication
  if (isLoading || !isClient || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}