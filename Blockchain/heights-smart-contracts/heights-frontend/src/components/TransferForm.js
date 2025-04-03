import React, { useState, useContext, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';
import { useHeightsToken } from '../hooks/useHeightsToken';
import { isValidAddress, formatTxLink } from '../utils/web3Utils';

function TransferForm() {
  const { isConnected, account, chainId } = useContext(Web3Context);
  const { transferTokens, getBalance, loading, error, txHash } = useHeightsToken();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [currentBalance, setCurrentBalance] = useState('0');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    if (isConnected) {
      fetchBalance();
    }
  }, [isConnected, account]);
  
  const fetchBalance = async () => {
    const balance = await getBalance();
    if (balance) {
      setCurrentBalance(balance);
    }
  };
  
  const validateForm = () => {
    if (!recipient) {
      setFormError('Recipient address is required');
      return false;
    }
    
    if (!isValidAddress(recipient)) {
      setFormError('Invalid recipient address');
      return false;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setFormError('Amount must be greater than 0');
      return false;
    }
    
    if (parseFloat(amount) > parseFloat(currentBalance)) {
      setFormError('Insufficient balance');
      return false;
    }
    
    setFormError('');
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    
    if (!validateForm()) return;
    
    const success = await transferTokens(recipient, amount);
    
    if (success) {
      setSuccessMessage(`Successfully transferred ${amount} HTK to ${recipient}`);
      setRecipient('');
      setAmount('');
      fetchBalance(); // Update balance after successful transfer
    }
  };
  
  if (!isConnected) {
    return (
      <div className="transfer-container">
        <div className="card">
          <h2>Transfer Tokens</h2>
          <p>Please connect your wallet to transfer tokens.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="transfer-container">
      <div className="card">
        <h2>Transfer Tokens</h2>
        
        <div className="balance-display">
          <p>Your Balance: <strong>{currentBalance} HTK</strong></p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="recipient">Recipient Address</label>
            <input
              id="recipient"
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <div className="amount-input">
              <input
                id="amount"
                type="number"
                placeholder="0.0"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
              <span className="token-symbol">HTK</span>
            </div>
            <button 
              type="button" 
              className="max-button"
              onClick={() => setAmount(currentBalance)}
            >
              MAX
            </button>
          </div>
          
          {formError && <div className="error-message">{formError}</div>}
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="transfer-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Transfer'}
          </button>
        </form>
        
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
        
        {txHash && (
          <div className="transaction-hash">
            Transaction: <a 
              href={formatTxLink(txHash, chainId)} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              View on Explorer
            </a>
          </div>
        )}
      </div>
      </div>
    
  );
}

export default TransferForm;