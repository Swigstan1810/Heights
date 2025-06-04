// app/(protected)/profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe, 
  Camera, 
  Save, 
  Shield, 
  Settings, 
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Wallet,
  Star,
  TrendingUp,
  Edit3,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  google_avatar_url: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  location: string | null;
  website: string | null;
  timezone: string | null;
  auth_provider: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    phone_number: '',
    date_of_birth: '',
    location: '',
    website: '',
    timezone: 'Asia/Kolkata'
  });

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
          return;
        }

        if (data) {
          setProfile(data);
          setFormData({
            full_name: data.full_name || '',
            username: data.username || '',
            bio: data.bio || '',
            phone_number: data.phone_number || '',
            date_of_birth: data.date_of_birth || '',
            location: data.location || '',
            website: data.website || '',
            timezone: data.timezone || 'Asia/Kolkata'
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user, supabase]);

  const handleSave = async () => {
    if (!user || !profile) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        setMessage({ type: 'error', text: error.message });
        return;
      }

      setProfile(prev => prev ? { ...prev, ...formData, updated_at: new Date().toISOString() } : null);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeSinceJoined = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return null;
  }

  const avatarUrl = profile.google_avatar_url || profile.avatar_url;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your personal information and account preferences
            </p>
          </div>

          {message && (
            <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Summary Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="relative mx-auto mb-4">
                    <Avatar className="w-24 h-24 mx-auto">
                      <AvatarImage 
                        src={avatarUrl || undefined} 
                        alt={profile.full_name || user?.email || ''}
                        referrerPolicy="no-referrer"
                      />
                      <AvatarFallback className="text-lg bg-primary/10">
                        {getInitials(profile.full_name, profile.email)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full"
                      disabled // Avatar upload disabled for this demo
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-1">
                    {profile.full_name || 'User'}
                  </h3>
                  {profile.username && (
                    <p className="text-sm text-muted-foreground mb-2">@{profile.username}</p>
                  )}
                  <p className="text-sm text-muted-foreground mb-4">{profile.email}</p>
                  
                  <div className="flex justify-center gap-2 mb-4">
                    <Badge variant={profile.email_verified ? "default" : "secondary"}>
                      {profile.email_verified ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Unverified
                        </>
                      )}
                    </Badge>
                    <Badge variant="outline">
                      {profile.auth_provider === 'google' ? 'Google' : 'Email'}
                    </Badge>
                  </div>

                  {profile.bio && (
                    <p className="text-sm text-center mb-4 p-3 bg-muted/50 rounded-lg">
                      {profile.bio}
                    </p>
                  )}

                  <div className="text-xs text-muted-foreground">
                    <p>Member since {getTimeSinceJoined(profile.created_at)}</p>
                    <p>Last updated {formatDate(profile.updated_at)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Account Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Wallet Balance</span>
                    </div>
                    <span className="text-sm font-medium">₹0.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Watchlist Items</span>
                    </div>
                    <span className="text-sm font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Portfolio Value</span>
                    </div>
                    <span className="text-sm font-medium">₹0.00</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your personal details and preferences
                      </CardDescription>
                    </div>
                    <Button
                      variant={isEditing ? "outline" : "default"}
                      onClick={() => {
                        if (isEditing && !isSaving) {
                          setIsEditing(false);
                          // Reset form data
                          setFormData({
                            full_name: profile.full_name || '',
                            username: profile.username || '',
                            bio: profile.bio || '',
                            phone_number: profile.phone_number || '',
                            date_of_birth: profile.date_of_birth || '',
                            location: profile.location || '',
                            website: profile.website || '',
                            timezone: profile.timezone || 'Asia/Kolkata'
                          });
                        } else {
                          setIsEditing(true);
                        }
                      }}
                      disabled={isSaving}
                    >
                      {isEditing ? (
                        <>Cancel</>
                      ) : (
                        <>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                          disabled={!isEditing}
                          className="pl-10"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-muted-foreground">@</span>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                          disabled={!isEditing}
                          className="pl-8"
                          placeholder="Choose a unique username"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          value={profile.email}
                          disabled
                          className="pl-10 bg-muted"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone_number"
                          value={formData.phone_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                          disabled={!isEditing}
                          className="pl-10"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          disabled={!isEditing}
                          className="pl-10"
                          placeholder="City, Country"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                          disabled={!isEditing}
                          className="pl-10"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <select
                          id="timezone"
                          value={formData.timezone}
                          onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-3 py-2 rounded-md border border-border bg-background disabled:bg-muted"
                        >
                          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">America/New_York (EST)</option>
                          <option value="Europe/London">Europe/London (GMT)</option>
                          <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      disabled={!isEditing}
                      rows={3}
                      placeholder="Tell us a bit about yourself..."
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.bio.length}/160 characters
                    </p>
                  </div>

                  {isEditing && (
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="flex-1 sm:flex-none"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security & Privacy
                  </CardTitle>
                  <CardDescription>
                    Manage your account security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Email Verification</h4>
                      <p className="text-sm text-muted-foreground">
                        {profile.email_verified 
                          ? 'Your email address has been verified' 
                          : 'Please verify your email address'
                        }
                      </p>
                    </div>
                    <Badge variant={profile.email_verified ? "default" : "secondary"}>
                      {profile.email_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Enable 2FA
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Login Method</h4>
                      <p className="text-sm text-muted-foreground">
                        You're signed in with {profile.auth_provider === 'google' ? 'Google' : 'email and password'}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {profile.auth_provider === 'google' ? (
                        <>
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
                        </>
                      ) : (
                        <>
                          <Mail className="mr-1 h-3 w-3" />
                          Email
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Account Data</h4>
                      <p className="text-sm text-muted-foreground">
                        Download or delete your account data
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled>
                        Export Data
                      </Button>
                      <Button variant="outline" size="sm" disabled className="text-red-600">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Log */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your recent account activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Account created</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(profile.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    {profile.updated_at !== profile.created_at && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Profile updated</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(profile.updated_at)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No recent trading activity
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}