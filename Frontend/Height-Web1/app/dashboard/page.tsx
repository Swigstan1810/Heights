"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [isCheckingKyc, setIsCheckingKyc] = useState(true);

  useEffect(() => {
    setIsClient(true);
    
    // If user is not authenticated, redirect to login
    if (!isLoading && !user && isClient) {
      router.push("/login");
    }
  }, [user, isLoading, router, isClient]);

  useEffect(() => {
    // Check KYC status if user is authenticated
    const checkKycStatus = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('kyc_details')
            .select()
            .eq('user_id', user.id);

          if (error) {
            console.error("Error fetching KYC status:", error);
          } else if (data && data.length > 0) {
            setKycStatus(data[0].status);
          } else {
            // No KYC record found, redirect to KYC form
            router.push("/kyc");
          }
        } catch (err) {
          console.error("Error checking KYC status:", err);
        } finally {
          setIsCheckingKyc(false);
        }
      }
    };

    if (user) {
      checkKycStatus();
    }
  }, [user, router]);

  // Show loading state while checking authentication
  if (isLoading || !isClient || isCheckingKyc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If KYC is pending, show pending message
  if (kycStatus === "pending") {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold mb-2">KYC Verification In Progress</h1>
            <p className="text-muted-foreground">
              Your KYC details are being verified. This process usually takes 1-2 business days. 
              We'll notify you once the verification is complete and your account is activated for trading.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If KYC is rejected, show rejection message
  if (kycStatus === "rejected") {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold mb-2">KYC Verification Failed</h1>
            <p className="text-muted-foreground mb-4">
              Unfortunately, we couldn't verify your KYC details. Please check your information and try again.
            </p>
            <button
              onClick={() => router.push("/kyc")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Update KYC Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If KYC is approved, show dashboard
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold mb-2">Portfolio Value</h2>
            <p className="text-3xl font-bold">₹0.00</p>
            <p className="text-sm text-muted-foreground mt-1">Start trading to build your portfolio</p>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold mb-2">Available Funds</h2>
            <p className="text-3xl font-bold">₹0.00</p>
            <p className="text-sm text-muted-foreground mt-1">Add funds to start trading</p>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold mb-2">Holdings</h2>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-muted-foreground mt-1">No active positions</p>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Market Overview</h2>
          <p className="text-muted-foreground">
            Your dashboard is ready! Start by adding funds to your account and explore trading opportunities.
          </p>
        </div>
      </div>
    </div>
  );
}