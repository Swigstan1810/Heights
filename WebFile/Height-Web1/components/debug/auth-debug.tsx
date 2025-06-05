"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AuthDebugComponent() {
  const { 
    user, 
    session, 
    profile, 
    walletBalance, 
    loading, 
    isAuthenticated, 
    profileError,
    refreshWalletBalance 
  } = useAuth();

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm">🐛 Auth Debug Info (Dev Only)</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Loading:</strong> <Badge variant={loading ? "destructive" : "default"}>{loading.toString()}</Badge>
          </div>
          <div>
            <strong>Is Authenticated:</strong> <Badge variant={isAuthenticated ? "default" : "destructive"}>{isAuthenticated.toString()}</Badge>
          </div>
          <div>
            <strong>Profile Error:</strong> <Badge variant={profileError ? "destructive" : "default"}>{profileError.toString()}</Badge>
          </div>
          <div>
            <strong>User:</strong> <Badge variant={user ? "default" : "secondary"}>{user ? "Present" : "Null"}</Badge>
          </div>
          <div>
            <strong>Session:</strong> <Badge variant={session ? "default" : "secondary"}>{session ? "Present" : "Null"}</Badge>
          </div>
          <div>
            <strong>Profile:</strong> <Badge variant={profile ? "default" : "secondary"}>{profile ? "Present" : "Null"}</Badge>
          </div>
          <div>
            <strong>Wallet:</strong> <Badge variant={walletBalance ? "default" : "secondary"}>{walletBalance ? "Present" : "Null"}</Badge>
          </div>
        </div>
        
        {user && (
          <div className="mt-2 p-2 bg-white rounded text-xs">
            <strong>User ID:</strong> {user.id}<br />
            <strong>Email:</strong> {user.email}<br />
            <strong>Provider:</strong> {user.app_metadata?.provider || 'email'}
          </div>
        )}
        
        {profile && (
          <div className="mt-2 p-2 bg-white rounded text-xs">
            <strong>Profile ID:</strong> {profile.id}<br />
            <strong>Full Name:</strong> {profile.full_name || 'None'}<br />
            <strong>Email Verified:</strong> {profile.email_verified.toString()}
          </div>
        )}
        
        {walletBalance && (
          <div className="mt-2 p-2 bg-white rounded text-xs">
            <strong>Balance:</strong> ₹{walletBalance.balance}<br />
            <strong>Locked:</strong> ₹{walletBalance.locked_balance}
          </div>
        )}
        
        <div className="mt-2">
          <Button size="sm" onClick={refreshWalletBalance} disabled={!user}>
            Refresh Wallet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 