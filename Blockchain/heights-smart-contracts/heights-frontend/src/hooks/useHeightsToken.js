import { useState, useContext, useCallback } from 'react';
import { ethers } from 'ethers';
import { Web3Context } from '../context/Web3Context';
import { parseTokenAmount, formatTokenAmount } from '../utils/web3Utils';

export function useHeightsToken() {
  const { contract, account, isConnected } = useContext(Web3Context);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  // Get token balance
  const getBalance = useCallback(async (address = null) => {
    if (!contract || !isConnected) return null;
    
    setLoading(true);
    setError('');
    
    try {
      const targetAddress = address || account;
      const balance = await contract.balanceOf(targetAddress);
      setLoading(false);
      return formatTokenAmount(balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch balance');
      setLoading(false);
      return null;
    }
  }, [contract, account, isConnected]);

  // Transfer tokens
  const transferTokens = useCallback(async (to, amount) => {
    if (!contract || !isConnected) return false;
    
    setLoading(true);
    setError('');
    setTxHash('');
    
    try {
      const parsedAmount = parseTokenAmount(amount);
      const tx = await contract.transfer(to, parsedAmount);
      setTxHash(tx.hash);
      await tx.wait();
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Error transferring tokens:', err);
      setError(err.message || 'Failed to transfer tokens');
      setLoading(false);
      return false;
    }
  }, [contract, isConnected]);

  // Approve spending
  const approveSpending = useCallback(async (spender, amount) => {
    if (!contract || !isConnected) return false;
    
    setLoading(true);
    setError('');
    setTxHash('');
    
    try {
      const parsedAmount = parseTokenAmount(amount);
      const tx = await contract.approve(spender, parsedAmount);
      setTxHash(tx.hash);
      await tx.wait();
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Error approving tokens:', err);
      setError(err.message || 'Failed to approve tokens');
      setLoading(false);
      return false;
    }
  }, [contract, isConnected]);

  // Get allowance
  const getAllowance = useCallback(async (owner, spender) => {
    if (!contract || !isConnected) return null;
    
    setLoading(true);
    setError('');
    
    try {
      const allowance = await contract.allowance(owner, spender);
      setLoading(false);
      return formatTokenAmount(allowance);
    } catch (err) {
      console.error('Error fetching allowance:', err);
      setError('Failed to fetch allowance');
      setLoading(false);
      return null;
    }
  }, [contract, isConnected]);

  // Get token details
  const getTokenDetails = useCallback(async () => {
    if (!contract) return null;
    
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ]);
      
      return {
        name,
        symbol,
        decimals,
        totalSupply: formatTokenAmount(totalSupply)
      };
    } catch (err) {
      console.error('Error fetching token details:', err);
      return null;
    }
  }, [contract]);

  return {
    loading,
    error,
    txHash,
    getBalance,
    transferTokens,
    approveSpending,
    getAllowance,
    getTokenDetails
  };
}