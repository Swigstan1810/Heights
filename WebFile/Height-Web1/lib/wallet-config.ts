// lib/wallet-config.ts
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors';

export const walletConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    coinbaseWallet({
      appName: 'Heights Trading',
      preference: 'smartWalletOnly', // For Coinbase Smart Wallet
    }),
    metaMask({
      dappMetadata: {
        name: 'Heights Trading',
      },
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
      metadata: {
        name: 'Heights Trading',
        description: 'Decentralized crypto trading platform',
        url: 'https://heights.app',
        icons: ['https://heights.app/icon.png'],
      },
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});