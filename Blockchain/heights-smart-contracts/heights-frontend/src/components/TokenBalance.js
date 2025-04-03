import React, { useContext, useState, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';
import { useHeightsToken } from '../hooks/useHeightsToken';

function TokenBalance() {
  const { account, isConnected } = useContext(Web3Context);
  const { getBalance, loading, error } = useHeightsToken();
  const [balance, setBalance] = useState('0');
  const [addressToCheck, setAddressToCheck] = useState('');
  const [viewingAddress, setViewingAddress] = useState('');

  useEffect(() => {
    if (isConnected) {
      fetchBalance();
    }
  }, [isConnected, account]);

  const fetchBalance = async () => {
    const result = await getBalance();
    if (result) {
      setBalance(result);
      setViewingAddress(account);
    }
  };

  const handleCheckBalance = async (e) => {
    e.preventDefault();
    if (addressToCheck) {
      const result = await getBalance(addressToCheck);
      if (result) {
        setBalance(result);
        setViewingAddress(addressToCheck);
      }
    }
  };

  const handleViewOwnBalance = async () => {
    setAddressToCheck('');
    fetchBalance();
  };

  if (!isConnected) {
    return (
      <div className="balance-container">
        <div className="card">
          <h2>Token Balance</h2>
          <p>Please connect your wallet to view your balance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="balance-container">
      <div className="card">
        <h2>Token Balance</h2>

        {/* Current Balance Display */}
        <div className="balance-display">
          <h3>
            {viewingAddress === account 
              ? 'Your Balance' 
              : `Balance for ${viewingAddress.substring(0, 6)}...${viewingAddress.substring(38)}`}
          </h3>
          <div className="balance-value">
            {loading ? (
              <span className="loading">Loading...</span>
            ) : (
              <span>{balance} HTK</span>
            )}
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Check Other Address Balance */}
        <div className="check-other-balance">
          <h3>Check Another Address</h3>
          <form onSubmit={handleCheckBalance}>
            <input
              type="text"
              placeholder="Enter address (0x...)"
              value={addressToCheck}
              onChange={(e) => setAddressToCheck(e.target.value)}
            />
            <div className="balance-actions">
              <button type="submit" disabled={loading || !addressToCheck}>
                Check Balance
              </button>
              {viewingAddress !== account && (
                <button 
                  type="button" 
                  onClick={handleViewOwnBalance}
                  disabled={loading}
                >
                  View My Balance
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TokenBalance;