# Heights Platform Complete Setup Guide

This comprehensive guide will help you obtain all necessary API keys and configure your Heights trading platform for production deployment. Heights is a unified wealth management platform supporting crypto, stocks, and mutual funds with AI-powered insights.

## 🚀 **Platform Overview**

Heights integrates:
- **DEX Trading** - On-chain swaps via Uniswap V3 on Arbitrum
- **Heights Token (HGT)** - Platform token with governance & fee benefits
- **Non-custodial Wallet** - Heights Wallet with 2FA protection
- **AI Assistant** - Claude-powered trading insights
- **Portfolio Management** - Real-time tracking across all asset classes

---

## 🔑 **Required API Keys & Configuration**

### 1. **Supabase Database** ✅ CONFIGURED
**Purpose:** User authentication, portfolio data, trading history

**Current Configuration:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://jeuyvgzqjrpfenmuibkw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Status:** ✅ Already configured and working

---

### 2. **WalletConnect Integration** ✅ CONFIGURED
**Purpose:** Web3 wallet connections (MetaMask, WalletConnect, etc.)

**Current Configuration:**
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=519ea2d60c331a9fbff2363067144d01
```

**Status:** ✅ Already configured
**Test:** Wallet connection should work on the frontend

---

### 3. **Anthropic Claude AI** ✅ CONFIGURED
**Purpose:** AI-powered trading insights and market analysis

**Current Configuration:**
```bash
ANTHROPIC_API_KEY=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
CLAUDE_MODEL=claude-3-opus-20240229
CLAUDE_MAX_TOKENS=1000
CLAUDE_TEMPERATURE=0.7
```

**Status:** ✅ Already configured
**Test:** AI assistant should provide market insights

---

### 4. **Market Data APIs** ✅ CONFIGURED
**Purpose:** Real-time crypto and stock market data

**Current Configuration:**
```bash
# Alpha Vantage - Stock market data
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=QITAQY0H99RY946W
ALPHA_VANTAGE_API_KEY=QITAQY0H99RY946W

# Polygon.io - Stock market data
NEXT_PUBLIC_POLYGON_API_KEY=94ee275f-2ac4-4c0e-adff-b2de8d38adda

# Twelve Data - Additional market data
TWELVE_DATA_API_KEY=67c153afa28a45f48a3ceeec230510e0

# Benzinga - News and market data
BENZINGA_API_KEY=bz.V5Y63XNBP2CVSF5UTSZZKHU6HMSK5HTF
```

**Status:** ✅ All configured and active

---

### 5. **Coinbase Advanced Trade API** ✅ CONFIGURED
**Purpose:** Crypto market data and price feeds

**Current Configuration:**
```bash
COINBASE_API_KEY=DlNQtluJ9SBCKJDK6obV77FJNgbxSDkF
COINBASE_API_SECRET=J3jyX8nrmdxG1zWS33wcmito3e61qbB6UWp32q++jG5fAyeOlDILUCHagV3TbqBTzcWvfDwuuGCruSqR01oyFw==
```

**Status:** ✅ Already configured
**Used for:** Real-time crypto price feeds (no trading, just data)

---

### 6. **News APIs** ✅ CONFIGURED
**Purpose:** Financial news integration for AI insights

**Current Configuration:**
```bash
NEWS_API_KEY=83da5a6934e646438b05f96fb4322255
GNEWS_API_KEY=ec9d8e9c27b833f6cacb62495aac1d52
```

**Status:** ✅ Already configured

---

### 7. **Perplexity AI** ✅ CONFIGURED
**Purpose:** Enhanced AI market research

**Current Configuration:**
```bash
PERPLEXITY_API_KEY=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
```

**Status:** ✅ Already configured

---

### 8. **Google Gemini AI** ✅ CONFIGURED
**Purpose:** Additional AI analysis capabilities

**Current Configuration:**
```bash
GEMINI_API_KEY=AIzaSyCkTGiBl7r-U7UzMyHf9J7wm277PvwqUFE
```

**Status:** ✅ Already configured

---

## ⚠️ **APIs That Need Configuration**

### 1. **Stripe Payment Processing** ❌ NEEDS SETUP
**Purpose:** Fiat onramp, card payments for crypto purchases

**Steps to Configure:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create account or login
3. Get your API keys from Dashboard > Developers > API keys
4. For testing, use Test keys first
5. Set up webhook endpoint for `https://heightss.com/api/stripe/webhook`

**Required Environment Variables:**
```bash
STRIPE_SECRET_KEY=sk_test_51...  # Your test secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...  # Your test publishable key
STRIPE_WEBHOOK_SECRET=whsec_...  # Your webhook secret
```

**Current Status:** ❌ Placeholder values need replacement

---

### 2. **Heights Token Contract Deployment** ❌ NEEDS DEPLOYMENT
**Purpose:** Platform token for governance and fee benefits

**Steps to Deploy:**
1. Ensure you have ETH on Arbitrum for deployment gas
2. Set up deployment wallet private key (KEEP SECURE!)
3. Deploy to Arbitrum Sepolia testnet first
4. Deploy to Arbitrum mainnet for production

**Required Environment Variables:**
```bash
# Contract addresses (after deployment)
NEXT_PUBLIC_HGT_ADDRESS_ARBITRUM=0x...  # Arbitrum mainnet contract
NEXT_PUBLIC_HGT_ADDRESS_ARBITRUM_GOERLI=0x...  # Arbitrum testnet contract

# Deployment configuration
PRIVATE_KEY=0x...  # KEEP THIS EXTREMELY SECURE!
NEXT_PUBLIC_ADMIN_WALLET=0x...  # Public admin address
```

**Deployment Commands:**
```bash
# Install Hardhat dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Compile contracts
npx hardhat compile

# Deploy to testnet
npx hardhat run scripts/deploy.js --network arbitrumSepolia

# Verify contract
npx hardhat verify --network arbitrumSepolia CONTRACT_ADDRESS
```

**Current Status:** ❌ Placeholder values need deployment

---

### 3. **Fee Recipient Addresses** ❌ NEEDS SETUP
**Purpose:** Addresses to receive trading fees

**Required Configuration:**
```bash
FEE_RECIPIENT_MAINNET=0x...  # Your mainnet fee collection address
FEE_RECIPIENT_TESTNET=0x...  # Your testnet fee collection address
```

**Steps:**
1. Create dedicated wallets for fee collection
2. Use different addresses for mainnet vs testnet
3. Ensure these wallets are secure and backed up

**Current Status:** ❌ Placeholder values need replacement

---

## 🔧 **Blockchain Configuration**

### Arbitrum Network Setup ✅ CONFIGURED
**Purpose:** L2 scaling for low-cost transactions

**Current Configuration:**
```bash
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_ETHERSCAN_API_KEY=2S7VSNI8YC6EVTHB1F3YK1K373PY3GSDBT
ARBISCAN_API_KEY=2S7VSNI8YC6EVTHB1F3YK1K373PY3GSDBT
```

**Status:** ✅ Ready for use

---

## 🏗️ **Complete Environment Template**

Create a `.env.local` file with these values:

```bash
# ================================
# PRODUCTION CONFIGURATION
# ================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://heightss.com
NEXT_PUBLIC_BASE_URL=https://heightss.com

# ================================
# DATABASE & AUTHENTICATION
# ================================
NEXT_PUBLIC_SUPABASE_URL=https://jeuyvgzqjrpfenmuibkw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldXl2Z3pxanJwZmVubXVpYmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0MDk3OTEsImV4cCI6MjA2MTk4NTc5MX0.t0sEzEOKoSuZ10SZhBzvLMCuYMkAuyXSVLEm771tavc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldXl2Z3pxanJwZmVubXVpYmt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjQwOTc5MSwiZXhwIjoyMDYxOTg1NzkxfQ.uPTqd7Odd5ynhABHd_MBPxcdXdLMxwl0OpVST1TL4SE

# NextAuth Configuration
NEXTAUTH_SECRET=GxiqwCCTyVj5N4HV0WRbcXmPSeNNB5TWPkzgtRbhcoY=
NEXTAUTH_URL=https://heightss.com

# ================================
# AI SERVICES
# ================================
ANTHROPIC_API_KEY=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
CLAUDE_MODEL=claude-3-opus-20240229
CLAUDE_MAX_TOKENS=1000
CLAUDE_TEMPERATURE=0.7

PERPLEXITY_API_KEY=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
GEMINI_API_KEY=AIzaSyCkTGiBl7r-U7UzMyHf9J7wm277PvwqUFE

# ================================
# MARKET DATA APIS
# ================================
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=QITAQY0H99RY946W
ALPHA_VANTAGE_API_KEY=QITAQY0H99RY946W
NEXT_PUBLIC_POLYGON_API_KEY=94ee275f-2ac4-4c0e-adff-b2de8d38adda
TWELVE_DATA_API_KEY=67c153afa28a45f48a3ceeec230510e0
BENZINGA_API_KEY=bz.V5Y63XNBP2CVSF5UTSZZKHU6HMSK5HTF

# Coinbase API (for price data)
COINBASE_API_KEY=DlNQtluJ9SBCKJDK6obV77FJNgbxSDkF
COINBASE_API_SECRET=J3jyX8nrmdxG1zWS33wcmito3e61qbB6UWp32q++jG5fAyeOlDILUCHagV3TbqBTzcWvfDwuuGCruSqR01oyFw==

# News APIs
NEWS_API_KEY=83da5a6934e646438b05f96fb4322255
GNEWS_API_KEY=ec9d8e9c27b833f6cacb62495aac1d52

# ================================
# BLOCKCHAIN & WEB3
# ================================
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=519ea2d60c331a9fbff2363067144d01

# Arbitrum Network
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_ETHERSCAN_API_KEY=2S7VSNI8YC6EVTHB1F3YK1K373PY3GSDBT
ARBISCAN_API_KEY=2S7VSNI8YC6EVTHB1F3YK1K373PY3GSDBT

# ================================
# HEIGHTS TOKEN CONTRACTS
# ================================
# ❌ TODO: Deploy contracts and update these addresses
NEXT_PUBLIC_HGT_ADDRESS=your_default_hgt_contract_address
NEXT_PUBLIC_HGT_ADDRESS_ARBITRUM=your_arbitrum_mainnet_contract_address
NEXT_PUBLIC_HGT_ADDRESS_ARBITRUM_GOERLI=your_arbitrum_testnet_contract_address

# ================================
# ADMIN & FEE CONFIGURATION
# ================================
# ❌ TODO: Set your admin wallet addresses
NEXT_PUBLIC_ADMIN_WALLET=admin_wallet_address
FEE_RECIPIENT_MAINNET=your_mainnet_fee_recipient_address
FEE_RECIPIENT_TESTNET=your_testnet_fee_recipient_address

# ❌ TODO: KEEP THIS EXTREMELY SECURE!
PRIVATE_KEY=your_deployment_wallet_private_key

# ================================
# PAYMENT PROCESSING
# ================================
# ❌ TODO: Configure Stripe for fiat onramp
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

---

## 🧪 **Testing & Deployment Checklist**

### Phase 1: Basic Setup ✅
- [x] Supabase database configured
- [x] AI services working (Claude, Perplexity, Gemini)
- [x] Market data APIs functional
- [x] WalletConnect integration active

### Phase 2: Contract Deployment ❌
- [ ] Deploy Heights Token to Arbitrum Sepolia testnet
- [ ] Verify contract on Arbiscan
- [ ] Test token functions (mint, transfer, burn)
- [ ] Deploy to Arbitrum mainnet
- [ ] Update contract addresses in environment

### Phase 3: Payment Integration ❌
- [ ] Configure Stripe test environment
- [ ] Set up webhook endpoints
- [ ] Test fiat onramp flow
- [ ] Configure production Stripe

### Phase 4: Production Testing ❌
- [ ] Test DEX trading with real wallets
- [ ] Verify Heights Token integration
- [ ] Test portfolio tracking
- [ ] Validate fee collection

---

## 🚀 **Deployment Commands**

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env .env.local
# Edit .env.local with your configurations

# 3. Build application
npm run build

# 4. Deploy contracts (if needed)
npx hardhat run scripts/deploy.js --network arbitrumSepolia

# 5. Start production server
npm start
```

---

## 💰 **Cost Estimation**

### API Costs (Monthly)
- **Supabase**: Free tier (up to 50,000 monthly active users)
- **Claude AI**: ~$20-50/month depending on usage
- **Market Data APIs**: Free tiers available, ~$50-100/month for premium
- **Stripe**: 2.9% + 30¢ per transaction

### Blockchain Costs
- **Heights Token Deployment**: ~$10-50 in ETH (one-time)
- **Transaction Fees**: ~$0.01-0.10 per transaction on Arbitrum
- **Total Setup Cost**: < $100 AUD as requested

---

## 🔒 **Security Best Practices**

1. **Private Key Management**
   - Never commit private keys to git
   - Use hardware wallets for mainnet deployments
   - Store keys in secure environment variables

2. **API Key Security**
   - Rotate keys regularly
   - Set up IP restrictions where possible
   - Monitor API usage for anomalies

3. **Smart Contract Security**
   - Audit contracts before mainnet deployment
   - Use multisig wallets for admin functions
   - Test thoroughly on testnets

---

## 📞 **Support & Next Steps**

### Immediate Actions Required:
1. **Deploy Heights Token contracts** to get contract addresses
2. **Configure Stripe** for fiat onramp functionality  
3. **Set up admin wallets** for fee collection

### Testing Workflow:
1. Test on Arbitrum Sepolia testnet first
2. Verify all integrations work correctly
3. Deploy to mainnet only after thorough testing

### Contact:
- Technical issues: Check browser console for errors
- Contract deployment: Ensure wallet has sufficient ETH
- API integration: Verify all keys are correctly configured

---

**🎉 Your Heights platform is 80% configured and ready for final deployment steps!**