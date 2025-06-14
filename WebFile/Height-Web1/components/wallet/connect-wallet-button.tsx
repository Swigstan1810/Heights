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
              wallet_type: connector.name.toLowerCase().replace(/\s+/g, '_'),
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

  const formatBalance = (val: bigint | undefined) => {
    if (!val) return '0.00';
    const value = Number(val) / 1e18;
    return value.toFixed(4);
  };

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2 h-9 px-3 font-medium"
          >
            <Wallet className="h-4 w-4" />
            <span>{formatAddress(address)}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">Connected</p>
              <p className="text-xs text-muted-foreground">{connector?.name}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyAddress} className="gap-2 cursor-pointer">
            {copied ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="text-xs font-mono">{address}</span>
          </DropdownMenuItem>
          {balance && (
            <DropdownMenuItem disabled>
              <span className="text-xs">
                Balance: {formatBalance(balance.value)} {balance.symbol}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => disconnect()} 
            className="gap-2 text-red-600 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Simple connect button
  if (connectors.length === 1) {
    return (
      <Button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className="gap-2 h-9 font-medium"
        variant="outline"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        Connect Wallet
      </Button>
    );
  }

  // Multiple connectors dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isPending}
          className="gap-2 h-9 font-medium"
          variant="outline"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="h-4 w-4" />
          )}
          Connect Wallet
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Choose Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {connectors.map((connector) => (
          <DropdownMenuItem
            key={connector.id}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="gap-2 cursor-pointer"
          >
            <Wallet className="h-4 w-4" />
            {connector.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}