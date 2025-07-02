#!/bin/bash

# Heights Platform Quick Start Script
# This script helps you set up your development environment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}🚀 Heights Platform Quick Start${NC}\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js is installed: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm is installed: $(npm --version)${NC}"

# Install dependencies
echo -e "\n${BLUE}📦 Installing dependencies...${NC}"
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo -e "\n${YELLOW}📝 Creating .env.local file...${NC}"
    cp .env.example .env.local 2>/dev/null || cat > .env.local << 'EOF'
# Heights Token Contract Addresses
NEXT_PUBLIC_HGT_ADDRESS=your_default_hgt_contract_address
NEXT_PUBLIC_HGT_ADDRESS_ARBITRUM=your_arbitrum_mainnet_contract_address
NEXT_PUBLIC_HGT_ADDRESS_ARBITRUM_GOERLI=your_arbitrum_testnet_contract_address

# Wallet Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Admin Configuration
NEXT_PUBLIC_ADMIN_WALLET=admin_wallet_address

# External API Keys
NEXT_PUBLIC_ETHERSCAN_API_KEY=2S7VSNI8YC6EVTHB1F3YK1K373PY3GSDBT
NEXT_PUBLIC_ARBISCAN_API_KEY=2S7VSNI8YC6EVTHB1F3YK1K373PY3GSDBT
EXCHANGE_API_KEY=your_exchange_api_key
EXCHANGE_API_SECRET=your_exchange_api_secret

# Coinbase API
COINBASE_API_KEY=your_coinbase_api_key
COINBASE_API_SECRET=your_coinbase_secret
COINBASE_PASSPHRASE=your_passphrase
COINBASE_SANDBOX=true

# Stripe Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Private key for deployment (KEEP THIS SECURE!)
PRIVATE_KEY=your_deployment_wallet_private_key

# Arbitrum RPC URLs
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# Fee recipient addresses
FEE_RECIPIENT_MAINNET=your_mainnet_fee_recipient_address
FEE_RECIPIENT_TESTNET=your_testnet_fee_recipient_address
EOF
    echo -e "${GREEN}✅ Created .env.local file${NC}"
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi

# Generate a test wallet
echo -e "\n${BLUE}🔐 Generating test wallet...${NC}"
node scripts/generate-wallet.js

# Test the build
echo -e "\n${BLUE}🔨 Testing build...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Build successful!${NC}"
else
    echo -e "\n${RED}❌ Build failed. Please check the errors above.${NC}"
    exit 1
fi

# Test API connections
echo -e "\n${BLUE}🧪 Testing API connections...${NC}"
node scripts/test-api-connections.js

echo -e "\n${BOLD}📚 Next Steps:${NC}"
echo -e "1. Update .env.local with your actual API keys (see SETUP_GUIDE.md)"
echo -e "2. Get API keys from:"
echo -e "   • WalletConnect: https://cloud.walletconnect.com"
echo -e "   • Stripe: https://dashboard.stripe.com"
echo -e "   • Coinbase: https://pro.coinbase.com (Settings > API)"
echo -e "3. Run: ${GREEN}npm run dev${NC} to start development server"
echo -e "4. Visit: ${BLUE}http://localhost:3000${NC}"

echo -e "\n${GREEN}🚀 Your Heights platform is ready for development!${NC}"