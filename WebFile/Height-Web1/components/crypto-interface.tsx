"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { 
  ArrowUp, 
  ArrowDown, 
  ChevronUp, 
  ChevronDown, 
  DollarSign, 
  Wallet, 
  Clock, 
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HeightsTokenABI from "@/public/HeightsToken.json";

// Types
interface TokenInfo {
  name: string;
  symbol: string;
  decimals?: number;
}

interface TransferEvent {
  type: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
  txHash: string;
  blockNumber: number;
}

interface ApprovalEvent {
  owner: string;
  spender: string;
  value: string;
  timestamp: string;
  txHash: string;
  blockNumber: number;
}

// Constants - add these to your constants file
const SUPPORTED_CHAINS: number[] = [11155111]; // Sepolia testnet
const CONTRACT_ADDRESS = '0x51cDdeBb33814F660415dF040Afd6d6124670682'; 
const NETWORK_NAMES: { [key: number]: string } = {
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  137: 'Polygon Mainnet',
  80001: 'Mumbai Testnet',
};
const EXPLORER_TX_URLS: { [key: number]: string } = {
  1: 'https://etherscan.io/tx/',
  5: 'https://goerli.etherscan.io/tx/',
  11155111: 'https://sepolia.etherscan.io/tx/',
  137: 'https://polygonscan.com/tx/',
  80001: 'https://mumbai.polygonscan.com/tx/',
};

// Helper functions
const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const formatTxLink = (txHash: string, chainId: number | null): string => {
  if (!chainId) return `https://etherscan.io/tx/${txHash}`;
  const baseUrl = EXPLORER_TX_URLS[chainId] || 'https://etherscan.io/tx/';
  return `${baseUrl}${txHash}`;
};

const parseTokenAmount = (amount: string, decimals: number = 18): ethers.BigNumberish | null => {
  try {
    return ethers.parseUnits(amount.toString(), decimals);
  } catch (error) {
    console.error("Error parsing token amount:", error);
    return null;
  }
};

const isValidAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch (error) {
    return false;
  }
};

export default function CryptoInterface() {
  // Web3 state
  const [account, setAccount] = useState<string>('');
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string>('');
  
  // Token state
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    name: 'Heights Token',
    symbol: 'HTK'
  });
  const [balance, setBalance] = useState<string>('0');
  
  // UI state
  const [activeTab, setActiveTab] = useState<string>('balance');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  
  // Form state
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [spender, setSpender] = useState<string>('');
  const [currentAllowance, setCurrentAllowance] = useState<string>('0');
  const [showCurrentAllowance, setShowCurrentAllowance] = useState<boolean>(false);
  
  // Transaction history
  const [transfers, setTransfers] = useState<TransferEvent[]>([]);
  const [approvals, setApprovals] = useState<ApprovalEvent[]>([]);
  const [historyTab, setHistoryTab] = useState<string>('transfers');
  
  // Initialize Web3 on component mount
  useEffect(() => {
    checkIfWalletIsConnected();
    
    if (typeof window !== 'undefined' && window.ethereum) {
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          disconnectWallet();
        }
      });
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        setupProviderAndContract(newChainId);
      });
    }
    
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  // Load token details when connected
  useEffect(() => {
    if (isConnected) {
      fetchTokenDetails();
      fetchBalance();
      fetchTransactionHistory();
    }
  }, [isConnected, account]);

  const checkIfWalletIsConnected = async (): Promise<void> => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        setConnectionError('Please install MetaMask or another Ethereum wallet');
        return;
      }
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        
        // Get the current chain ID
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainIdHex, 16);
        setChainId(currentChainId);
        
        await setupProviderAndContract(currentChainId);
        setIsConnected(true);
      }
    } catch (error) {
      console.error("Error checking if wallet is connected:", error);
      setConnectionError('Error connecting to wallet');
    }
  };

  const setupProviderAndContract = async (currentChainId: number): Promise<void> => {
    try {
      // Reset the connection error
      setConnectionError('');
      
      // Check if the chain is supported
      if (!SUPPORTED_CHAINS.includes(currentChainId)) {
        setConnectionError(`Network not supported. Please switch to Sepolia testnet.`);
        setIsConnected(false);
        return;
      }
      
      if (typeof window === 'undefined' || !window.ethereum) {
        setConnectionError('Please install MetaMask or another Ethereum wallet');
        return;
      }
      
      // Setup provider and contract
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethProvider);
      
      const signer = await ethProvider.getSigner();
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, HeightsTokenABI.abi, signer);
      setContract(tokenContract);
      
      setIsConnected(true);
    } catch (error) {
      console.error("Error setting up provider and contract:", error);
      setConnectionError('Error connecting to blockchain');
      setIsConnected(false);
    }
  };

  const connectWallet = async (): Promise<void> => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        setConnectionError('Please install MetaMask or another Ethereum wallet');
        return;
      }
      
      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      
      // Get the current chain ID
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainIdHex, 16);
      setChainId(currentChainId);
      
      await setupProviderAndContract(currentChainId);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setConnectionError('Error connecting to wallet');
    }
  };

  const disconnectWallet = (): void => {
    setAccount('');
    setChainId(null);
    setProvider(null);
    setContract(null);
    setIsConnected(false);
  };

  const fetchTokenDetails = async (): Promise<void> => {
    if (!contract) return;

    try {
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals()
      ]);

      setTokenInfo({ name, symbol, decimals: Number(decimals) });
    } catch (err) {
      console.error('Error fetching token details:', err);
    }
  };

  const fetchBalance = async (): Promise<void> => {
    if (!contract || !account) return;
    
    setLoading(true);
    setError('');
    
    try {
      const balance = await contract.balanceOf(account);
      const formattedBalance = ethers.formatUnits(balance, 18);
      setBalance(formattedBalance);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch balance');
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSuccessMessage('');
    setError('');
    
    // Validate form
    if (!recipient) {
      setError('Recipient address is required');
      return;
    }
    
    if (!isValidAddress(recipient)) {
      setError('Invalid recipient address');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    
    if (parseFloat(amount) > parseFloat(balance)) {
      setError('Insufficient balance');
      return;
    }
    
    setLoading(true);
    setTxHash('');
    
    try {
      const parsedAmount = parseTokenAmount(amount);
      if (!parsedAmount) {
        setError('Invalid amount');
        setLoading(false);
        return;
      }
      
      if (!contract) {
        setError('Contract not initialized');
        setLoading(false);
        return;
      }
      
      const tx = await contract.transfer(recipient, parsedAmount);
      setTxHash(tx.hash);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      setSuccessMessage(`Successfully transferred ${amount} HTK to ${recipient}`);
      setRecipient('');
      setAmount('');
      fetchBalance();
      fetchTransactionHistory();
      setLoading(false);
    } catch (err: any) {
      console.error('Error transferring tokens:', err);
      setError(err.message || 'Transfer failed');
      setLoading(false);
    }
  };

  const handleCheckAllowance = async (): Promise<void> => {
    if (!isValidAddress(spender)) {
      setError('Invalid spender address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (!contract || !account) {
        setError('Contract or account not initialized');
        setLoading(false);
        return;
      }
      
      const allowance = await contract.allowance(account, spender);
      const formattedAllowance = ethers.formatUnits(allowance, 18);
      setCurrentAllowance(formattedAllowance);
      setShowCurrentAllowance(true);
      setLoading(false);
    } catch (err) {
      console.error('Error getting allowance:', err);
      setError('Failed to fetch allowance');
      setLoading(false);
    }
  };

  const handleApprove = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSuccessMessage('');
    
    // Validate form
    if (!spender) {
      setError('Spender address is required');
      return;
    }
    
    if (!isValidAddress(spender)) {
      setError('Invalid spender address');
      return;
    }
    
    if (!amount || parseFloat(amount) < 0) {
      setError('Amount must be greater than or equal to 0');
      return;
    }
    
    setLoading(true);
    setError('');
    setTxHash('');
    
    try {
      const parsedAmount = parseTokenAmount(amount);
      if (!parsedAmount) {
        setError('Invalid amount');
        setLoading(false);
        return;
      }
      
      if (!contract) {
        setError('Contract not initialized');
        setLoading(false);
        return;
      }
      
      const tx = await contract.approve(spender, parsedAmount);
      setTxHash(tx.hash);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      setSuccessMessage(`Successfully approved ${amount} HTK for ${spender}`);
      await handleCheckAllowance();
      fetchTransactionHistory();
      setLoading(false);
    } catch (err: any) {
      console.error('Error approving tokens:', err);
      setError(err.message || 'Approval failed');
      setLoading(false);
    }
  };

  const fetchTransactionHistory = async (): Promise<void> => {
    if (!contract || !provider || !account) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Get current block number
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Look back ~10000 blocks
      
      // Create filter for Transfer events where the user is sender or recipient
      const transferFilter = contract.filters.Transfer(account, null);
      const transferFilterTo = contract.filters.Transfer(null, account);
      
      // Create filter for Approval events where the user is the owner
      const approvalFilter = contract.filters.Approval(account, null);
      
      // Query the events
      const [sentTransfers, receivedTransfers, approvalEvents] = await Promise.all([
        contract.queryFilter(transferFilter, fromBlock, 'latest'),
        contract.queryFilter(transferFilterTo, fromBlock, 'latest'),
        contract.queryFilter(approvalFilter, fromBlock, 'latest')
      ]);
      
      // Process Transfer events
      const allTransfers = [...sentTransfers, ...receivedTransfers].map((event: ethers.Log & { args?: { from: string; to: string; value: ethers.BigNumberish } }) => {
        const { from, to, value } = event.args || {};
        const isReceived = to && to.toLowerCase() === account.toLowerCase();
        
        return {
          type: isReceived ? 'Received' : 'Sent',
          from: from || '',
          to: to || '',
          value: value ? ethers.formatUnits(value, 18) : '0',
          timestamp: 'Pending...',
          txHash: event.transactionHash || '',
          blockNumber: event.blockNumber || 0
        };
      });
      
      // Process Approval events
      const allApprovals = approvalEvents.map((event: ethers.EventLog | ethers.Log) => {
        const { owner, spender, value } = (event as ethers.EventLog).args || {};
        
        return {
          owner: owner || '',
          spender: spender || '',
          value: value ? ethers.formatUnits(value, 18) : '0',
          timestamp: 'Pending...',
          txHash: event.transactionHash || '',
          blockNumber: event.blockNumber || 0
        };
      });
      
      // Sort events by block number (descending)
      allTransfers.sort((a, b) => b.blockNumber - a.blockNumber);
      allApprovals.sort((a, b) => b.blockNumber - a.blockNumber);
      
      // Get block timestamps
      const uniqueBlocks = new Set([
        ...allTransfers.map(tx => tx.blockNumber),
        ...allApprovals.map(tx => tx.blockNumber)
      ]);
      
      const blockPromises = Array.from(uniqueBlocks).map(blockNumber => 
        provider.getBlock(blockNumber)
      );
      
      const blocks = await Promise.all(blockPromises);
      const blockTimestamps: {[key: number]: Date} = {};
      
      blocks.forEach(block => {
        if (block) {
          blockTimestamps[block.number] = new Date(Number(block.timestamp) * 1000);
        }
      });
      
      // Add timestamps to events
      allTransfers.forEach(tx => {
        if (blockTimestamps[tx.blockNumber]) {
          tx.timestamp = blockTimestamps[tx.blockNumber].toLocaleString();
        }
      });
      
      allApprovals.forEach(tx => {
        if (blockTimestamps[tx.blockNumber]) {
          tx.timestamp = blockTimestamps[tx.blockNumber].toLocaleString();
        }
      });
      
      setTransfers(allTransfers);
      setApprovals(allApprovals);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load transaction history');
      setLoading(false);
    }
  };

  // Render the wallet connection UI
  const renderWalletSection = () => {
    return (
      <div className="wallet-section bg-card rounded-lg p-6 border border-border shadow-sm mb-6">
        {isConnected ? (
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold mb-2">Connected Wallet</h2>
              <div className="flex items-center">
                <div className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full mr-2">
                  {chainId && NETWORK_NAMES[chainId] ? NETWORK_NAMES[chainId] : `Chain ID: ${chainId}`}
                </div>
                <span className="font-mono">{shortenAddress(account)}</span>
              </div>
            </div>
            <Button 
              onClick={disconnectWallet}
              className="w-full md:w-auto bg-red-600 hover:bg-red-700"
            >
              Disconnect Wallet
            </Button>
          </div>
        ) : (
          <div className="flex flex-col">
            <h2 className="text-xl font-bold mb-4">Connect to Blockchain</h2>
            {connectionError && (
              <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md mb-4">
                {connectionError}
              </div>
            )}
            <Button 
              onClick={connectWallet}
              className="w-full md:w-auto bg-primary hover:bg-primary/90"
            >
              Connect Wallet
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Render the token balance display
  const renderBalanceSection = () => {
    return (
      <div className="balance-container">
        <div className="card bg-card rounded-lg p-6 border border-border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Token Balance</h2>
          
          <div className="balance-display text-center my-8">
            <h3 className="text-lg font-medium mb-2">Your Balance</h3>
            <div className="balance-value text-4xl font-bold text-primary mb-2">
              {loading ? (
                <div className="animate-pulse">Loading...</div>
              ) : (
                <span>{parseFloat(balance).toFixed(4)} {tokenInfo.symbol}</span>
              )}
            </div>
            <p className="text-muted-foreground">
              {tokenInfo.name} ({tokenInfo.symbol})
            </p>
          </div>
          
          <div className="balance-actions flex justify-center gap-4 mt-6">
            <Button 
              onClick={() => setActiveTab('transfer')} 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Send
            </Button>
            <Button 
              onClick={fetchBalance} 
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render the transfer form
  const renderTransferSection = () => {
    return (
      <div className="transfer-container">
        <div className="card bg-card rounded-lg p-6 border border-border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Transfer Tokens</h2>
          
          <div className="flex items-center justify-between mb-6 bg-accent/30 p-3 rounded-md">
            <span className="text-muted-foreground">Available Balance:</span>
            <span className="font-medium">{parseFloat(balance).toFixed(4)} {tokenInfo.symbol}</span>
          </div>
          
          <form onSubmit={handleTransfer}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="recipient" className="text-sm font-medium">Recipient Address</label>
                <Input
                  id="recipient"
                  type="text"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.0"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className="pl-10"
                  />
                  <span className="absolute right-3 top-3 text-muted-foreground">
                    {tokenInfo.symbol}
                  </span>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-xs mt-1 h-auto py-1"
                  onClick={() => setAmount(balance)}
                >
                  MAX
                </Button>
              </div>
              
              {error && (
                <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : 'Transfer Tokens'}
              </Button>
            </div>
          </form>
          
          {successMessage && (
            <div className="mt-4 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-md">
              {successMessage}
            </div>
          )}
          
          {txHash && (
            <div className="mt-4 text-sm">
              <a 
                href={formatTxLink(txHash, chainId)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-primary hover:underline"
              >
                View Transaction <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render the approval form
  const renderApprovalSection = () => {
    return (
      <div className="approval-container">
        <div className="card bg-card rounded-lg p-6 border border-border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Approve Token Spending</h2>
          
          <div className="mb-6 pb-6 border-b border-border">
            <h3 className="text-lg font-medium mb-3">Check Current Allowance</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                placeholder="Enter spender address (0x...)"
                value={spender}
                onChange={(e) => setSpender(e.target.value)}
                disabled={loading}
                className="flex-grow"
              />
              <Button 
                type="button"
                onClick={handleCheckAllowance}
                disabled={loading || !spender}
                className="whitespace-nowrap"
              >
                Check
              </Button>
            </div>
            
            {showCurrentAllowance && (
              <div className="mt-4 p-3 bg-accent/30 rounded-md">
                <p>Current allowance for this spender: <strong>{parseFloat(currentAllowance).toFixed(4)} {tokenInfo.symbol}</strong></p>
              </div>
            )}
          </div>
          
          <form onSubmit={handleApprove}>
            <h3 className="text-lg font-medium mb-3">Set Approval Amount</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="spender" className="text-sm font-medium">Spender Address</label>
                <Input
                  id="spender"
                  type="text"
                  placeholder="0x..."
                  value={spender}
                  onChange={(e) => setSpender(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="approve-amount" className="text-sm font-medium">Amount to Approve</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="approve-amount"
                    type="number"
                    placeholder="0.0"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className="pl-10"
                  />
                  <span className="absolute right-3 top-3 text-muted-foreground">
                    {tokenInfo.symbol}
                  </span>
                </div>
              </div>
              
              <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 p-3 rounded-md text-sm">
                <p><strong>Note:</strong> Setting an approval allows the specified address to transfer tokens on your behalf, up to the approved amount.</p>
              </div>
              
              {error && (
                <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading || !spender || amount === ''}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : 'Approve'}
              </Button>
            </div>
          </form>
          
          {successMessage && (
            <div className="mt-4 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-md">
              {successMessage}
            </div>
          )}
          
          {txHash && (
            <div className="mt-4 text-sm">
              <a 
                href={formatTxLink(txHash, chainId)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-primary hover:underline"
              >
                View Transaction <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render the transaction history section
  const renderHistorySection = () => {
    return (
      <div className="history-container">
        <div className="card bg-card rounded-lg p-6 border border-border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Transaction History</h2>
          
          <div className="flex space-x-2 mb-4">
            <Button
              variant={historyTab === 'transfers' ? 'default' : 'outline'}
              onClick={() => setHistoryTab('transfers')}
              className="text-sm"
              size="sm"
            >
              Transfers
            </Button>
            <Button
              variant={historyTab === 'approvals' ? 'default' : 'outline'}
              onClick={() => setHistoryTab('approvals')}
              className="text-sm"
              size="sm"
            >
              Approvals
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md">
              {error}
            </div>
          ) : (
            <>
              {historyTab === 'transfers' && (
                <div className="transfers-table">
                  {transfers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No transfer transactions found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr><th className="px-4 py-3 text-left font-medium">Type</th>
                            <th className="px-4 py-3 text-left font-medium">From</th>
                            <th className="px-4 py-3 text-left font-medium">To</th>
                            <th className="px-4 py-3 text-left font-medium">Amount</th>
                            <th className="px-4 py-3 text-left font-medium">Time</th>
                            <th className="px-4 py-3 text-left font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transfers.map((tx, index) => (
                            <tr key={index} className="border-b border-border hover:bg-muted/30">
                              <td className={`px-4 py-3 ${tx.type === 'Received' ? 'text-green-500' : 'text-red-500'}`}>
                                {tx.type}
                              </td>
                              <td className="px-4 py-3 font-mono">{shortenAddress(tx.from)}</td>
                              <td className="px-4 py-3 font-mono">{shortenAddress(tx.to)}</td>
                              <td className="px-4 py-3">{parseFloat(tx.value).toFixed(4)} {tokenInfo.symbol}</td>
                              <td className="px-4 py-3">{tx.timestamp}</td>
                              <td className="px-4 py-3">
                                <a 
                                  href={formatTxLink(tx.txHash, chainId)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center"
                                >
                                  View <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {historyTab === 'approvals' && (
                <div className="approvals-table">
                  {approvals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No approval transactions found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Spender</th>
                            <th className="px-4 py-3 text-left font-medium">Amount</th>
                            <th className="px-4 py-3 text-left font-medium">Time</th>
                            <th className="px-4 py-3 text-left font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {approvals.map((tx, index) => (
                            <tr key={index} className="border-b border-border hover:bg-muted/30">
                              <td className="px-4 py-3 font-mono">{shortenAddress(tx.spender)}</td>
                              <td className="px-4 py-3">{parseFloat(tx.value).toFixed(4)} {tokenInfo.symbol}</td>
                              <td className="px-4 py-3">{tx.timestamp}</td>
                              <td className="px-4 py-3">
                                <a 
                                  href={formatTxLink(tx.txHash, chainId)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center"
                                >
                                  View <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          <div className="mt-6 flex justify-center">
            <Button
              onClick={fetchTransactionHistory}
              disabled={loading}
              variant="outline"
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="crypto-interface-container container mx-auto px-4 pt-6 pb-16">
      <h1 className="text-3xl font-bold mb-2">Cryptocurrency</h1>
      <p className="text-muted-foreground mb-6">Manage and transfer your Heights Token (HTK) on the Ethereum blockchain</p>
      
      {renderWalletSection()}
      
      <div className="tab-navigation grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        <Button
          variant={activeTab === 'balance' ? 'default' : 'outline'}
          onClick={() => setActiveTab('balance')}
          className="w-full"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Balance
        </Button>
        <Button
          variant={activeTab === 'transfer' ? 'default' : 'outline'}
          onClick={() => setActiveTab('transfer')}
          className="w-full"
        >
          <ArrowUp className="h-4 w-4 mr-2" />
          Transfer
        </Button>
        <Button
          variant={activeTab === 'approve' ? 'default' : 'outline'}
          onClick={() => setActiveTab('approve')}
          className="w-full"
        >
          <ArrowDown className="h-4 w-4 mr-2" />
          Approve
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'outline'}
          onClick={() => setActiveTab('history')}
          className="w-full"
        >
          <Clock className="h-4 w-4 mr-2" />
          History
        </Button>
      </div>
      
      <div className="tab-content">
        {!isConnected ? (
          <div className="card bg-card rounded-lg p-6 border border-border shadow-sm">
            <div className="text-center py-8">
              <h2 className="text-xl font-bold mb-4">Connect Wallet to Continue</h2>
              <p className="text-muted-foreground mb-6">Please connect your Ethereum wallet to access the Heights Token features</p>
              <Button 
                onClick={connectWallet}
                className="bg-primary hover:bg-primary/90"
              >
                Connect Wallet
              </Button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'balance' && renderBalanceSection()}
            {activeTab === 'transfer' && renderTransferSection()}
            {activeTab === 'approve' && renderApprovalSection()}
            {activeTab === 'history' && renderHistorySection()}
          </>
        )}
      </div>
    </div>
  );
}