require("@nomicfoundation/hardhat-toolbox"); // Updated to use @nomicfoundation packages
require("@nomicfoundation/hardhat-ethers");  // Replace old @nomiclabs version
require("dotenv").config(); // Load environment variables

module.exports = {
  solidity: "0.8.28", // Specify Solidity version
  networks: {
    hardhat: {
      chainId: 1337, // Default Hardhat network ID
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [`0x${process.env.LOCAL_PRIVATE_KEY}`], // Ensure your .env has LOCAL_PRIVATE_KEY
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`], 
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`], 
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, // For contract verification
  },
};
