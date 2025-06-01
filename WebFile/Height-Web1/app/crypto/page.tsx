"use client";

<<<<<<< HEAD
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CryptoPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page with crypto tab selected
    router.push('/?tab=crypto');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-muted-foreground">Taking you to the crypto section</p>
      </div>
    </div>
=======
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import CryptoInterface from "@/components/crypto-interface";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardCheck, AlertCircle } from "lucide-react";

export default function CryptoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // TEMPORARY: Bypass KYC check variables
  // When you want to re-enable KYC verification, uncomment these in the useAuth hook
  // const { kycCompleted, kycSubmitted } = useAuth();
  
  // Temporary bypass - set to true to skip KYC checks
  const bypassKycCheck = true; // Set to false to re-enable KYC verification
  
  useEffect(() => {
    if (!loading) {
      // Authentication check - kept in place
      if (!user) {
        router.push("/login");
      }
      
      // KYC verification check - commented out for now but structure kept for easy reintegration
      /*
      // If KYC not submitted at all, redirect to KYC form
      else if (!kycCompleted && !kycSubmitted) {
        router.push("/kyc");
      }
      */
    }
  }, [user, loading, router]);
  
  // Show loading 
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // KYC check rendering - commented out but kept for easy reintegration
  /*
  // Show KYC in progress message if submitted but not yet completed
  if (!bypassKycCheck && kycSubmitted && !kycCompleted) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-3xl mx-auto">
            <div className="bg-card rounded-lg border border-border shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ClipboardCheck className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h1 className="text-3xl font-bold mb-6">KYC Verification In Progress</h1>
              <p className="text-xl text-muted-foreground mb-6">
                Your KYC verification is currently being processed. You&apos;ll have full access to the crypto trading features once your verification is complete.
              </p>
              <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-md text-yellow-800 dark:text-yellow-400 mb-8">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                  <p className="text-left">
                    This typically takes 1-3 business days. We will notify you by email once your verification is complete.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button onClick={() => router.push('/dashboard')} className="w-full sm:w-auto">
                  Return to Dashboard
                </Button>
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
  */
  
  // If KYC is completed or bypassed, show crypto interface
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-16">
        {/* Optional: Add a banner to indicate KYC check is bypassed */}
        {bypassKycCheck && (
          <div className="container mx-auto px-4 mb-6">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-md text-blue-800 dark:text-blue-400">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                <p className="text-left">
                  KYC check temporarily disabled for testing. The crypto interface is available without verification.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <CryptoInterface />
      </div>
    </main>
>>>>>>> 016f08c0876be523f2a572c92d2c2da6438ff007
  );
}