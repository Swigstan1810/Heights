// app/(auth)/signup/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2, Info, Mail, Lock, Shield, User } from "lucide-react";
import { useAuth, SecurityUtils } from "@/contexts/auth-context";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [] as string[],
    color: 'bg-gray-200'
  });
  const [submitAttempts, setSubmitAttempts] = useState(0);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/ai');
    }
  }, [user, authLoading, router]);

  // Check for OAuth error in URL
  useEffect(() => {
    const error = searchParams?.get('error');
    const errorDescription = searchParams?.get('error_description');
    
    if (error) {
      setError(errorDescription || 'Authentication failed. Please try again.');
    }
  }, [searchParams]);
  
  // Enhanced password strength checker
  const checkPasswordStrength = (pwd: string) => {
    if (!pwd) {
      setPasswordStrength({ score: 0, feedback: [], color: 'bg-gray-200' });
      return;
    }

    const validation = SecurityUtils.validatePassword(pwd);
    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (pwd.length >= 8) score += 20;
    else feedback.push('At least 8 characters');

    // Character type checks
    if (/[A-Z]/.test(pwd)) score += 20;
    else feedback.push('One uppercase letter');

    if (/[a-z]/.test(pwd)) score += 20;
    else feedback.push('One lowercase letter');

    if (/[0-9]/.test(pwd)) score += 20;
    else feedback.push('One number');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 20;
    else feedback.push('One special character');

    // Bonus points for length
    if (pwd.length >= 12) score += 10;
    if (pwd.length >= 16) score += 10;

    // Penalty for common patterns
    if (/(.)\1{2,}/.test(pwd)) score -= 10; // Repeated characters
    if (/123456|password|qwerty/i.test(pwd)) score -= 20; // Common patterns

    const colors = {
      0: 'bg-gray-200',
      20: 'bg-red-500',
      40: 'bg-orange-500',
      60: 'bg-yellow-500',
      80: 'bg-blue-500',
      100: 'bg-green-500'
    };

    const colorKey = Math.min(100, Math.max(0, Math.floor(score / 20) * 20)) as keyof typeof colors;

    setPasswordStrength({
      score: Math.min(100, Math.max(0, score)),
      feedback: validation.isValid ? [] : feedback,
      color: colors[colorKey]
    });
  };
  
  useEffect(() => {
    if (password) {
      checkPasswordStrength(password);
    }
  }, [password]);
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple rapid submissions
    if (loading || submitAttempts >= 3) {
      setError('Too many attempts. Please wait a moment before trying again.');
      return;
    }

    setSubmitAttempts(prev => prev + 1);
    setError(null);
    setSuccess(null);
    
    try {
      // Enhanced validation
      if (!fullName.trim() || !email || !password || !confirmPassword) {
        setError("All fields are required");
        return;
      }
      
      // Validate full name
      if (fullName.trim().length < 2) {
        setError("Full name must be at least 2 characters");
        return;
      }
      
      if (!/^[a-zA-Z\s'-]+$/.test(fullName.trim())) {
        setError("Full name can only contain letters, spaces, hyphens, and apostrophes");
        return;
      }
      
      // Validate email
      if (!SecurityUtils.validateEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }
      
      if (SecurityUtils.isDisposableEmail(email)) {
        setError("Disposable email addresses are not allowed");
        return;
      }
      
      // Validate password strength
      if (passwordStrength.score < 60) {
        setError("Please choose a stronger password for better security");
        return;
      }
      
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      
      // Check terms acceptance
      if (!acceptTerms) {
        setError("You must accept the terms and conditions");
        return;
      }
      
      setLoading(true);
      
      // Sign up the user with enhanced data
      const result = await signUp(email, password, {
        fullName: fullName.trim(),
      });
      
      if (result.error) {
        // Handle specific error cases
        if (result.error.message.includes('already registered')) {
          setError("An account with this email already exists. Try signing in instead.");
        } else if (result.error.message.includes('password')) {
          setError(result.error.message);
        } else if (result.error.message.includes('rate limit')) {
          setError("Too many signup attempts. Please try again in 1 hour.");
        } else if (result.error.message.includes('disposable')) {
          setError("Please use a valid email address. Disposable email addresses are not allowed.");
        } else {
          setError(result.error.message || "An error occurred during signup. Please try again.");
        }
        return;
      }
      
      // If sign up successful
      setSuccess("Registration successful! Please check your email to verify your account before signing in.");
      
      // Clear form for security
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setAcceptTerms(false);
      setPasswordStrength({ score: 0, feedback: [], color: 'bg-gray-200' });
      
      // Redirect after delay with message
      setTimeout(() => {
        router.push("/login?message=Please check your email to verify your account");
      }, 4000);
      
    } catch (err: unknown) {
      console.error('Unexpected signup error:', err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
      
      // Reset attempt counter after 60 seconds
      setTimeout(() => {
        setSubmitAttempts(0);
      }, 60000);
    }
  };
  
  const handleGoogleSignUp = async () => {
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
        setError("An error occurred during Google sign up");
      }
      setGoogleLoading(false);
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
          <h2 className="text-3xl font-bold">Create an Account</h2>
          <p className="mt-2 text-muted-foreground">
            Sign up to start your trading journey
          </p>
        </div>
        
        {/* Security Badge */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Bank-grade security</span>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-900">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        {/* Privacy Notice */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            By signing up, you agree to our Terms of Service and Privacy Policy. 
            We'll never share your information without your consent.
          </AlertDescription>
        </Alert>
        
        {/* Google Sign Up */}
        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={loading || googleLoading || !!success}
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
              Continue with Google
            </>
          )}
        </Button>
        
        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or sign up with email
            </span>
          </div>
        </div>
        
        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                className="pl-10"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading || googleLoading || !!success}
                autoComplete="name"
              />
            </div>
          </div>
          
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
                disabled={loading || googleLoading || !!success}
                autoComplete="email"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
                disabled={loading || googleLoading || !!success}
                autoComplete="new-password"
              />
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {passwordStrength.score < 40 ? 'Weak' : 
                     passwordStrength.score < 70 ? 'Fair' : 
                     passwordStrength.score < 90 ? 'Good' : 'Strong'}
                  </span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <p className="text-xs text-gray-600">
                    Missing: {passwordStrength.feedback.join(', ')}
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Use 8+ characters with a mix of letters, numbers & symbols
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                disabled={loading || googleLoading || !!success}
                autoComplete="new-password"
              />
            </div>
          </div>
          
          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary border rounded focus:ring-primary"
              disabled={loading || googleLoading || !!success}
            />
            <label htmlFor="acceptTerms" className="text-sm text-muted-foreground">
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading || googleLoading || !!success || !acceptTerms || passwordStrength.score < 60}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
        
        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}