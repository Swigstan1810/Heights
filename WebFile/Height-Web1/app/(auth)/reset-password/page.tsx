"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Lock } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  
  // Check if there's an access token in the URL (hash fragment)
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        // Supabase Auth will handle this automatically if the user is on this page
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError("Invalid or expired reset token. Please try again.");
        }
      }
    };

    handleHashChange();
  }, []);
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (!password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    
    // Password validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    
    try {
      const { error: resetError } = await supabase.auth.updateUser({
        password: password
      });
      
      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess("Password has been reset successfully!");
        
        // Redirect to login after a delay
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while resetting your password");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg border border-border shadow-xl"
      >
        <div className="text-center">
          <Link href="/" className="inline-flex items-center mb-4">
            <div className="relative flex items-center justify-center h-10 w-10 mr-2">
              <svg viewBox="0 0 100 100" className="h-8 w-8">
                <path
                  d="M30,20 L30,80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="16"
                  strokeLinecap="square"
                />
                <path
                  d="M30,20 L80,20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="16"
                  strokeLinecap="square"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold">Heights</span>
          </Link>
          <h2 className="text-3xl font-bold">Set New Password</h2>
          <p className="mt-2 text-muted-foreground">
            Create a new secure password for your account
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-900">
            <CheckCircle className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-400">{success}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                className="pl-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || !!success}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters long
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                className="pl-10"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || !!success}
              />
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !!success}
          >
            {loading ? "Updating..." : "Reset Password"}
          </Button>
        </form>
        
        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}