"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { signIn, user, loading: authLoading } = useAuth();
  
  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user && !authLoading) {
      console.log("User already logged in, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Attempting login for:", email);
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        console.error("Sign in error:", signInError);
        setError(signInError.message);
      } else {
        console.log("Sign in successful, redirecting to dashboard");
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Unexpected error during login:", err);
      setError(err.message || "An error occurred during login");
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
          <h2 className="text-3xl font-bold">Welcome Back</h2>
          <p className="mt-2 text-muted-foreground">
            Log in to your account to continue
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Logging In..." : "Log In"}
          </Button>
        </form>
        
        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}