#!/usr/bin/env node
/**
 * Heights API Connection Test Script
 * Run this script to test all your API integrations
 * Usage: node scripts/test-api-connections.js
 */

const https = require('https');
const crypto = require('crypto');

// Colors for console output
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

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

class APITester {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  async runAllTests() {
    log(`${colors.bold}🚀 Heights API Connection Tests${colors.reset}\n`);
    
    await this.testEnvironmentVariables();
    await this.testEtherscanAPI();
    await this.testWalletConnectConfig();
    await this.testCoinbaseAPI();
    await this.testStripeAPI();
    await this.testContractAddresses();
    
    this.printSummary();
  }

  async testEnvironmentVariables() {
    info('Testing Environment Variables...');
    
    const requiredVars = [
      'NEXT_PUBLIC_ETHERSCAN_API_KEY',
      'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ];

    const optionalVars = [
      'COINBASE_API_KEY',
      'BINANCE_API_KEY',
      'PRIVATE_KEY',
      'NEXT_PUBLIC_HGT_ADDRESS'
    ];

    for (const envVar of requiredVars) {
      if (process.env[envVar] && process.env[envVar] !== `your_${envVar.toLowerCase()}`) {
        success(`${envVar} is set`);
        this.results.passed++;
      } else {
        error(`${envVar} is missing or using placeholder value`);
        this.results.failed++;
      }
      this.results.total++;
    }

    for (const envVar of optionalVars) {
      if (process.env[envVar] && process.env[envVar] !== `your_${envVar.toLowerCase()}`) {
        success(`${envVar} is set`);
      } else {
        warning(`${envVar} is not configured (optional)`);
        this.results.warnings++;
      }
    }
    
    console.log();
  }

  async testEtherscanAPI() {
    info('Testing Etherscan API...');
    
    const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
    if (!apiKey || apiKey === 'your_etherscan_api_key') {
      error('Etherscan API key not configured');
      this.results.failed++;
      this.results.total++;
      return;
    }

    try {
      const response = await this.makeRequest(
        `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${apiKey}`
      );
      
      if (response.status === '1') {
        success('Etherscan API is working');
        this.results.passed++;
      } else {
        error(`Etherscan API error: ${response.message}`);
        this.results.failed++;
      }
    } catch (err) {
      error(`Etherscan API test failed: ${err.message}`);
      this.results.failed++;
    }
    
    this.results.total++;
    console.log();
  }

  async testWalletConnectConfig() {
    info('Testing WalletConnect Configuration...');
    
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    if (!projectId || projectId === 'your_walletconnect_project_id') {
      error('WalletConnect Project ID not configured');
      this.results.failed++;
      this.results.total++;
      return;
    }

    try {
      // Test WalletConnect project ID format
      if (projectId.length === 32 && /^[a-f0-9]+$/i.test(projectId)) {
        success('WalletConnect Project ID format is valid');
        this.results.passed++;
      } else {
        warning('WalletConnect Project ID format might be invalid');
        this.results.warnings++;
      }
    } catch (err) {
      error(`WalletConnect test failed: ${err.message}`);
      this.results.failed++;
    }
    
    this.results.total++;
    console.log();
  }

  async testCoinbaseAPI() {
    info('Testing Coinbase API...');
    
    const apiKey = process.env.COINBASE_API_KEY;
    const apiSecret = process.env.COINBASE_API_SECRET;
    const passphrase = process.env.COINBASE_PASSPHRASE;

    if (!apiKey || !apiSecret || !passphrase) {
      warning('Coinbase API credentials not configured (optional for testing)');
      this.results.warnings++;
      console.log();
      return;
    }

    try {
      // Test public endpoint first
      const publicResponse = await this.makeRequest(
        'https://api.exchange.coinbase.com/products/BTC-USD/ticker'
      );
      
      if (publicResponse.price) {
        success('Coinbase public API is accessible');
        this.results.passed++;
      } else {
        error('Coinbase public API test failed');
        this.results.failed++;
      }
    } catch (err) {
      error(`Coinbase API test failed: ${err.message}`);
      this.results.failed++;
    }
    
    this.results.total++;
    console.log();
  }

  async testStripeAPI() {
    info('Testing Stripe API...');
    
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!secretKey || !publishableKey) {
      error('Stripe API keys not configured');
      this.results.failed++;
      this.results.total++;
      return;
    }

    // Check key formats
    if (secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_')) {
      if (publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')) {
        success('Stripe API key formats are valid');
        
        // Test if both keys are from same environment
        const secretIsTest = secretKey.startsWith('sk_test_');
        const publishableIsTest = publishableKey.startsWith('pk_test_');
        
        if (secretIsTest === publishableIsTest) {
          success('Stripe keys are from the same environment');
          this.results.passed++;
        } else {
          error('Stripe keys are from different environments (test/live mismatch)');
          this.results.failed++;
        }
      } else {
        error('Stripe publishable key format is invalid');
        this.results.failed++;
      }
    } else {
      error('Stripe secret key format is invalid');
      this.results.failed++;
    }
    
    this.results.total++;
    console.log();
  }

  async testContractAddresses() {
    info('Testing Contract Addresses...');
    
    const addresses = [
      'NEXT_PUBLIC_HGT_ADDRESS',
      'NEXT_PUBLIC_HGT_ADDRESS_ARBITRUM',
      'NEXT_PUBLIC_ADMIN_WALLET',
      'FEE_RECIPIENT_MAINNET'
    ];

    let validAddresses = 0;
    let totalAddresses = 0;

    for (const addressVar of addresses) {
      const address = process.env[addressVar];
      totalAddresses++;
      
      if (!address || address.startsWith('your_') || address.startsWith('0x1234')) {
        warning(`${addressVar} not configured or using placeholder`);
        this.results.warnings++;
      } else if (this.isValidEthereumAddress(address)) {
        success(`${addressVar} is a valid Ethereum address`);
        validAddresses++;
      } else {
        error(`${addressVar} is not a valid Ethereum address`);
        this.results.failed++;
      }
    }
    
    this.results.passed += validAddresses;
    this.results.total += totalAddresses;
    console.log();
  }

  isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            resolve(data);
          }
        });
      });
      
      request.on('error', reject);
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  printSummary() {
    log(`${colors.bold}📊 Test Summary${colors.reset}`);
    log(`Total Tests: ${this.results.total}`);
    
    if (this.results.passed > 0) {
      success(`Passed: ${this.results.passed}`);
    }
    
    if (this.results.failed > 0) {
      error(`Failed: ${this.results.failed}`);
    }
    
    if (this.results.warnings > 0) {
      warning(`Warnings: ${this.results.warnings}`);
    }
    
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    
    if (this.results.failed === 0) {
      success(`\n🎉 All critical tests passed! Success rate: ${successRate}%`);
      info('Your Heights platform is ready for testing!');
    } else {
      error(`\n🔧 Some tests failed. Success rate: ${successRate}%`);
      info('Please fix the failed configurations before proceeding.');
    }
    
    console.log('\n📚 For setup instructions, see: SETUP_GUIDE.md');
  }
}

// Run tests
const tester = new APITester();
tester.runAllTests().catch(console.error);