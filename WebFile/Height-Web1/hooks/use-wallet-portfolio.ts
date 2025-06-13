// hooks/use-wallet-portfolio.ts
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAccount, useBalance, useContractReads, usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/auth-context';

// Common ERC20 tokens on Ethereum mainnet
const COMMON_TOKENS = [
  { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
  { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
  { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
  { symbol: 'LINK', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18 },
  { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18 },
  { symbol: 'AAVE', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18 },
  { symbol: 'MATIC', address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', decimals: 18 },
];

// ERC20 ABI (minimal)
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'symbol', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'uint8' }],
  },
] as const;

interface TokenBalance {
  symbol: string;
  address: string;
  balance: bigint;
  decimals: number;
  formattedBalance: string;
  value?: number;
}

interface WalletPortfolio {
  ethBalance: bigint | undefined;
  formattedEthBalance: string;
  tokenBalances: TokenBalance[];
  totalValue: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useWalletPortfolio(): WalletPortfolio {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const { user } = useAuth();
  const publicClient = usePublicClient();
  const supabase = createClientComponentClient();
  
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch token balances
  const fetchTokenBalances = useCallback(async () => {
    if (!address || !publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch balances for all tokens
      const balancePromises = COMMON_TOKENS.map(async (token) => {
        try {
          const balance = await publicClient.readContract({
            address: token.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address],
          });

          return {
            symbol: token.symbol,
            address: token.address,
            balance: balance as bigint,
            decimals: token.decimals,
            formattedBalance: formatUnits(balance as bigint, token.decimals),
          };
        } catch (err) {
          console.error(`Error fetching ${token.symbol} balance:`, err);
          return null;
        }
      });

      const results = await Promise.all(balancePromises);
      const validBalances = results.filter((b): b is TokenBalance => 
        b !== null && b.balance > 0n
      );

      // Fetch prices for tokens with balances
      if (validBalances.length > 0) {
        const symbols = validBalances.map(b => b.symbol.toLowerCase()).join(',');
        const priceResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${symbols}&vs_currencies=usd`
        );
        const prices = await priceResponse.json();

        // Add USD values to balances
        validBalances.forEach(balance => {
          const price = prices[balance.symbol.toLowerCase()]?.usd || 0;
          balance.value = parseFloat(balance.formattedBalance) * price;
        });
      }

      setTokenBalances(validBalances);

      // Save to database for portfolio tracking
      if (user && validBalances.length > 0) {
        await syncWithDatabase(validBalances);
      }

    } catch (err) {
      console.error('Error fetching token balances:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, user]);

  // Sync with database
  const syncWithDatabase = async (balances: TokenBalance[]) => {
    if (!user || !address) return;

    try {
      // Update wallet holdings in database
      for (const balance of balances) {
        await supabase
          .from('portfolio_holdings')
          .upsert({
            user_id: user.id,
            symbol: balance.symbol,
            name: balance.symbol,
            asset_type: 'crypto',
            quantity: parseFloat(balance.formattedBalance),
            current_price: balance.value ? balance.value / parseFloat(balance.formattedBalance) : 0,
            wallet_address: address,
            is_wallet_holding: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,symbol,wallet_address'
          });
      }
    } catch (err) {
      console.error('Error syncing with database:', err);
    }
  };

  // Calculate total portfolio value
  useEffect(() => {
    let total = 0;

    // Add ETH value
    if (ethBalance && ethBalance.value) {
      const ethValue = parseFloat(formatUnits(ethBalance.value, 18));
      // Assume ETH price (in production, fetch from API)
      total += ethValue * 2000; // Mock price
    }

    // Add token values
    tokenBalances.forEach(balance => {
      if (balance.value) {
        total += balance.value;
      }
    });

    setTotalValue(total);
  }, [ethBalance, tokenBalances]);

  // Auto-fetch on mount and connection
  useEffect(() => {
    if (isConnected && address) {
      fetchTokenBalances();
    }
  }, [isConnected, address, fetchTokenBalances]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      fetchTokenBalances();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, address, fetchTokenBalances]);

  return {
    ethBalance: ethBalance?.value,
    formattedEthBalance: ethBalance ? formatUnits(ethBalance.value, 18) : '0',
    tokenBalances,
    totalValue,
    isLoading,
    error,
    refetch: fetchTokenBalances,
  };
}

// Hook for tracking transactions
export function useWalletTransactions(address?: string) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      // In production, use Etherscan API or similar
      const response = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY}`
      );
      
      const data = await response.json();
      if (data.status === '1') {
        setTransactions(data.result.slice(0, 20)); // Last 20 transactions
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchTransactions();
    }
  }, [address, fetchTransactions]);

  return { transactions, isLoading, refetch: fetchTransactions };
}