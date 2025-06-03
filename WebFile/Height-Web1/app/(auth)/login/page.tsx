// app/(auth)/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  AlertCircle, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Shield,
  Loader2,
  CheckCircle,
  Info
} from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const { signIn, user, loading: authLoading } = useAuth();
  const supabase = createClientComponentClient<Database>();
  
  // Security feature: Clear sensitive data on unmount
  useEffect(() => {
    return () => {
      setPassword('');
    };
  }, []);
  
  // Check if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      console.log("User already logged in, redirecting to:", redirectTo);
      router.push(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);
  
  // Check for account lockout
  const checkAccountLockout = async (email: string) => {
    try {
      const { data, error } = await supabase
        .rpc('is_account_locked', { p_email: email });
      
      if (error) {
        console.error('Error checking account lockout:', error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error('Error in lockout check:', error);
      return false;
    }
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLockoutTime(null);
    
    // Basic validation
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if account is locked
      const isLocked = await checkAccountLockout(email);
      if (isLocked) {
        const attempts = sessionStorage.getItem(`login_attempts_${email}`);
        const lastAttempt = sessionStorage.getItem(`last_attempt_${email}`);
        
        if (attempts && lastAttempt) {
          const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt);
          const remainingTime = Math.ceil((15 * 60 * 1000 - timeSinceLastAttempt) / 60000);
          setLockoutTime(remainingTime);
        }
        
        setError("Account temporarily locked due to multiple failed login attempts.");
        setLoading(false);
        return;
      }
      
      console.log("Attempting login for:", email);
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        console.error("Sign in error:", signInError);
        
        // Log failed attempt
        await supabase.rpc('handle_failed_login', {
          p_email: email,
          p_ip_address: window.location.hostname,
          p_user_agent: navigator.userAgent
        });
        
        // Check if it's an invalid credentials error
        if (signInError.message.includes('Invalid login credentials')) {
          const attempts = sessionStorage.getItem(`login_attempts_${email}`);
          const attemptCount = attempts ? parseInt(attempts) : 0;
          
          if (attemptCount >= 4) {
            setError("Invalid credentials. Next failed attempt will lock your account for 15 minutes.");
          } else if (attemptCount >= 2) {
            setError(`Invalid credentials. ${5 - attemptCount} attempts remaining.`);
          } else {
            setError("Invalid email or password. Please try again.");
          }
        } else {
          setError(signInError.message);
        }
      } else {
        console.log("Sign in successful, redirecting to:", redirectTo);
        
        // Update last login info
        if (user) {
          await supabase.rpc('update_last_login', {
            p_user_id: user.id,
            p_ip_address: window.location.hostname
          });
          
          // Log successful login
          await supabase.rpc('log_security_event', {
            p_user_id: user.id,
            p_event_type: 'login_success',
            p_event_details: { remember_me: rememberMe },
            p_ip_address: window.location.hostname,
            p_user_agent: navigator.userAgent
          });
        }
        
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('heights_remember_email', email);
        } else {
          localStorage.removeItem('heights_remember_email');
        }
        
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred during login");
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('heights_remember_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg border border-border shadow-xl"
      >
        {/* Logo and Title */}
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
            Log in to your secure trading account
          </p>
        </div>
        
        {/* Security Badge */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Secure 256-bit encryption</span>
          </div>
        </div>
        
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {lockoutTime && (
                <span className="block mt-1">
                  Please try again in {lockoutTime} minutes.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Security Notice */}
        {searchParams.get('session_expired') && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your session has expired for security reasons. Please log in again.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                className="pl-10"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link 
                href="/forgot-password" 
                className="text-sm text-primary hover:underline"
                tabIndex={-1}
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="pl-10 pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          
          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              disabled={loading}
            />
            <Label 
              htmlFor="remember" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me on this device
            </Label>
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !!lockoutTime}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Sign In Securely
              </>
            )}
          </Button>
        </form>
        
        {/* Sign Up Link */}
        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
        
        {/* Security Footer */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-green-500" />
              <span>2FA Available</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}