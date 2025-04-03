import React, { useContext, useState, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';
import { NETWORK_NAMES } from '../utils/Constants';
import { shortenAddress } from '../utils/web3Utils';
import { useHeightsToken } from '../hooks/useHeightsToken';

function Header() {
  const { account, isConnected, connectWallet, disconnectWallet, chainId } = useContext(Web3Context);
  const { getTokenDetails } = useHeightsToken();
  const [tokenInfo, setTokenInfo] = useState({
    name: 'Heights Token',
    symbol: 'HTK'
  });
  
  useEffect(() => {
    const fetchTokenDetails = async () => {
      if (isConnected) {
        const details = await getTokenDetails();
        if (details) {
          setTokenInfo(details);
        }
      }
    };
    
    fetchTokenDetails();
  }, [isConnected, getTokenDetails]);
  
  const networkName = chainId ? (NETWORK_NAMES[chainId] || `Chain ID: ${chainId}`) : '';

  return (
    <header className="app-header">
      <div className="logo-container">
        <h1>{tokenInfo.name} ({tokenInfo.symbol})</h1>
      </div>
      
      <div className="wallet-info">
        {isConnected ? (
          <>
            <div className="account-info">
              <div className="network-badge">{networkName}</div>
              <div className="address">{shortenAddress(account)}</div>
            </div>
            <button className="disconnect-button" onClick={disconnectWallet}>
              Disconnect
            </button>
          </>
        ) : (
          <button className="connect-button" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;