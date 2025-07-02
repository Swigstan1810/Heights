#!/usr/bin/env node
/**
 * Wallet Generator for Heights Platform
 * Generates secure wallet addresses for development/testing
 * Usage: node scripts/generate-wallet.js
 */

const crypto = require('crypto');
const { ethers } = require('ethers');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function generateWallet() {
  log(`${colors.bold}🔐 Heights Wallet Generator${colors.reset}\n`);
  
  // Generate a random wallet
  const wallet = ethers.Wallet.createRandom();
  
  log(`${colors.bold}Generated Wallet:${colors.reset}`);
  log(`Address: ${colors.green}${wallet.address}${colors.reset}`);
  log(`Private Key: ${colors.yellow}${wallet.privateKey}${colors.reset}`);
  log(`Mnemonic: ${colors.blue}${wallet.mnemonic.phrase}${colors.reset}\n`);
  
  log(`${colors.bold}Environment Variables:${colors.reset}`);
  log(`NEXT_PUBLIC_ADMIN_WALLET=${wallet.address}`);
  log(`PRIVATE_KEY=${wallet.privateKey}`);
  log(`FEE_RECIPIENT_MAINNET=${wallet.address}`);
  log(`FEE_RECIPIENT_TESTNET=${wallet.address}\n`);
  
  log(`${colors.red}⚠️  SECURITY WARNING:${colors.reset}`);
  log('• NEVER share your private key with anyone');
  log('• Store it securely (preferably in a hardware wallet for production)');
  log('• Use different addresses for different purposes');
  log('• This is for TESTING only - generate new keys for production\n');
  
  log(`${colors.bold}Next Steps:${colors.reset}`);
  log('1. Copy the environment variables to your .env.local file');
  log('2. Add testnet funds to this address for testing');
  log('3. For production, use a hardware wallet or secure key management');
}

// Generate multiple wallets if requested
const numWallets = process.argv[2] ? parseInt(process.argv[2]) : 1;

if (numWallets > 1) {
  log(`${colors.bold}🔐 Generating ${numWallets} Wallets${colors.reset}\n`);
  
  for (let i = 1; i <= numWallets; i++) {
    const wallet = ethers.Wallet.createRandom();
    log(`${colors.bold}Wallet ${i}:${colors.reset}`);
    log(`Address: ${colors.green}${wallet.address}${colors.reset}`);
    log(`Private Key: ${colors.yellow}${wallet.privateKey}${colors.reset}\n`);
  }
} else {
  generateWallet();
}