// lib/services/coinbase.ts
import { CdpClient } from '@coinbase/cdp-sdk';

export interface CoinbaseConfig {
  apiKeyId: string;
  apiKeySecret: string;
  walletSecret?: string;
}

export class CoinbaseService {
  private client: CdpClient;

  constructor(config: CoinbaseConfig) {
    this.client = new CdpClient({
      apiKeyId: config.apiKeyId,
      apiKeySecret: config.apiKeySecret,
      walletSecret: config.walletSecret,
    });
  }

  // Create a new EVM account
  async createEvmAccount(name?: string) {
    return await this.client.evm.createAccount({ name });
  }

  // Send ETH on base-sepolia
  async sendEvmTransaction(
    fromAddress: `0x${string}`,
    to: `0x${string}`,
    amount: bigint
  ) {
    const { transactionHash } = await this.client.evm.sendTransaction({
      address: fromAddress,
      network: 'base-sepolia',
      transaction: {
        to,
        value: amount,
      },
    });
    return transactionHash;
  }
}