"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function KycPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading) {
      if (user) {
        // Always redirect to dashboard since KYC is disabled
        router.replace("/dashboard");
      } else {
        // If not logged in, redirect to login
        router.replace("/login");
      }
    }
  }, [user, loading, router]);
  
  // Don't render anything, just redirect
  return null;
}