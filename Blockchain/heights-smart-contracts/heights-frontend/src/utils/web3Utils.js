import { ethers } from 'ethers';
import { TOKEN_DECIMALS } from './Constants';

// Format token amount from smallest unit (wei) to human-readable
export function formatTokenAmount(amount) {
  return ethers.formatUnits(amount, TOKEN_DECIMALS);
}

// Parse human-readable token amount to smallest unit (wei)
export function parseTokenAmount(amount) {
  return ethers.parseUnits(amount.toString(), TOKEN_DECIMALS);
}

// Shorten address for display
export function shortenAddress(address, chars = 4) {
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
}

// Format transaction hash link for explorer
export function formatTxLink(txHash, chainId) {
  const baseUrl = getExplorerUrl(chainId);
  return baseUrl ? `${baseUrl}/tx/${txHash}` : '#';
}

// Get explorer URL for the current network
export function getExplorerUrl(chainId) {
  const explorers = {
    1: 'https://etherscan.io',              // Ethereum Mainnet
    11155111: 'https://sepolia.etherscan.io', // Sepolia Testnet
  };
  
  return explorers[chainId] || '';
}

// Check if address is valid
export function isValidAddress(address) {
  return ethers.isAddress(address);
}