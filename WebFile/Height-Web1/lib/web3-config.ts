// Network information
export const NETWORK_NAMES: { [key: number]: string } = {
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  137: 'Polygon Mainnet',
  80001: 'Mumbai Testnet',
};

// Supported chain IDs
export const SUPPORTED_CHAINS: number[] = [11155111]; // Sepolia testnet only for now

// Contract information
export const CONTRACT_ADDRESS: string = '0x51cDdeBb33814F660415dF040Afd6d6124670682'; // Heights Token contract address

// Explorer URL templates
export const EXPLORER_TX_URLS: { [key: number]: string } = {
  1: 'https://etherscan.io/tx/',
  5: 'https://goerli.etherscan.io/tx/',
  11155111: 'https://sepolia.etherscan.io/tx/',
  137: 'https://polygonscan.com/tx/',
  80001: 'https://mumbai.polygonscan.com/tx/',
};

export const EXPLORER_ADDRESS_URLS: { [key: number]: string } = {
  1: 'https://etherscan.io/address/',
  5: 'https://goerli.etherscan.io/address/',
  11155111: 'https://sepolia.etherscan.io/address/',
  137: 'https://polygonscan.com/address/',
  80001: 'https://mumbai.polygonscan.com/address/',
};

// Web3 utilities
export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const formatTxLink = (txHash: string, chainId: number | null): string => {
  if (!chainId) return `https://etherscan.io/tx/${txHash}`;
  const baseUrl = EXPLORER_TX_URLS[chainId] || 'https://etherscan.io/tx/';
  return `${baseUrl}${txHash}`;
};

export const formatAddressLink = (address: string, chainId: number | null): string => {
  if (!chainId) return `https://etherscan.io/address/${address}`;
  const baseUrl = EXPLORER_ADDRESS_URLS[chainId] || 'https://etherscan.io/address/';
  return `${baseUrl}${address}`;
};