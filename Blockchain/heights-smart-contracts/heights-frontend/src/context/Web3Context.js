import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, SUPPORTED_CHAINS } from '../utils/Constants';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  useEffect(() => {
    checkIfWalletIsConnected();
    
    if (window.ethereum) {
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          disconnectWallet();
        }
      });
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainIdHex) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        setupProviderAndContract(newChainId);
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) {
        setConnectionError('Please install MetaMask or another Ethereum wallet');
        return;
      }
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        
        // Get the current chain ID
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainIdHex, 16);
        setChainId(currentChainId);
        
        await setupProviderAndContract(currentChainId);
        setIsConnected(true);
      }
    } catch (error) {
      console.error("Error checking if wallet is connected:", error);
      setConnectionError('Error connecting to wallet');
    }
  };

  const setupProviderAndContract = async (currentChainId) => {
    try {
      // Reset the connection error
      setConnectionError('');
      
      // Check if the chain is supported
      if (!SUPPORTED_CHAINS.includes(currentChainId)) {
        setConnectionError(`Network not supported. Please switch to Sepolia testnet.`);
        setIsConnected(false);
        return;
      }
      
      // Setup provider and contract
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethProvider);
      
      const signer = await ethProvider.getSigner();
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(tokenContract);
      
      setIsConnected(true);
    } catch (error) {
      console.error("Error setting up provider and contract:", error);
      setConnectionError('Error connecting to blockchain');
      setIsConnected(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setConnectionError('Please install MetaMask or another Ethereum wallet');
        return;
      }
      
      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      
      // Get the current chain ID
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainIdHex, 16);
      setChainId(currentChainId);
      
      await setupProviderAndContract(currentChainId);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setConnectionError('Error connecting to wallet');
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setChainId(null);
    setProvider(null);
    setContract(null);
    setIsConnected(false);
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        provider,
        contract,
        isConnected,
        connectionError,
        connectWallet,
        disconnectWallet
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};