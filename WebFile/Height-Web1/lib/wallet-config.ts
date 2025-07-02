// lib/wallet-config.ts
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, arbitrum, arbitrumGoerli } from 'wagmi/chains';
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors';

export const walletConfig = createConfig({
  chains: [mainnet, sepolia, arbitrum, arbitrumGoerli],
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
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [arbitrumGoerli.id]: http('https://goerli-rollup.arbitrum.io/rpc'),
  },
});