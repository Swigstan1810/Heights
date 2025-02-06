const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("🚀 Deploying contract with account:", deployer.address);

    const HeightsToken = await hre.ethers.getContractFactory("HeightsToken");
    const contract = await HeightsToken.deploy(1000000); // Initial supply: 1,000,000 HTK

    await contract.waitForDeployment(); // ✅ FIXED: Use waitForDeployment() instead of deployed()

    console.log("✅ Contract deployed at:", contract.target); // ✅ FIXED: Use contract.target instead of contract.address
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
