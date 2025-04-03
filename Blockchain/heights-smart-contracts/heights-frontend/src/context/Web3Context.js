import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import HeightsTokenABI from '../abis/HeightsToken.json';
import { CONTRACT_ADDRESS } from '../utils/Constants';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        const signer = await provider.getSigner();
        setSigner(signer);
        
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          HeightsTokenABI.abi,
          signer
        );
        setContract(contract);
        
        setAccount(accounts[0]);
        setIsConnected(true);
        
        const { chainId } = await provider.getNetwork();
        setChainId(chainId);
        
        // Event listeners
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
        
        return true;
      } catch (error) {
        console.error('Error connecting to wallet:', error);
        setError('Failed to connect wallet. Please try again.');
        return false;
      }
    } else {
      setError('Ethereum wallet not detected. Please install MetaMask.');
      return false;
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setIsConnected(false);
    setProvider(null);
    setSigner(null);
    setContract(null);
    
    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = (chainIdHex) => {
    window.location.reload();
  };

  useEffect(() => {
    // Check if wallet was previously connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          
          if (accounts.length > 0) {
            connectWallet();
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };
    
    checkConnection();
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []); // Empty dependency array ensures it runs only once on mount

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        contract,
        account,
        isConnected,
        chainId,
        error,
        connectWallet,
        disconnectWallet
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};