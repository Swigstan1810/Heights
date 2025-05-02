// Network information
export const NETWORK_NAMES = {
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  137: 'Polygon Mainnet',
  80001: 'Mumbai Testnet',
  // Add other networks as needed
};

// Supported chain IDs
export const SUPPORTED_CHAINS = [11155111]; // Sepolia testnet only for now

// Contract information
export const CONTRACT_ADDRESS = '0x51cDdeBb33814F660415dF040Afd6d6124670682'; // Replace with your actual contract address
export const CONTRACT_ABI = [
  // ERC-20 standard functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Explorer URL templates
export const EXPLORER_TX_URLS = {
  1: 'https://etherscan.io/tx/',
  5: 'https://goerli.etherscan.io/tx/',
  11155111: 'https://sepolia.etherscan.io/tx/',
  137: 'https://polygonscan.com/tx/',
  80001: 'https://mumbai.polygonscan.com/tx/',
};

export const EXPLORER_ADDRESS_URLS = {
  1: 'https://etherscan.io/address/',
  5: 'https://goerli.etherscan.io/address/',
  11155111: 'https://sepolia.etherscan.io/address/',
  137: 'https://polygonscan.com/address/',
  80001: 'https://mumbai.polygonscan.com/address/',
};