"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Smartphone, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

export default function Enable2FAPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const generateSecret = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/enable-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) throw new Error('Failed to generate 2FA secret');

      const data = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setStep(2);
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      toast.error('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      // Here you would verify the code with your backend
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStep(3);
      toast.success('2FA enabled successfully!');
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast.error('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    toast.success('Backup codes copied to clipboard');
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Enable 2FA</h1>
          </div>
          <p className="text-muted-foreground">
            Add an extra layer of security to your account
          </p>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Step 1: Authenticator App
              </CardTitle>
              <CardDescription>
                You'll need an authenticator app like Google Authenticator, Authy, or 1Password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure you have an authenticator app installed on your device before continuing.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={generateSecret} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Step 2: Scan QR Code
              </CardTitle>
              <CardDescription>
                Scan this QR code with your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {qrCode && (
                <div className="flex justify-center">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Manual entry key:</label>
                <div className="flex gap-2">
                  <Input 
                    value={secret} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(secret, 'Secret key')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Enter verification code:</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg"
                />
              </div>

              <Button 
                onClick={verify2FA} 
                disabled={loading || verificationCode.length !== 6}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Enable 2FA'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                2FA Enabled Successfully!
              </CardTitle>
              <CardDescription>
                Save your backup codes in a secure location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  These backup codes can be used if you lose access to your authenticator app. 
                  Store them securely and don't share them with anyone.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Backup Codes:</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyBackupCodes}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="font-mono text-sm">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => router.push('/profile')}
                  className="flex-1"
                >
                  Go to Profile
                </Button>
                <Button 
                  onClick={() => router.push('/portfolio')}
                  variant="outline"
                  className="flex-1"
                >
                  Continue to App
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}