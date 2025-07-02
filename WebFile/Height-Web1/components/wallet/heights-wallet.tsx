// components/wallet/heights-wallet.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { ethers, Contract } from 'ethers';
import { HEIGHTS_TOKEN_ABI, HEIGHTS_TOKEN_ADDRESS } from '@/lib/contracts/heights-token';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Shield, 
  Key, 
  Download, 
  Upload,
  Copy,
  Eye,
  EyeOff,
  QrCode,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Unlock,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import CryptoJS from 'crypto-js';
import QRCode from 'qrcode';
import { loadStripe } from '@stripe/stripe-js';

interface WalletData {
  address: string;
  publicKey: string;
  encryptedPrivateKey: string;
  mnemonic?: string;
}

interface WalletBalance {
  ETH: string;
  HGT: string;
  USDC: string;
  [key: string]: string;
}

interface TokenTransfer {
  to: string;
  amount: string;
  token: 'ETH' | 'HGT' | 'USDC';
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function HeightsWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [balances, setBalances] = useState<WalletBalance>({ ETH: '0', HGT: '0', USDC: '0' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [transferData, setTransferData] = useState<TokenTransfer>({ to: '', amount: '', token: 'HGT' });
  const [showTransfer, setShowTransfer] = useState(false);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);

  // Load wallet from encrypted local storage
  useEffect(() => {
    const loadWallet = async () => {
      try {
        const encryptedWallet = localStorage.getItem(`heights_wallet_${user?.id}`);
        if (encryptedWallet) {
          const walletData = JSON.parse(encryptedWallet);
          setWallet(walletData);
          setIsLocked(true);
          
          // Check 2FA status
          const twoFAEnabled = localStorage.getItem(`heights_2fa_${user?.id}`) === 'true';
          setTwoFactorEnabled(twoFAEnabled);
        }
      } catch (error) {
        console.error('Error loading wallet:', error);
      }
    };

    if (user) {
      loadWallet();
    }
  }, [user]);

  // Generate QR code for address
  useEffect(() => {
    if (wallet?.address) {
      QRCode.toDataURL(wallet.address, { width: 200 })
        .then(setQrCode)
        .catch(console.error);
    }
  }, [wallet?.address]);

  // Create new wallet
  const createWallet = useCallback(async () => {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // Generate new wallet
      const newWallet = ethers.Wallet.createRandom();
      const mnemonic = newWallet.mnemonic?.phrase || '';
      
      // Encrypt private key
      const encryptedPrivateKey = CryptoJS.AES.encrypt(
        newWallet.privateKey,
        password
      ).toString();

      const walletData: WalletData = {
        address: newWallet.address,
        publicKey: newWallet.publicKey,
        encryptedPrivateKey,
        mnemonic: CryptoJS.AES.encrypt(mnemonic, password).toString()
      };

      // Save to local storage
      localStorage.setItem(
        `heights_wallet_${user?.id}`,
        JSON.stringify(walletData)
      );

      setWallet(walletData);
      setIsLocked(false);
      setShowMnemonic(true);
      toast.success('Wallet created successfully!');
      
      // Save wallet address to database
      await saveWalletToDatabase(newWallet.address);
      
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast.error('Failed to create wallet');
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, user]);

  // Import wallet from mnemonic
  const importWallet = useCallback(async () => {
    if (!mnemonic.trim()) {
      toast.error('Please enter your recovery phrase');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // Restore wallet from mnemonic
      const restoredWallet = ethers.Wallet.fromPhrase(mnemonic.trim());
      
      // Encrypt private key
      const encryptedPrivateKey = CryptoJS.AES.encrypt(
        restoredWallet.privateKey,
        password
      ).toString();

      const walletData: WalletData = {
        address: restoredWallet.address,
        publicKey: restoredWallet.publicKey,
        encryptedPrivateKey,
        mnemonic: CryptoJS.AES.encrypt(mnemonic, password).toString()
      };

      // Save to local storage
      localStorage.setItem(
        `heights_wallet_${user?.id}`,
        JSON.stringify(walletData)
      );

      setWallet(walletData);
      setIsLocked(false);
      toast.success('Wallet imported successfully!');
      
      // Save wallet address to database
      await saveWalletToDatabase(restoredWallet.address);
      
    } catch (error) {
      console.error('Error importing wallet:', error);
      toast.error('Invalid recovery phrase');
    } finally {
      setLoading(false);
    }
  }, [mnemonic, password, user]);

  // Unlock wallet
  const unlockWallet = useCallback(async () => {
    if (!wallet || !password) {
      toast.error('Please enter your password');
      return;
    }

    // Check 2FA if enabled
    if (twoFactorEnabled && !twoFactorCode) {
      toast.error('Please enter your 2FA code');
      return;
    }

    try {
      // Decrypt private key to verify password
      const decryptedKey = CryptoJS.AES.decrypt(
        wallet.encryptedPrivateKey,
        password
      ).toString(CryptoJS.enc.Utf8);

      if (!decryptedKey || !decryptedKey.startsWith('0x')) {
        throw new Error('Invalid password');
      }

      // Verify 2FA
      if (twoFactorEnabled) {
        const isValid = await verify2FA(twoFactorCode);
        if (!isValid) {
          toast.error('Invalid 2FA code');
          return;
        }
      }

      setIsLocked(false);
      toast.success('Wallet unlocked');
      
      // Load balances
      await loadBalances();
      
    } catch (error) {
      console.error('Error unlocking wallet:', error);
      toast.error('Invalid password');
    }
  }, [wallet, password, twoFactorEnabled, twoFactorCode]);

  // Lock wallet
  const lockWallet = useCallback(() => {
    setIsLocked(true);
    setPassword('');
    setTwoFactorCode('');
    toast.success('Wallet locked');
  }, []);

  // Load balances
  const loadBalances = useCallback(async () => {
    if (!wallet || isLocked) return;

    try {
      // Connect to Arbitrum RPC
      const provider = new ethers.JsonRpcProvider(
        'https://arb1.arbitrum.io/rpc'
      );

      // Get ETH balance
      const ethBalance = await provider.getBalance(wallet.address);
      const ethFormatted = ethers.formatEther(ethBalance);

      // Get HGT balance
      const hgtContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_HGT_ADDRESS!,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      const hgtBalance = await hgtContract.balanceOf(wallet.address);
      const hgtFormatted = ethers.formatEther(hgtBalance);

      // Get USDC balance
      const usdcContract = new ethers.Contract(
        '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // Arbitrum USDC
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      const usdcBalance = await usdcContract.balanceOf(wallet.address);
      const usdcFormatted = ethers.formatUnits(usdcBalance, 6);

      setBalances({
        ETH: ethFormatted,
        HGT: hgtFormatted,
        USDC: usdcFormatted
      });

    } catch (error) {
      console.error('Error loading balances:', error);
    }
  }, [wallet, isLocked]);

  // Stripe fiat onramp
  const handleFiatDeposit = useCallback(async (amount: number, currency: string) => {
    if (!wallet || isLocked) {
      toast.error('Please unlock your wallet first');
      return;
    }

    setLoading(true);
    try {
      // Create Stripe payment session
      const response = await fetch('/api/stripe/create-onramp-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          walletAddress: wallet.address,
          userId: user?.id
        })
      });

      const { sessionUrl } = await response.json();
      
      // Redirect to Stripe
      window.location.href = sessionUrl;
      
    } catch (error) {
      console.error('Fiat deposit error:', error);
      toast.error('Failed to initiate deposit');
    } finally {
      setLoading(false);
    }
  }, [wallet, isLocked, user]);

  // Export private key
  const exportPrivateKey = useCallback(() => {
    if (!wallet || isLocked || !password) return;

    try {
      const decryptedKey = CryptoJS.AES.decrypt(
        wallet.encryptedPrivateKey,
        password
      ).toString(CryptoJS.enc.Utf8);

      return decryptedKey;
    } catch (error) {
      console.error('Error exporting private key:', error);
      return null;
    }
  }, [wallet, isLocked, password]);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }, []);

  // Save wallet to database
  const saveWalletToDatabase = async (address: string) => {
    try {
      await fetch('/api/wallet/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          address,
          type: 'heights',
          network: 'arbitrum'
        })
      });
    } catch (error) {
      console.error('Error saving wallet to database:', error);
    }
  };

  // Verify 2FA
  const verify2FA = async (code: string): Promise<boolean> => {
    // Implement 2FA verification
    // This would verify against a TOTP secret stored securely
    return code === '123456'; // Placeholder
  };

  // Enable 2FA
  const enable2FA = useCallback(async () => {
    if (!user || isLocked) return;

    try {
      // Generate TOTP secret
      const response = await fetch('/api/auth/enable-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const { qrCode, secret } = await response.json();
      
      // Show QR code for user to scan
      setQrCode(qrCode);
      localStorage.setItem(`heights_2fa_${user.id}`, 'true');
      setTwoFactorEnabled(true);
      
      toast.success('2FA enabled successfully');
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast.error('Failed to enable 2FA');
    }
  }, [user, isLocked]);

  // Refresh balances
  useEffect(() => {
    if (!isLocked) {
      loadBalances();
      const interval = setInterval(loadBalances, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isLocked, loadBalances]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Heights Wallet</CardTitle>
              <CardDescription>Your non-custodial crypto wallet</CardDescription>
            </div>
          </div>
          
          {wallet && (
            <div className="flex items-center gap-2">
              {twoFactorEnabled && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  2FA
                </Badge>
              )}
              <Button
                size="sm"
                variant={isLocked ? "default" : "outline"}
                onClick={isLocked ? unlockWallet : lockWallet}
                className="gap-2"
              >
                {isLocked ? (
                  <>
                    <Unlock className="h-4 w-4" />
                    Unlock
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Lock
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {!wallet ? (
          // Create or Import Wallet
          <Tabs defaultValue="create">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Wallet</TabsTrigger>
              <TabsTrigger value="import">Import Wallet</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Create a new wallet. Make sure to save your recovery phrase securely!
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Enter a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={createWallet}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Wallet...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Create Wallet
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="import" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Import an existing wallet using your 12 or 24 word recovery phrase.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Recovery Phrase</label>
                <textarea
                  className="w-full min-h-[100px] p-3 border rounded-lg"
                  placeholder="Enter your 12 or 24 word recovery phrase"
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Set a password for this wallet"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={importWallet}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing Wallet...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Wallet
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        ) : isLocked ? (
          // Unlock Wallet
          <div className="space-y-4">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Wallet Locked</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your password to unlock your wallet
              </p>
            </div>
            
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && unlockWallet()}
              />
            </div>
            
            {twoFactorEnabled && (
              <div className="space-y-2">
                <label className="text-sm font-medium">2FA Code</label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  maxLength={6}
                />
              </div>
            )}
            
            <Button 
              className="w-full" 
              onClick={unlockWallet}
              disabled={loading}
            >
              <Unlock className="h-4 w-4 mr-2" />
              Unlock Wallet
            </Button>
          </div>
        ) : (
          // Wallet Dashboard
          <Tabs defaultValue="assets">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="assets" className="space-y-4">
              {/* Wallet Address */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Wallet Address</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(wallet.address, 'Address')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs font-mono break-all">{wallet.address}</p>
              </div>
              
              {/* QR Code */}
              {qrCode && (
                <div className="flex justify-center">
                  <img src={qrCode} alt="Wallet QR Code" className="w-48 h-48" />
                </div>
              )}
              
              {/* Balances */}
              <div className="space-y-3">
                <h4 className="font-medium">Balances</h4>
                {Object.entries(balances).map(([token, balance]) => (
                  <div key={token} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{token}</span>
                    <span className="font-mono">{parseFloat(balance).toFixed(6)}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={loadBalances}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Balances
              </Button>
            </TabsContent>
            
            <TabsContent value="deposit" className="space-y-4">
              <h4 className="font-medium">Deposit Funds</h4>
              
              {/* Crypto Deposit */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  <span className="font-medium">Crypto Deposit</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Send crypto to your wallet address
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => copyToClipboard(wallet.address, 'Address')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Address
                </Button>
              </div>
              
              {/* Fiat Deposit */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Buy Crypto with Card</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Purchase crypto using debit/credit card via Stripe
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleFiatDeposit(100, 'USD')}
                  >
                    $100
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleFiatDeposit(500, 'USD')}
                  >
                    $500
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleFiatDeposit(1000, 'USD')}
                  >
                    $1000
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4">
              <h4 className="font-medium">Security Settings</h4>
              
              {/* 2FA */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    <span className="font-medium">Two-Factor Authentication</span>
                  </div>
                  <Badge variant={twoFactorEnabled ? "default" : "secondary"}>
                    {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                {!twoFactorEnabled && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={enable2FA}
                  >
                    Enable 2FA
                  </Button>
                )}
              </div>
              
              {/* Export Private Key */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  <span className="font-medium">Private Key</span>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Never share your private key. Anyone with this key can access your funds.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Input
                    type={showPrivateKey ? "text" : "password"}
                    value={showPrivateKey ? exportPrivateKey() || '' : '••••••••'}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <h4 className="font-medium">Wallet Settings</h4>
              
              {/* Change Password */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  <span className="font-medium">Change Password</span>
                </div>
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
              </div>
              
              {/* Delete Wallet */}
              <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-600">Delete Wallet</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. Make sure you have backed up your recovery phrase.
                </p>
                <Button variant="destructive" className="w-full">
                  Delete Wallet
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        {/* Recovery Phrase Modal */}
        {showMnemonic && wallet?.mnemonic && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-lg max-w-md w-full space-y-4">
              <h3 className="text-lg font-semibold">Save Your Recovery Phrase</h3>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Write down these words in order. You'll need them to recover your wallet.
                </AlertDescription>
              </Alert>
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-mono text-sm">
                  {(() => {
                    try {
                      return CryptoJS.AES.decrypt(wallet.mnemonic, password).toString(CryptoJS.enc.Utf8);
                    } catch {
                      return 'Error decrypting mnemonic';
                    }
                  })()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const decrypted = CryptoJS.AES.decrypt(wallet.mnemonic!, password).toString(CryptoJS.enc.Utf8);
                    copyToClipboard(decrypted, 'Recovery phrase');
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setShowMnemonic(false)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  I've Saved It
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}