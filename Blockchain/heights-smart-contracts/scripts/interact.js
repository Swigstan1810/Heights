const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Replace with your deployed contract address

    const HeightsToken = await hre.ethers.getContractAt("HeightsToken", contractAddress);

    console.log("📊 Checking balance of deployer:", deployer.address);
    let balance = await HeightsToken.balanceOf(deployer.address);
    console.log("💰 Balance:", balance.toString());

    console.log("🔄 Transferring 100 tokens to another address...");
    const tx = await HeightsToken.transfer("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 100);
    await tx.wait();

    console.log("✅ Transfer successful! Checking new balance...");
    balance = await HeightsToken.balanceOf(deployer.address);
    console.log("💰 Updated Balance:", balance.toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });

    