const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Heights Token Deployment Script
 * Deploys the HGT token to Arbitrum networks with proper configuration
 */

async function main() {
  console.log("🚀 Starting Heights Token (HGT) deployment...\n");

  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Minimum balance check
  const minBalance = ethers.parseEther("0.01"); // 0.01 ETH minimum
  if (balance < minBalance) {
    throw new Error(`❌ Insufficient balance. Need at least ${ethers.formatEther(minBalance)} ETH`);
  }

  // Configuration based on network
  let feeRecipient;
  let networkName;
  
  switch (network.chainId) {
    case 42161n: // Arbitrum Mainnet
      networkName = "arbitrum-mainnet";
      feeRecipient = process.env.FEE_RECIPIENT_MAINNET || deployer.address;
      break;
    case 421614n: // Arbitrum Sepolia (Testnet)
      networkName = "arbitrum-sepolia";
      feeRecipient = process.env.FEE_RECIPIENT_TESTNET || deployer.address;
      break;
    case 421613n: // Arbitrum Goerli (Legacy Testnet)
      networkName = "arbitrum-goerli";
      feeRecipient = process.env.FEE_RECIPIENT_TESTNET || deployer.address;
      break;
    default:
      networkName = "local";
      feeRecipient = deployer.address;
      console.log("⚠️  Unknown network, using local configuration");
  }

  console.log(`🎯 Fee Recipient: ${feeRecipient}`);
  console.log(`🌐 Network Config: ${networkName}\n`);

  // Deploy Heights Token
  console.log("📦 Deploying Heights Token contract...");
  
  const HeightsToken = await ethers.getContractFactory("HeightsToken");
  
  // Estimate deployment gas
  const deploymentData = HeightsToken.interface.encodeDeploy([feeRecipient]);
  const estimatedGas = await ethers.provider.estimateGas({
    data: HeightsToken.bytecode + deploymentData.slice(2)
  });
  
  console.log(`⛽ Estimated gas: ${estimatedGas.toString()}`);
  
  // Deploy with gas settings
  const heightsToken = await HeightsToken.deploy(feeRecipient, {
    gasLimit: estimatedGas * 120n / 100n // 20% buffer
  });

  console.log("⏳ Waiting for deployment transaction...");
  await heightsToken.waitForDeployment();

  const contractAddress = await heightsToken.getAddress();
  console.log(`✅ Heights Token deployed to: ${contractAddress}\n`);

  // Get token information
  console.log("📊 Retrieving token information...");
  const tokenInfo = await heightsToken.getTokenInfo();
  
  console.log("🔍 Token Details:");
  console.log(`   Name: ${await heightsToken.name()}`);
  console.log(`   Symbol: ${await heightsToken.symbol()}`);
  console.log(`   Decimals: ${await heightsToken.decimals()}`);
  console.log(`   Total Supply: ${ethers.formatEther(tokenInfo._totalSupply)} HGT`);
  console.log(`   Max Supply: ${ethers.formatEther(tokenInfo._maxSupply)} HGT`);
  console.log(`   Max Wallet: ${ethers.formatEther(tokenInfo._maxWalletAmount)} HGT`);
  console.log(`   Max Transaction: ${ethers.formatEther(tokenInfo._maxTransactionAmount)} HGT`);
  console.log(`   Fee Recipient: ${tokenInfo._feeRecipient}`);
  console.log(`   Trading Enabled: ${tokenInfo._tradingEnabled}`);
  console.log(`   Arbitrum Optimized: ${tokenInfo._isArbitrumOptimized}`);
  console.log(`   Chain ID: ${tokenInfo._chainId}\n`);

  // Save deployment information
  const deploymentInfo = {
    network: networkName,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    feeRecipient: feeRecipient,
    deploymentBlock: await ethers.provider.getBlockNumber(),
    deploymentTimestamp: Math.floor(Date.now() / 1000),
    transactionHash: heightsToken.deploymentTransaction()?.hash,
    gasUsed: estimatedGas.toString(),
    tokenInfo: {
      name: await heightsToken.name(),
      symbol: await heightsToken.symbol(),
      decimals: (await heightsToken.decimals()).toString(),
      totalSupply: tokenInfo._totalSupply.toString(),
      maxSupply: tokenInfo._maxSupply.toString(),
      maxWalletAmount: tokenInfo._maxWalletAmount.toString(),
      maxTransactionAmount: tokenInfo._maxTransactionAmount.toString(),
      buyFee: tokenInfo._buyFee.toString(),
      sellFee: tokenInfo._sellFee.toString(),
      transferFee: tokenInfo._transferFee.toString(),
      isArbitrumOptimized: tokenInfo._isArbitrumOptimized,
      chainId: tokenInfo._chainId.toString()
    }
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `heights-token-${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${deploymentFile}`);

  // Generate ABI file
  const abiFile = path.join(deploymentsDir, "HeightsToken-ABI.json");
  fs.writeFileSync(abiFile, JSON.stringify(HeightsToken.interface.fragments, null, 2));
  console.log(`📋 ABI saved to: ${abiFile}`);

  // Update environment file template
  console.log("\n📝 Environment Variables:");
  console.log(`NEXT_PUBLIC_HGT_ADDRESS_${networkName.toUpperCase().replace(/-/g, '_')}=${contractAddress}`);
  
  if (networkName === "arbitrum-mainnet") {
    console.log(`NEXT_PUBLIC_HGT_ADDRESS=${contractAddress}`);
  }

  // Contract verification instructions
  console.log("\n🔍 Contract Verification:");
  console.log("Run the following command to verify the contract:");
  console.log(`npx hardhat verify --network ${networkName} ${contractAddress} "${feeRecipient}"`);

  // Post-deployment setup instructions
  // Set up DEX routers for Arbitrum
  if (network.chainId === 42161n || network.chainId === 421614n) {
    console.log("\n🔄 Setting up DEX router integration...");
    const uniswapV3Router = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
    
    try {
      await heightsToken.setDEXRouterStatus(uniswapV3Router, true);
      console.log(`✅ Uniswap V3 Router configured: ${uniswapV3Router}`);
    } catch (error) {
      console.log(`⚠️  DEX router setup will be done manually: ${error.message}`);
    }
  }

  console.log("\n⚙️  Post-Deployment Setup:");
  console.log("1. Enable trading when ready:");
  console.log(`   await heightsToken.enableTrading()`);
  console.log("\n2. Set exchange addresses:");
  console.log(`   await heightsToken.setExchangeStatus(exchangeAddress, true)`);
  console.log("\n3. Set DEX router addresses (for swaps):");
  console.log(`   await heightsToken.setDEXRouterStatus(routerAddress, true)`);
  console.log("\n4. Configure fee exemptions:");
  console.log(`   await heightsToken.setFeeExemption(address, true)`);
  console.log("\n5. Update fee recipient if needed:");
  console.log(`   await heightsToken.updateFeeRecipient(newRecipient)`);

  // Security recommendations
  console.log("\n🔒 Security Recommendations:");
  console.log("1. Run contract audit using Slither:");
  console.log(`   slither contracts/HeightsToken.sol`);
  console.log("\n2. Test all functions on testnet before mainnet");
  console.log("3. Consider using a multisig wallet for admin functions");
  console.log("4. Monitor for unusual trading patterns");
  console.log("5. Keep private keys secure and use hardware wallets");

  console.log("\n🎉 Heights Token deployment completed successfully!");
  
  return {
    contract: heightsToken,
    address: contractAddress,
    deploymentInfo: deploymentInfo
  };
}

// Handle deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;