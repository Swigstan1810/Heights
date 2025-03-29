import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// ABI for HeightsToken - Replace with your actual ABI after compiling the contract
const heightsTokenABI = [
  // Read-only functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  
  // Write functions
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint amount) returns (bool)",
  "function transferFrom(address from, address to, uint amount) returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint amount)",
  "event Approval(address indexed owner, address indexed spender, uint amount)"
];

// Replace with your deployed contract address
const contractAddress = "0x51cDdeBb33814F660415dF040Afd6d6124670682";

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [tokenInfo, setTokenInfo] = useState({
    name: "",
    symbol: "",
    totalSupply: "",
    decimals: 0
  });
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const init = async () => {
      // Reset error and success messages when reconnecting
      setErrorMessage("");
      setSuccessMessage("");
      
      if (window.ethereum) {
        try {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          // Create provider and signer
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          
          // Create contract instance
          const tokenContract = new ethers.Contract(contractAddress, heightsTokenABI, signer);
          
          setProvider(provider);
          setSigner(signer);
          setContract(tokenContract);
          setAccount(accounts[0]);
          
          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0]);
          });
          
          // Load token info and balance
          await loadTokenInfo(tokenContract);
          await loadBalance(tokenContract, accounts[0]);
        } catch (error) {
          console.error("Error connecting to MetaMask", error);
          setErrorMessage("Error connecting to MetaMask. Please make sure it's installed and unlocked.");
        }
      } else {
        setErrorMessage("MetaMask is not installed. Please install it to use this dApp.");
      }
    };
    
    init();
    
    // Cleanup function
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  const loadTokenInfo = async (tokenContract) => {
    try {
      const name = await tokenContract.name();
      const symbol = await tokenContract.symbol();
      const totalSupply = await tokenContract.totalSupply();
      const decimals = await tokenContract.decimals();
      
      setTokenInfo({
        name,
        symbol,
        totalSupply: ethers.utils.formatUnits(totalSupply, decimals),
        decimals
      });
    } catch (error) {
      console.error("Error loading token info", error);
      setErrorMessage("Error loading token information.");
    }
  };

  const loadBalance = async (tokenContract, account) => {
    if (tokenContract && account) {
      try {
        const decimals = await tokenContract.decimals();
        const balance = await tokenContract.balanceOf(account);
        setBalance(ethers.utils.formatUnits(balance, decimals));
      } catch (error) {
        console.error("Error loading balance", error);
        setErrorMessage("Error loading your token balance.");
      }
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      if (!contract || !transferTo || !transferAmount) {
        throw new Error("Missing required information");
      }
      
      // Validate the address
      if (!ethers.utils.isAddress(transferTo)) {
        throw new Error("Invalid recipient address");
      }

      // Format the amount with decimals
      const formattedAmount = ethers.utils.parseUnits(transferAmount, tokenInfo.decimals);
      
      // Send the transaction
      const tx = await contract.transfer(transferTo, formattedAmount);
      
      // Display pending status
      setSuccessMessage("Transaction submitted! Waiting for confirmation...");
      
      // Wait for the transaction to be mined
      await tx.wait();
      
      // Update success message
      setSuccessMessage(`Successfully transferred ${transferAmount} ${tokenInfo.symbol} to ${transferTo}`);
      
      // Reset form fields
      setTransferTo("");
      setTransferAmount("");
      
      // Reload balance
      await loadBalance(contract, account);
    } catch (error) {
      console.error("Transfer error", error);
      setErrorMessage(error.message || "An error occurred during the transfer.");
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        
        // Reload page to reinitialize everything
        window.location.reload();
      } catch (error) {
        console.error("User denied account access", error);
        setErrorMessage("You need to allow MetaMask access to use this dApp.");
      }
    } else {
      setErrorMessage("MetaMask is not installed. Please install it to use this dApp.");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Heights Token (HTK) Dashboard</h1>
        {account ? (
          <div className="account-info">
            Connected: <span className="address">{account}</span>
          </div>
        ) : (
          <button className="connect-button" onClick={connectWallet}>Connect Wallet</button>
        )}
      </header>
      
      <main>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        <section className="token-info">
          <h2>Token Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span>Name:</span> 
              <span>{tokenInfo.name || "Loading..."}</span>
            </div>
            <div className="info-item">
              <span>Symbol:</span> 
              <span>{tokenInfo.symbol || "Loading..."}</span>
            </div>
            <div className="info-item">
              <span>Total Supply:</span> 
              <span>{tokenInfo.totalSupply || "Loading..."} {tokenInfo.symbol}</span>
            </div>
            <div className="info-item">
              <span>Decimals:</span> 
              <span>{tokenInfo.decimals || "Loading..."}</span>
            </div>
          </div>
        </section>
        
        <section className="balance-section">
          <h2>Your Balance</h2>
          <div className="balance">
            {balance !== null ? (
              <span>{balance} {tokenInfo.symbol}</span>
            ) : (
              <span>Connect your wallet to see balance</span>
            )}
          </div>
        </section>
        
        <section className="transfer-section">
          <h2>Transfer Tokens</h2>
          <form onSubmit={handleTransfer}>
            <div className="form-group">
              <label htmlFor="recipient">Recipient Address:</label>
              <input
                type="text"
                id="recipient"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                placeholder="0x..."
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="amount">Amount ({tokenInfo.symbol}):</label>
              <input
                type="text"
                id="amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0.0"
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading || !account}
              className="transfer-button"
            >
              {isLoading ? "Processing..." : "Transfer"}
            </button>
          </form>
        </section>
      </main>
      
      <footer>
        <p>Heights Token Contract: <a 
          href={`https://sepolia.etherscan.io/address/${contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {contractAddress}
        </a></p>
      </footer>
    </div>
  );
}

export default App;