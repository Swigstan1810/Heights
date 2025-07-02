require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    // Arbitrum Mainnet
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 100000000, // 0.1 gwei
      verify: {
        etherscan: {
          apiUrl: "https://api.arbiscan.io/api",
          apiKey: process.env.ARBISCAN_API_KEY || "",
        }
      }
    },
    
    // Arbitrum Sepolia (Testnet)
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 100000000, // 0.1 gwei
      verify: {
        etherscan: {
          apiUrl: "https://api-sepolia.arbiscan.io/api",
          apiKey: process.env.ARBISCAN_API_KEY || "",
        }
      }
    },
    
    // Arbitrum Goerli (Legacy Testnet - for compatibility)
    arbitrumGoerli: {
      url: "https://goerli-rollup.arbitrum.io/rpc",
      chainId: 421613,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 100000000, // 0.1 gwei
      verify: {
        etherscan: {
          apiUrl: "https://api-goerli.arbiscan.io/api",
          apiKey: process.env.ARBISCAN_API_KEY || "",
        }
      }
    },
    
    // Local development
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    
    // Hardhat network
    hardhat: {
      chainId: 31337,
      forking: process.env.ARBITRUM_RPC_URL ? {
        url: process.env.ARBITRUM_RPC_URL,
        blockNumber: process.env.FORK_BLOCK_NUMBER ? parseInt(process.env.FORK_BLOCK_NUMBER) : undefined
      } : undefined
    }
  },
  
  // Etherscan verification
  etherscan: {
    apiKey: {
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
      arbitrumTestnet: process.env.ARBISCAN_API_KEY || "", // Arbitrum Goerli
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "" // Arbitrum Sepolia
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/"
        }
      }
    ]
  },
  
  // Source verification
  sourcify: {
    enabled: true
  },
  
  // Gas reporter
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 21,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  
  // Contract size limit
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true
  },
  
  // Paths
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  
  // Mocha configuration
  mocha: {
    timeout: 40000
  },
  
  // Deployment default network
  defaultNetwork: "hardhat"
};