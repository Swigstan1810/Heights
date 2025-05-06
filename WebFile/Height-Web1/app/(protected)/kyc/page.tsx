"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { KycForm } from "@/components/kyc-form";
import { Navbar } from "@/components/navbar";

export default function KycPage() {
  const { user, isLoading, kycCompleted } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading) {
      // If user not logged in, redirect to login
      if (!user) {
        router.push("/login");
      }
      // If KYC already completed, redirect to dashboard
      else if (kycCompleted) {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, kycCompleted, router]);
  
  // Show loading or render the form when appropriate
  if (isLoading || !user || kycCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16 px-4 flex justify-center">
        <KycForm />
      </div>
    </main>
  );
}