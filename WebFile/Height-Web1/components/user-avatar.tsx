// components/user-avatar.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Settings,
  LogOut,
  Shield,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";

export function UserAvatar() {
  const { user, profile, signOut, loading } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setSigningOut(false);
    }
  };

  if (loading || !user || !profile) {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    );
  }

  // Use Google avatar if available, otherwise fall back to regular avatar or initials
  const avatarUrl = profile.google_avatar_url || profile.avatar_url || undefined;
  const displayName = profile.full_name || user.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={avatarUrl} 
              alt={displayName}
              referrerPolicy="no-referrer" // Important for Google avatars
            />
            <AvatarFallback className="bg-primary/10">
              {initials}
            </AvatarFallback>
          </Avatar>
          {profile.email_verified && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              {profile.email_verified ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <AlertCircle className="h-3 w-3 text-yellow-500" />
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {profile.auth_provider === 'google' && (
                <Badge variant="secondary" className="text-xs">
                  <svg className="mr-1 h-3 w-3" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                  </svg>
                  Google
                </Badge>
              )}
              {profile.kyc_completed ? (
                <Badge variant="default" className="text-xs">
                  <Shield className="mr-1 h-3 w-3" />
                  KYC Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  KYC Pending
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        {!profile.email_verified && profile.auth_provider === 'email' && (
          <DropdownMenuItem onClick={() => router.push('/verify-email')}>
            <Mail className="mr-2 h-4 w-4" />
            <span>Verify Email</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={signingOut}
          className="text-red-600 focus:text-red-600"
        >
          {signingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}