import { useState, useContext, useCallback } from 'react';
import { ethers } from 'ethers';
import { Web3Context } from '../context/Web3Context';
import { parseTokenAmount } from '../utils/web3Utils';

export const useHeightsToken = () => {
  const { contract, account, isConnected } = useContext(Web3Context);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  const getTokenDetails = useCallback(async () => {
    if (!contract) return null;

    try {
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals()
      ]);

      return { name, symbol, decimals: Number(decimals) };
    } catch (err) {
      console.error('Error fetching token details:', err);
      return null;
    }
  }, [contract]);

  const getBalance = useCallback(async (addressToCheck = account) => {
    if (!contract || !addressToCheck) return null;
    
    setLoading(true);
    setError('');
    
    try {
      const balance = await contract.balanceOf(addressToCheck);
      const formattedBalance = ethers.formatUnits(balance, 18);
      setLoading(false);
      return formattedBalance;
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch balance');
      setLoading(false);
      return null;
    }
  }, [contract, account]);

  const transferTokens = useCallback(async (recipient, amount) => {
    if (!contract || !isConnected) return false;
    
    setLoading(true);
    setError('');
    setTxHash('');
    
    try {
      const parsedAmount = parseTokenAmount(amount);
      if (!parsedAmount) {
        setError('Invalid amount');
        setLoading(false);
        return false;
      }
      
      const tx = await contract.transfer(recipient, parsedAmount);
      setTxHash(tx.hash);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Error transferring tokens:', err);
      setError(err.message || 'Transfer failed');
      setLoading(false);
      return false;
    }
  }, [contract, isConnected]);

  const approveSpending = useCallback(async (spender, amount) => {
    if (!contract || !isConnected) return false;
    
    setLoading(true);
    setError('');
    setTxHash('');
    
    try {
      const parsedAmount = parseTokenAmount(amount);
      if (!parsedAmount) {
        setError('Invalid amount');
        setLoading(false);
        return false;
      }
      
      const tx = await contract.approve(spender, parsedAmount);
      setTxHash(tx.hash);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Error approving tokens:', err);
      setError(err.message || 'Approval failed');
      setLoading(false);
      return false;
    }
  }, [contract, isConnected]);

  const getAllowance = useCallback(async (owner, spender) => {
    if (!contract) return null;
    
    setLoading(true);
    setError('');
    
    try {
      const allowance = await contract.allowance(owner, spender);
      const formattedAllowance = ethers.formatUnits(allowance, 18);
      setLoading(false);
      return formattedAllowance;
    } catch (err) {
      console.error('Error getting allowance:', err);
      setError('Failed to fetch allowance');
      setLoading(false);
      return null;
    }
  }, [contract]);

  return {
    getTokenDetails,
    getBalance,
    transferTokens,
    approveSpending,
    getAllowance,
    loading,
    error,
    txHash
  };
};