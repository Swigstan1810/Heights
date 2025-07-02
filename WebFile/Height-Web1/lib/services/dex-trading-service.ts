// lib/services/dex-trading-service.ts
import { ethers } from 'ethers';
import { createHeightsTokenContract, HeightsTokenContract } from '@/lib/contracts/heights-token';
import { toast } from 'sonner';

// Uniswap V3 Router ABI (essential functions)
const UNISWAP_V3_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut)",
  "function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external returns (uint256 amountIn)",
  "function multicall(bytes[] calldata data) external returns (bytes[] memory results)"
];

// Uniswap V3 Quoter ABI
const UNISWAP_V3_QUOTER_ABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
  "function quoteExactOutputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountOut, uint160 sqrtPriceLimitX96) external returns (uint256 amountIn)"
];

// ERC20 ABI for token interactions
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// Contract addresses on Arbitrum
const ARBITRUM_CONTRACTS = {
  UNISWAP_V3_ROUTER: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  UNISWAP_V3_QUOTER: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548'
};

// Pool fees for different pairs (0.01% = 100, 0.05% = 500, 0.3% = 3000, 1% = 10000)
const POOL_FEES = {
  STABLE: 500,    // 0.05% for stable pairs
  STANDARD: 3000, // 0.3% for standard pairs
  EXOTIC: 10000   // 1% for exotic pairs
};

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance?: string;
  price?: number;
}

export interface TradeQuote {
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  feeAmount: string;
  gasEstimate: string;
  route: string[];
  slippage: number;
}

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippage: number; // percentage (e.g., 0.5 for 0.5%)
  recipient?: string;
  deadline?: number; // seconds from now
}

export class DexTradingService {
  private provider: ethers.JsonRpcProvider;
  private signer?: ethers.Signer;
  private heightsContract?: HeightsTokenContract;
  private routerContract: ethers.Contract;
  private quoterContract: ethers.Contract;
  
  // Supported tokens on Arbitrum
  public readonly SUPPORTED_TOKENS: Record<string, TokenInfo> = {
    'ETH': {
      address: ARBITRUM_CONTRACTS.WETH,
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18
    },
    'WETH': {
      address: ARBITRUM_CONTRACTS.WETH,
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      decimals: 18
    },
    'USDC': {
      address: ARBITRUM_CONTRACTS.USDC,
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6
    },
    'USDT': {
      address: ARBITRUM_CONTRACTS.USDT,
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6
    },
    'DAI': {
      address: ARBITRUM_CONTRACTS.DAI,
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18
    },
    'ARB': {
      address: ARBITRUM_CONTRACTS.ARB,
      symbol: 'ARB',
      name: 'Arbitrum',
      decimals: 18
    },
    'HGT': {
      address: process.env.NEXT_PUBLIC_HGT_ADDRESS_ARBITRUM || '',
      symbol: 'HGT',
      name: 'Heights Token',
      decimals: 18
    }
  };

  constructor(provider?: ethers.JsonRpcProvider, signer?: ethers.Signer) {
    this.provider = provider || new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    this.signer = signer;
    
    this.routerContract = new ethers.Contract(
      ARBITRUM_CONTRACTS.UNISWAP_V3_ROUTER,
      UNISWAP_V3_ROUTER_ABI,
      signer || this.provider
    );
    
    this.quoterContract = new ethers.Contract(
      ARBITRUM_CONTRACTS.UNISWAP_V3_QUOTER,
      UNISWAP_V3_QUOTER_ABI,
      this.provider
    );

    // Initialize Heights Token contract if available
    if (this.SUPPORTED_TOKENS.HGT.address) {
      this.heightsContract = createHeightsTokenContract(this.provider, signer, 42161);
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(tokenSymbol: string, userAddress: string): Promise<string> {
    const token = this.SUPPORTED_TOKENS[tokenSymbol];
    if (!token) throw new Error(`Unsupported token: ${tokenSymbol}`);

    if (tokenSymbol === 'ETH') {
      const balance = await this.provider.getBalance(userAddress);
      return ethers.formatEther(balance);
    }

    if (tokenSymbol === 'HGT' && this.heightsContract) {
      return await this.heightsContract.getBalance(userAddress);
    }

    const tokenContract = new ethers.Contract(token.address, ERC20_ABI, this.provider);
    const balance = await tokenContract.balanceOf(userAddress);
    return ethers.formatUnits(balance, token.decimals);
  }

  /**
   * Get quote for token swap
   */
  async getSwapQuote(
    tokenInSymbol: string,
    tokenOutSymbol: string,
    amountIn: string
  ): Promise<TradeQuote> {
    const tokenIn = this.SUPPORTED_TOKENS[tokenInSymbol];
    const tokenOut = this.SUPPORTED_TOKENS[tokenOutSymbol];
    
    if (!tokenIn || !tokenOut) {
      throw new Error('Unsupported token pair');
    }

    // Determine pool fee based on token pair
    const fee = this.getPoolFee(tokenInSymbol, tokenOutSymbol);
    
    try {
      const amountInWei = ethers.parseUnits(amountIn, tokenIn.decimals);
      
      // Get quote from Uniswap V3
      const amountOutWei = await this.quoterContract.quoteExactInputSingle.staticCall(
        tokenIn.address,
        tokenOut.address,
        fee,
        amountInWei,
        0 // sqrtPriceLimitX96 (0 means no limit)
      );

      const amountOut = ethers.formatUnits(amountOutWei, tokenOut.decimals);
      
      // Calculate price impact
      const priceImpact = this.calculatePriceImpact(
        parseFloat(amountIn),
        parseFloat(amountOut),
        tokenInSymbol,
        tokenOutSymbol
      );

      // Estimate gas
      const gasEstimate = await this.estimateSwapGas(tokenInSymbol, tokenOutSymbol, amountIn);

      return {
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        priceImpact,
        feeAmount: (parseFloat(amountIn) * (fee / 1000000)).toString(), // Convert fee from basis points
        gasEstimate,
        route: [tokenInSymbol, tokenOutSymbol],
        slippage: 0.5 // Default 0.5%
      };

    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw new Error('Failed to get swap quote');
    }
  }

  /**
   * Execute token swap
   */
  async executeSwap(params: SwapParams): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error('Signer required for swap execution');
    }

    const tokenIn = this.SUPPORTED_TOKENS[params.tokenIn];
    const tokenOut = this.SUPPORTED_TOKENS[params.tokenOut];
    
    if (!tokenIn || !tokenOut) {
      throw new Error('Unsupported token pair');
    }

    const signerAddress = await this.signer.getAddress();
    const recipient = params.recipient || signerAddress;
    const deadline = Math.floor(Date.now() / 1000) + (params.deadline || 300); // 5 minutes default
    
    // Calculate minimum amount out with slippage
    const quote = await this.getSwapQuote(params.tokenIn, params.tokenOut, params.amountIn);
    const amountOutMinimum = ethers.parseUnits(
      (parseFloat(quote.amountOut) * (1 - params.slippage / 100)).toString(),
      tokenOut.decimals
    );

    const amountInWei = ethers.parseUnits(params.amountIn, tokenIn.decimals);
    const fee = this.getPoolFee(params.tokenIn, params.tokenOut);

    // Check and approve tokens if needed (except for ETH)
    if (params.tokenIn !== 'ETH') {
      await this.ensureTokenApproval(params.tokenIn, params.amountIn);
    }

    // Special handling for Heights Token
    if (params.tokenIn === 'HGT' && this.heightsContract) {
      const canTransact = await this.heightsContract.canTransact(
        signerAddress,
        ARBITRUM_CONTRACTS.UNISWAP_V3_ROUTER,
        params.amountIn
      );
      
      if (!canTransact.canTransact) {
        throw new Error(`Heights Token transfer not allowed: ${canTransact.reason}`);
      }
    }

    // Execute swap
    const swapParams = {
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
      fee,
      recipient,
      deadline,
      amountIn: amountInWei,
      amountOutMinimum,
      sqrtPriceLimitX96: 0
    };

    try {
      const tx = await this.routerContract.exactInputSingle(swapParams);
      
      toast.success(`Swap initiated: ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`);
      
      return tx;
    } catch (error) {
      console.error('Swap execution error:', error);
      toast.error('Swap failed');
      throw error;
    }
  }

  /**
   * Ensure token approval for router
   */
  private async ensureTokenApproval(tokenSymbol: string, amount: string): Promise<void> {
    if (!this.signer) throw new Error('Signer required');

    const token = this.SUPPORTED_TOKENS[tokenSymbol];
    const signerAddress = await this.signer.getAddress();
    
    if (tokenSymbol === 'HGT' && this.heightsContract) {
      const allowance = await this.heightsContract.getAllowance(
        signerAddress,
        ARBITRUM_CONTRACTS.UNISWAP_V3_ROUTER
      );
      
      if (parseFloat(allowance) < parseFloat(amount)) {
        const tx = await this.heightsContract.approve(
          ARBITRUM_CONTRACTS.UNISWAP_V3_ROUTER,
          ethers.parseEther(amount).toString()
        );
        await tx.wait();
      }
    } else {
      const tokenContract = new ethers.Contract(token.address, ERC20_ABI, this.signer);
      const allowance = await tokenContract.allowance(signerAddress, ARBITRUM_CONTRACTS.UNISWAP_V3_ROUTER);
      const amountWei = ethers.parseUnits(amount, token.decimals);
      
      if (allowance < amountWei) {
        const tx = await tokenContract.approve(ARBITRUM_CONTRACTS.UNISWAP_V3_ROUTER, amountWei);
        await tx.wait();
      }
    }
  }

  /**
   * Get appropriate pool fee for token pair
   */
  private getPoolFee(tokenIn: string, tokenOut: string): number {
    // Stable pairs
    if (this.isStablePair(tokenIn, tokenOut)) {
      return POOL_FEES.STABLE;
    }
    
    // HGT pairs (exotic)
    if (tokenIn === 'HGT' || tokenOut === 'HGT') {
      return POOL_FEES.EXOTIC;
    }
    
    // Standard pairs
    return POOL_FEES.STANDARD;
  }

  /**
   * Check if pair is a stable pair
   */
  private isStablePair(tokenIn: string, tokenOut: string): boolean {
    const stablecoins = ['USDC', 'USDT', 'DAI'];
    return stablecoins.includes(tokenIn) && stablecoins.includes(tokenOut);
  }

  /**
   * Calculate price impact (simplified)
   */
  private calculatePriceImpact(
    amountIn: number,
    amountOut: number,
    tokenIn: string,
    tokenOut: string
  ): number {
    // This is a simplified calculation
    // In production, you'd want to fetch actual pool reserves
    const baseRate = amountOut / amountIn;
    const marketRate = 1; // Would fetch from price feed
    
    return Math.abs((baseRate - marketRate) / marketRate) * 100;
  }

  /**
   * Estimate gas for swap
   */
  private async estimateSwapGas(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<string> {
    try {
      // Simplified gas estimation
      const baseGas = 150000; // Base gas for swap
      const gasPrice = (await this.provider.getFeeData()).gasPrice || ethers.parseUnits('0.1', 'gwei');
      
      const totalGas = BigInt(baseGas) * gasPrice;
      return ethers.formatEther(totalGas);
    } catch {
      return '0.001'; // Fallback estimate
    }
  }

  /**
   * Get user portfolio balances
   */
  async getUserPortfolio(userAddress: string): Promise<Record<string, TokenInfo>> {
    const portfolio: Record<string, TokenInfo> = {};
    
    for (const [symbol, token] of Object.entries(this.SUPPORTED_TOKENS)) {
      try {
        const balance = await this.getTokenBalance(symbol, userAddress);
        
        if (parseFloat(balance) > 0) {
          portfolio[symbol] = {
            ...token,
            balance
          };
        }
      } catch (error) {
        console.error(`Error fetching balance for ${symbol}:`, error);
      }
    }
    
    return portfolio;
  }

  /**
   * Get Heights Token specific info
   */
  async getHeightsTokenInfo(): Promise<any> {
    if (!this.heightsContract) {
      throw new Error('Heights Token not available');
    }
    
    return await this.heightsContract.getTokenInfo();
  }

  /**
   * Set signer for transactions
   */
  setSigner(signer: ethers.Signer): void {
    this.signer = signer;
    this.routerContract = this.routerContract.connect(signer);
    
    if (this.heightsContract) {
      this.heightsContract = createHeightsTokenContract(this.provider, signer, 42161);
    }
  }

  /**
   * Get transaction receipt and parse events
   */
  async getSwapTransactionDetails(txHash: string): Promise<{
    success: boolean;
    amountIn?: string;
    amountOut?: string;
    gasUsed?: string;
    effectiveGasPrice?: string;
  }> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return { success: false };
      }

      return {
        success: receipt.status === 1,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice?.toString()
      };
    } catch (error) {
      console.error('Error getting transaction details:', error);
      return { success: false };
    }
  }

  /**
   * Get supported token list
   */
  getSupportedTokens(): TokenInfo[] {
    return Object.values(this.SUPPORTED_TOKENS);
  }

  /**
   * Check if token is supported
   */
  isTokenSupported(symbol: string): boolean {
    return symbol in this.SUPPORTED_TOKENS;
  }
}

// Export singleton instance
export const dexTradingService = new DexTradingService();

export default DexTradingService;