import { ethers } from 'ethers';
import { EXPLORER_TX_URLS, EXPLORER_ADDRESS_URLS } from './Constants';

// Validate if address is a valid Ethereum address
export const isValidAddress = (address) => {
  try {
    return ethers.isAddress(address);
  } catch (error) {
    return false;
  }
};

// Shorten address for display (0x1234...5678)
export const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Format transaction link based on chain ID
export const formatTxLink = (txHash, chainId) => {
  const baseUrl = EXPLORER_TX_URLS[chainId] || 'https://etherscan.io/tx/';
  return `${baseUrl}${txHash}`;
};

// Format address link based on chain ID
export const formatAddressLink = (address, chainId) => {
  const baseUrl = EXPLORER_ADDRESS_URLS[chainId] || 'https://etherscan.io/address/';
  return `${baseUrl}${address}`;
};

// Format token amount with proper decimals
export const formatTokenAmount = (amount, decimals = 18) => {
  try {
    return ethers.formatUnits(amount, decimals);
  } catch (error) {
    console.error("Error formatting token amount:", error);
    return '0';
  }
};

// Parse token amount from user input to wei
export const parseTokenAmount = (amount, decimals = 18) => {
  try {
    return ethers.parseUnits(amount.toString(), decimals);
  } catch (error) {
    console.error("Error parsing token amount:", error);
    return null;
  }
};