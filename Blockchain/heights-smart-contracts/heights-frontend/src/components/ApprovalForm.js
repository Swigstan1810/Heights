import React, { useState, useContext, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';
import { useHeightsToken } from '../hooks/useHeightsToken';
import { isValidAddress, formatTxLink } from '../utils/web3Utils';

function ApprovalForm() {
  const { isConnected, account, chainId } = useContext(Web3Context);
  const { approveSpending, getAllowance, loading, error, txHash } = useHeightsToken();
  
  const [spender, setSpender] = useState('');
  const [amount, setAmount] = useState('');
  const [currentAllowance, setCurrentAllowance] = useState('0');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCurrentAllowance, setShowCurrentAllowance] = useState(false);
  
  const handleCheckAllowance = async () => {
    if (!isValidAddress(spender)) {
      setFormError('Invalid spender address');
      return;
    }
    
    const allowance = await getAllowance(account, spender);
    if (allowance !== null) {
      setCurrentAllowance(allowance);
      setShowCurrentAllowance(true);
    }
  };
  
  const validateForm = () => {
    if (!spender) {
      setFormError('Spender address is required');
      return false;
    }
    
    if (!isValidAddress(spender)) {
      setFormError('Invalid spender address');
      return false;
    }
    
    if (!amount || parseFloat(amount) < 0) {
      setFormError('Amount must be greater than or equal to 0');
      return false;
    }
    
    setFormError('');
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    
    if (!validateForm()) return;
    
    const success = await approveSpending(spender, amount);
    
    if (success) {
      setSuccessMessage(`Successfully approved ${amount} HTK for ${spender}`);
      await handleCheckAllowance(); // Update allowance after approval
    }
  };
  
  if (!isConnected) {
    return (
      <div className="approval-container">
        <div className="card">
          <h2>Approve Token Spending</h2>
          <p>Please connect your wallet to approve token spending.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="approval-container">
      <div className="card">
        <h2>Approve Token Spending</h2>
        
        <div className="allowance-checker">
          <h3>Check Current Allowance</h3>
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter spender address (0x...)"
              value={spender}
              onChange={(e) => setSpender(e.target.value)}
              disabled={loading}
            />
            <button 
              type="button"
              onClick={handleCheckAllowance}
              disabled={loading || !spender}
            >
              Check
            </button>
          </div>
          
          {showCurrentAllowance && (
            <div className="allowance-display">
              <p>Current allowance for this spender: <strong>{currentAllowance} HTK</strong></p>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          <h3>Set Approval Amount</h3>
          <div className="form-group">
            <label htmlFor="amount">Amount to Approve</label>
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
          </div>
          
          {formError && <div className="error-message">{formError}</div>}
          {error && <div className="error-message">{error}</div>}
          
          <div className="approval-note">
            <p><strong>Note:</strong> Setting an approval allows the specified address to transfer tokens on your behalf, up to the approved amount.</p>
          </div>
          
          <button 
            type="submit" 
            className="approve-button"
            disabled={loading || !spender || amount === ''}
          >
            {loading ? 'Processing...' : 'Approve'}
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

export default ApprovalForm;