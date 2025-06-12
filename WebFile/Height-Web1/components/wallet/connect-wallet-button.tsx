// components/wallet/connect-wallet-button.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Wallet, 
  LogOut, 
  Copy, 
  CheckCircle2,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

export function ConnectWalletButton() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);
  const supabase = createClientComponentClient();

  // Save wallet connection to database
  useEffect(() => {
    const saveWalletConnection = async () => {
      if (isConnected && address && user && connector) {
        try {
          const { error } = await supabase
            .from('wallet_connections')
            .upsert({
              user_id: user.id,
              wallet_address: address.toLowerCase(),
              wallet_type: connector.id === 'coinbaseWalletSDK' ? 'coinbase_wallet' : 
                          connector.id === 'metaMask' ? 'metamask' : 
                          connector.id === 'walletConnect' ? 'walletconnect' : 
                          'coinbase_smart_wallet',
              chain_id: 1,
              is_active: true,
              last_used_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,wallet_address'
            });

          if (error) {
            console.error('Error saving wallet connection:', error);
          }
        } catch (error) {
          console.error('Failed to save wallet connection:', error);
        }
      }
    };

    saveWalletConnection();
  }, [isConnected, address, user, connector, supabase]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: bigint | undefined) => {
    if (!bal) return '0.00';
    const value = Number(bal) / 1e18;
    return value.toFixed(4);
  };

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">{formatAddress(address)}</span>
            <span className="inline sm:hidden">Wallet</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">Connected Wallet</p>
              <p className="text-xs text-muted-foreground">{connector?.name}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyAddress} className="gap-2">
            {copied ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="text-xs">{formatAddress(address)}</span>
          </DropdownMenuItem>
          {balance && (
            <DropdownMenuItem disabled>
              <span className="text-xs">
                Balance: {formatBalance(balance.value)} {balance.symbol}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => disconnect()} className="gap-2 text-red-600">
            <LogOut className="h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="relative">
      {showConnectors ? (
        <div className="flex flex-col gap-2 p-2 bg-background border rounded-lg shadow-lg">
          <p className="text-sm font-medium px-2">Choose wallet:</p>
          {connectors.map((connector) => (
            <Button
              key={connector.id}
              variant="ghost"
              size="sm"
              onClick={() => {
                connect({ connector });
                setShowConnectors(false);
              }}
              disabled={isPending}
              className="justify-start gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              {connector.name}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConnectors(false)}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => setShowConnectors(true)}
          disabled={isPending}
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="h-4 w-4" />
          )}
          Connect Wallet
        </Button>
      )}
    </div>
  );
}