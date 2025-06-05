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
  Info,
  Chrome
} from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const { signIn, signInWithGoogle, user, loading: authLoading } = useAuth();
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
      console.log("User already logged in, redirecting to: /dashboard");
      router.push('/ai');
    }
  }, [user, authLoading, router]);

  // Check for OAuth error in URL
  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      setError(errorDescription || 'Authentication failed. Please try again.');
    }
  }, [searchParams]);
  
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
          
          // Update attempt count in session storage
          sessionStorage.setItem(`login_attempts_${email}`, (attemptCount + 1).toString());
          sessionStorage.setItem(`last_attempt_${email}`, Date.now().toString());
        } else {
          setError(signInError.message);
        }
      } else {
        console.log("Sign in successful, redirecting to: /dashboard");
        
        // Clear login attempts on success
        sessionStorage.removeItem(`login_attempts_${email}`);
        sessionStorage.removeItem(`last_attempt_${email}`);
        
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('heights_remember_email', email);
        } else {
          localStorage.removeItem('heights_remember_email');
        }
        
        router.push('/dashboard');
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
  
  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
      // If successful, the user will be redirected by OAuth flow
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred during Google sign in");
      }
      setGoogleLoading(false);
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

        {/* Success message for account creation */}
        {searchParams.get('registered') && (
          <Alert className="bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-900">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-400">
              Account created successfully! Please check your email to verify your account.
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
                disabled={loading || googleLoading}
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
                disabled={loading || googleLoading}
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
              disabled={loading || googleLoading}
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
            disabled={loading || googleLoading || !!lockoutTime}
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
        
        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        
        {/* Google Sign In */}
        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading || !!lockoutTime}
        >
          {googleLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting to Google...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </>
          )}
        </Button>
        
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
              <span>OAuth 2.0</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}