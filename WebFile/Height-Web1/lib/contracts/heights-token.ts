// lib/contracts/heights-token.ts
import { ethers } from 'ethers';

// Heights Token ABI (essential functions only for smaller bundle size)
export const HEIGHTS_TOKEN_ABI = [
  // Standard ERC20 functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // Heights Token specific functions
  "function getTokenInfo() view returns (uint256 _totalSupply, uint256 _maxSupply, uint256 _maxWalletAmount, uint256 _maxTransactionAmount, uint256 _buyFee, uint256 _sellFee, uint256 _transferFee, address _feeRecipient, bool _tradingEnabled, uint256 _launchTime)",
  "function canTransact(address from, address to, uint256 amount) view returns (bool, string)",
  "function isExemptFromFees(address account) view returns (bool)",
  "function isExemptFromLimits(address account) view returns (bool)",
  "function isBot(address account) view returns (bool)",
  "function isExchange(address account) view returns (bool)",
  "function tradingEnabled() view returns (bool)",
  "function maxWalletAmount() view returns (uint256)",
  "function maxTransactionAmount() view returns (uint256)",
  
  // Admin functions (for interface completeness)
  "function enableTrading()",
  "function updateFees(uint256 _buyFee, uint256 _sellFee, uint256 _transferFee)",
  "function setFeeExemption(address account, bool exempt)",
  "function setLimitExemption(address account, bool exempt)",
  "function setExchangeStatus(address account, bool _isExchange)",
  "function setDEXRouterStatus(address account, bool _isDEXRouter)",
  "function setBotStatus(address account, bool _isBot)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function pause()",
  "function unpause()",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event TradingEnabled(uint256 timestamp)",
  "event FeesUpdated(uint256 buyFee, uint256 sellFee, uint256 transferFee)",
  "event BotDetected(address indexed account, uint256 timestamp)"
] as const;

// Contract addresses for different networks
export const HEIGHTS_TOKEN_ADDRESS = {
  // Arbitrum Mainnet
  42161: process.env.NEXT_PUBLIC_HGT_ADDRESS_ARBITRUM || '',
  
  // Arbitrum Sepolia (Testnet)
  421614: process.env.NEXT_PUBLIC_HGT_ADDRESS_ARBITRUM_SEPOLIA || '',
  
  // Arbitrum Goerli (Legacy Testnet)
  421613: process.env.NEXT_PUBLIC_HGT_ADDRESS_ARBITRUM_GOERLI || '',
  
  // Local/Default
  31337: process.env.NEXT_PUBLIC_HGT_ADDRESS || '0x0000000000000000000000000000000000000000'
} as const;

// Network configurations
export const ARBITRUM_NETWORKS = {
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
  },
  arbitrumSepolia: {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
  }
} as const;

/**
 * Heights Token Contract Helper Class
 */
export class HeightsTokenContract {
  private contract: ethers.Contract;
  private provider: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(provider: ethers.Provider, signer?: ethers.Signer, chainId?: number) {
    this.provider = provider;
    this.signer = signer;
    
    // Use provided chainId or default to Arbitrum mainnet
    const networkChainId = chainId || 42161;
    const address = this.getContractAddress(networkChainId);
    
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Heights Token not deployed on network ${networkChainId}`);
    }
    
    this.contract = new ethers.Contract(
      address,
      HEIGHTS_TOKEN_ABI,
      signer || provider
    );
  }

  /**
   * Get contract address for specific chain ID
   */
  private getContractAddress(chainId: number): string {
    return HEIGHTS_TOKEN_ADDRESS[chainId as keyof typeof HEIGHTS_TOKEN_ADDRESS] || '';
  }

  /**
   * Get token basic information
   */
  async getBasicInfo() {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      this.contract.name(),
      this.contract.symbol(),
      this.contract.decimals(),
      this.contract.totalSupply()
    ]);

    return {
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: ethers.formatUnits(totalSupply, decimals),
      address: await this.contract.getAddress()
    };
  }

  /**
   * Get comprehensive token information
   */
  async getTokenInfo() {
    const info = await this.contract.getTokenInfo();
    
    return {
      totalSupply: ethers.formatEther(info._totalSupply),
      maxSupply: ethers.formatEther(info._maxSupply),
      maxWalletAmount: ethers.formatEther(info._maxWalletAmount),
      maxTransactionAmount: ethers.formatEther(info._maxTransactionAmount),
      buyFee: Number(info._buyFee) / 100, // Convert from basis points to percentage
      sellFee: Number(info._sellFee) / 100,
      transferFee: Number(info._transferFee) / 100,
      feeRecipient: info._feeRecipient,
      tradingEnabled: info._tradingEnabled,
      launchTime: new Date(Number(info._launchTime) * 1000)
    };
  }

  /**
   * Get balance of specific address
   */
  async getBalance(address: string): Promise<string> {
    const balance = await this.contract.balanceOf(address);
    return ethers.formatEther(balance);
  }

  /**
   * Check if address can perform transaction
   */
  async canTransact(from: string, to: string, amount: string): Promise<{ canTransact: boolean; reason?: string }> {
    try {
      const amountWei = ethers.parseEther(amount);
      const result = await this.contract.canTransact(from, to, amountWei);
      
      return {
        canTransact: result[0],
        reason: result[0] ? undefined : result[1]
      };
    } catch (error) {
      return {
        canTransact: false,
        reason: error instanceof Error ? error.message : 'Transaction validation failed'
      };
    }
  }

  /**
   * Transfer tokens
   */
  async transfer(to: string, amount: string): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error('Signer required for transfer');
    }

    const amountWei = ethers.parseEther(amount);
    
    // Validate transaction first
    const signerAddress = await this.signer.getAddress();
    const validation = await this.canTransact(signerAddress, to, amount);
    
    if (!validation.canTransact) {
      throw new Error(`Transfer not allowed: ${validation.reason}`);
    }

    return this.contract.transfer(to, amountWei);
  }

  /**
   * Approve tokens for spending
   */
  async approve(spender: string, amount: string): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error('Signer required for approval');
    }

    const amountWei = ethers.parseEther(amount);
    return this.contract.approve(spender, amountWei);
  }

  /**
   * Get allowance
   */
  async getAllowance(owner: string, spender: string): Promise<string> {
    const allowance = await this.contract.allowance(owner, spender);
    return ethers.formatEther(allowance);
  }

  /**
   * Check various status flags
   */
  async getAddressStatus(address: string) {
    const [isExemptFromFees, isExemptFromLimits, isBot, isExchange] = await Promise.all([
      this.contract.isExemptFromFees(address),
      this.contract.isExemptFromLimits(address),
      this.contract.isBot(address),
      this.contract.isExchange(address)
    ]);

    return {
      isExemptFromFees,
      isExemptFromLimits,
      isBot,
      isExchange
    };
  }

  /**
   * Estimate transfer fees
   */
  async estimateTransferFee(from: string, to: string, amount: string): Promise<{
    feeAmount: string;
    feePercentage: number;
    netAmount: string;
    feeType: 'buy' | 'sell' | 'transfer';
  }> {
    const tokenInfo = await this.getTokenInfo();
    const addressStatus = await this.getAddressStatus(from);
    const toAddressStatus = await this.getAddressStatus(to);
    
    // If either address is exempt from fees, no fee
    if (addressStatus.isExemptFromFees || toAddressStatus.isExemptFromFees) {
      return {
        feeAmount: '0',
        feePercentage: 0,
        netAmount: amount,
        feeType: 'transfer'
      };
    }

    let feePercentage: number;
    let feeType: 'buy' | 'sell' | 'transfer';

    // Determine fee type based on exchange status
    if (toAddressStatus.isExchange) {
      feePercentage = tokenInfo.buyFee;
      feeType = 'buy';
    } else if (addressStatus.isExchange) {
      feePercentage = tokenInfo.sellFee;
      feeType = 'sell';
    } else {
      feePercentage = tokenInfo.transferFee;
      feeType = 'transfer';
    }

    const amountNum = parseFloat(amount);
    const feeAmount = (amountNum * feePercentage / 100).toString();
    const netAmount = (amountNum - parseFloat(feeAmount)).toString();

    return {
      feeAmount,
      feePercentage,
      netAmount,
      feeType
    };
  }

  /**
   * Listen to transfer events
   */
  onTransfer(callback: (from: string, to: string, amount: string, event: any) => void) {
    this.contract.on('Transfer', (from, to, amount, event) => {
      callback(from, to, ethers.formatEther(amount), event);
    });
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.contract.removeAllListeners();
  }

  /**
   * Get contract instance for advanced usage
   */
  getContract(): ethers.Contract {
    return this.contract;
  }

  /**
   * Static method to get contract address for network
   */
  static getAddressForNetwork(chainId: number): string {
    return HEIGHTS_TOKEN_ADDRESS[chainId as keyof typeof HEIGHTS_TOKEN_ADDRESS] || '';
  }

  /**
   * Static method to format display amount
   */
  static formatAmount(amount: string, decimals: number = 4): string {
    const num = parseFloat(amount);
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    return num.toFixed(decimals);
  }

  /**
   * Static method to validate address
   */
  static isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }
}

// Export contract factory function
export function createHeightsTokenContract(
  provider: ethers.Provider,
  signer?: ethers.Signer,
  chainId?: number
): HeightsTokenContract {
  return new HeightsTokenContract(provider, signer, chainId);
}

// Export utility functions
export const HeightsTokenUtils = {
  formatAmount: HeightsTokenContract.formatAmount,
  isValidAddress: HeightsTokenContract.isValidAddress,
  getAddressForNetwork: HeightsTokenContract.getAddressForNetwork,
  
  /**
   * Get network name from chain ID
   */
  getNetworkName(chainId: number): string {
    switch (chainId) {
      case 42161:
        return 'Arbitrum One';
      case 421614:
        return 'Arbitrum Sepolia';
      case 421613:
        return 'Arbitrum Goerli';
      default:
        return 'Unknown Network';
    }
  },

  /**
   * Get explorer URL for transaction
   */
  getExplorerUrl(chainId: number, txHash: string): string {
    const baseUrls: Record<number, string> = {
      42161: 'https://arbiscan.io/tx/',
      421614: 'https://sepolia.arbiscan.io/tx/',
      421613: 'https://goerli.arbiscan.io/tx/'
    };
    
    const baseUrl = baseUrls[chainId];
    return baseUrl ? `${baseUrl}${txHash}` : '#';
  },

  /**
   * Get explorer URL for address
   */
  getAddressExplorerUrl(chainId: number, address: string): string {
    const baseUrls: Record<number, string> = {
      42161: 'https://arbiscan.io/address/',
      421614: 'https://sepolia.arbiscan.io/address/',
      421613: 'https://goerli.arbiscan.io/address/'
    };
    
    const baseUrl = baseUrls[chainId];
    return baseUrl ? `${baseUrl}${address}` : '#';
  }
};

export default HeightsTokenContract;