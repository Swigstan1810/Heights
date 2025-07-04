#!/usr/bin/env node

/**
 * Setup Deployment Wallet Script
 * Creates a new wallet or shows existing wallet info for deployment
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔐 Heights Token Deployment Wallet Setup\n');

  // Check if private key exists in environment
  const existingPrivateKey = process.env.PRIVATE_KEY;
  
  if (existingPrivateKey && existingPrivateKey !== '0x1234567890123456789012345678901234567890123456789012345678901234') {
    console.log('✅ Found existing deployment wallet in environment\n');
    
    // Show wallet info
    const wallet = new ethers.Wallet(existingPrivateKey);
    console.log(`📍 Address: ${wallet.address}`);
    console.log('💡 This wallet will be used for deployment\n');
    
    // Check balance on different networks
    await checkBalances(wallet.address);
  } else {
    console.log('🆕 No deployment wallet found. Creating new wallet...\n');
    
    // Generate new wallet
    const wallet = ethers.Wallet.createRandom();
    console.log('🔑 New Deployment Wallet Generated:');
    console.log(`📍 Address: ${wallet.address}`);
    console.log(`🔐 Private Key: ${wallet.privateKey}`);
    console.log(`🎯 Mnemonic: ${wallet.mnemonic.phrase}\n`);
    
    console.log('⚠️  SECURITY WARNING:');
    console.log('1. Store your private key and mnemonic phrase securely');
    console.log('2. Never share your private key with anyone');
    console.log('3. Use a hardware wallet for mainnet deployments');
    console.log('4. Add your private key to .env file:\n');
    console.log(`PRIVATE_KEY=${wallet.privateKey}\n`);
  }

  console.log('💰 Next Steps:');
  console.log('1. Fund your wallet with ETH on the network you want to deploy to');
  console.log('2. For Arbitrum Mainnet: ~0.01 ETH minimum');
  console.log('3. For Arbitrum Sepolia: Get free testnet ETH from faucet');
  console.log('4. Run deployment script once funded\n');

  console.log('🌉 Network Faucets (Testnet):');
  console.log('• Arbitrum Sepolia: https://faucet.quicknode.com/arbitrum/sepolia');
  console.log('• Alternative: https://bridge.arbitrum.io/');
}

async function checkBalances(address) {
  const networks = [
    {
      name: 'Arbitrum Mainnet',
      rpc: 'https://arb1.arbitrum.io/rpc',
      chainId: 42161,
      explorer: 'https://arbiscan.io/address/'
    },
    {
      name: 'Arbitrum Sepolia',
      rpc: 'https://sepolia-rollup.arbitrum.io/rpc',
      chainId: 421614,
      explorer: 'https://sepolia.arbiscan.io/address/'
    }
  ];

  console.log('💰 Checking balances on Arbitrum networks:\n');

  for (const network of networks) {
    try {
      const provider = new ethers.JsonRpcProvider(network.rpc);
      const balance = await provider.getBalance(address);
      const balanceEth = ethers.formatEther(balance);
      
      console.log(`${network.name}:`);
      console.log(`  Balance: ${balanceEth} ETH`);
      console.log(`  Explorer: ${network.explorer}${address}`);
      console.log('');
    } catch (error) {
      console.log(`${network.name}: ❌ Unable to check balance`);
    }
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = main;