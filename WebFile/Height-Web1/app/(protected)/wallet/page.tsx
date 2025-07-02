"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus,
  Send,
  Download,
  RefreshCw,
  ExternalLink,
  Info,
  TrendingUp,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { HeightsWallet } from '@/components/wallet/heights-wallet';
import { toast } from 'sonner';

interface WalletBalance {
  asset: string;
  symbol: string;
  balance: number;
  usdValue: number;
  change24h: number;
  network: string;
}

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'trade' | 'deposit';
  asset: string;
  amount: number;
  usdValue: number;
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  from?: string;
  to?: string;
}

export default function WalletPage() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      // Load balances
      const balancesResponse = await fetch(`/api/wallet/balances?userId=${user?.id}`);
      if (balancesResponse.ok) {
        const balancesData = await balancesResponse.json();
        setBalances(balancesData.balances || []);
        setTotalValue(balancesData.totalValue || 0);
      }

      // Load transactions
      const transactionsResponse = await fetch(`/api/wallet/transactions?userId=${user?.id}`);
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.transactions || []);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'receive':
        return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case 'trade':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case 'deposit':
        return <Download className="h-4 w-4 text-purple-600" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-600">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallet</h1>
          <p className="text-muted-foreground">
            Manage your crypto assets and transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadWalletData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowBalances(!showBalances)}>
            {showBalances ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showBalances ? 'Hide' : 'Show'} Balances
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showBalances ? formatCurrency(totalValue) : '••••••'}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all networks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balances.length}</div>
            <p className="text-xs text-muted-foreground">
              Different cryptocurrencies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Secure</div>
            <p className="text-xs text-muted-foreground">
              Non-custodial wallet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Wallet Interface */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="heights-wallet">Heights Wallet</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="send">Send</TabsTrigger>
          <TabsTrigger value="receive">Receive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Asset Balances */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Balances</CardTitle>
              <CardDescription>
                Your cryptocurrency holdings across all networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : balances.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by creating your Heights wallet or depositing crypto
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Assets
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {balances.map((balance) => (
                    <div key={`${balance.asset}-${balance.network}`} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {balance.symbol.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{balance.asset}</div>
                          <div className="text-sm text-muted-foreground">{balance.network}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {showBalances ? balance.balance.toFixed(6) : '••••••'} {balance.symbol}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {showBalances ? formatCurrency(balance.usdValue) : '••••••'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heights-wallet" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Heights Wallet is your non-custodial wallet for secure crypto storage and trading on Arbitrum.
            </AlertDescription>
          </Alert>
          <HeightsWallet />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Recent wallet activity and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                  <p className="text-muted-foreground">
                    Your transaction history will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <div className="font-medium capitalize">{transaction.type}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(transaction.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {transaction.amount.toFixed(6)} {transaction.asset}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(transaction.usdValue)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(transaction.status)}
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Crypto</CardTitle>
              <CardDescription>
                Send cryptocurrency to another wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Send Feature</h3>
                <p className="text-muted-foreground mb-4">
                  This feature will be available once you create your Heights wallet
                </p>
                <Button variant="outline">
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receive Crypto</CardTitle>
              <CardDescription>
                Get your wallet address to receive cryptocurrency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Receive Feature</h3>
                <p className="text-muted-foreground mb-4">
                  Your wallet address will be displayed here once you create your Heights wallet
                </p>
                <Button variant="outline">
                  Create Wallet First
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}