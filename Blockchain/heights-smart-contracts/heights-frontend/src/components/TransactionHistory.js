import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { Web3Context } from '../context/Web3Context';
import { shortenAddress, formatTxLink } from '../utils/web3Utils';

function TransactionHistory() {
  const { contract, account, isConnected, chainId, provider } = useContext(Web3Context);
  const [transfers, setTransfers] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('transfers');

  useEffect(() => {
    if (isConnected && contract && account) {
      fetchEvents();
    }
  }, [isConnected, contract, account]);

  const fetchEvents = async () => {
    if (!contract || !provider) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Get current block number
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Look back ~10000 blocks
      
      // Create filter for Transfer events where the user is sender or recipient
      const transferFilter = contract.filters.Transfer(account, null);
      const transferFilterTo = contract.filters.Transfer(null, account);
      
      // Create filter for Approval events where the user is the owner
      const approvalFilter = contract.filters.Approval(account, null);
      
      // Query the events
      const [sentTransfers, receivedTransfers, approvalEvents] = await Promise.all([
        contract.queryFilter(transferFilter, fromBlock, 'latest'),
        contract.queryFilter(transferFilterTo, fromBlock, 'latest'),
        contract.queryFilter(approvalFilter, fromBlock, 'latest')
      ]);
      
      // Process Transfer events
      const allTransfers = [...sentTransfers, ...receivedTransfers].map(event => {
        const { from, to, value } = event.args;
        const isReceived = to.toLowerCase() === account.toLowerCase();
        
        return {
          type: isReceived ? 'Received' : 'Sent',
          from: from,
          to: to,
          value: ethers.formatUnits(value, 18),
          timestamp: 'Pending...',
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        };
      });
      
      // Process Approval events
      const allApprovals = approvalEvents.map(event => {
        const { owner, spender, value } = event.args;
        
        return {
          owner: owner,
          spender: spender,
          value: ethers.formatUnits(value, 18),
          timestamp: 'Pending...',
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        };
      });
      
      // Sort events by block number (descending)
      allTransfers.sort((a, b) => b.blockNumber - a.blockNumber);
      allApprovals.sort((a, b) => b.blockNumber - a.blockNumber);
      
      // Get block timestamps
      const uniqueBlocks = new Set([
        ...allTransfers.map(tx => tx.blockNumber),
        ...allApprovals.map(tx => tx.blockNumber)
      ]);
      
      const blockPromises = Array.from(uniqueBlocks).map(blockNumber => 
        provider.getBlock(blockNumber)
      );
      
      const blocks = await Promise.all(blockPromises);
      const blockTimestamps = {};
      
      blocks.forEach(block => {
        if (block) {
          blockTimestamps[block.number] = new Date(block.timestamp * 1000);
        }
      });
      
      // Add timestamps to events
      allTransfers.forEach(tx => {
        if (blockTimestamps[tx.blockNumber]) {
          tx.timestamp = blockTimestamps[tx.blockNumber].toLocaleString();
        }
      });
      
      allApprovals.forEach(tx => {
        if (blockTimestamps[tx.blockNumber]) {
          tx.timestamp = blockTimestamps[tx.blockNumber].toLocaleString();
        }
      });
      
      setTransfers(allTransfers);
      setApprovals(allApprovals);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load transaction history');
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="history-container">
        <div className="card">
          <h2>Transaction History</h2>
          <p>Please connect your wallet to view your transaction history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="card">
        <h2>Transaction History</h2>
        
        <div className="history-tabs">
          <button 
            className={activeTab === 'transfers' ? 'active' : ''}
            onClick={() => setActiveTab('transfers')}
          >
            Transfers
          </button>
          <button 
            className={activeTab === 'approvals' ? 'active' : ''}
            onClick={() => setActiveTab('approvals')}
          >
            Approvals
          </button>
        </div>
        
        {loading ? (
          <div className="loading-spinner">Loading transactions...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            {activeTab === 'transfers' && (
              <div className="transfers-table">
                {transfers.length === 0 ? (
                  <p>No transfer transactions found.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Amount</th>
                        <th>Time</th>
                        <th>Tx</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((tx, index) => (
                        <tr key={index} className={tx.type === 'Received' ? 'received' : 'sent'}>
                          <td>{tx.type}</td>
                          <td>{shortenAddress(tx.from)}</td>
                          <td>{shortenAddress(tx.to)}</td>
                          <td>{parseFloat(tx.value).toFixed(4)} HTK</td>
                          <td>{tx.timestamp}</td>
                          <td>
                            <a 
                              href={formatTxLink(tx.txHash, chainId)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="tx-link"
                            >
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            
            {activeTab === 'approvals' && (
              <div className="approvals-table">
                {approvals.length === 0 ? (
                  <p>No approval transactions found.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Spender</th>
                        <th>Amount</th>
                        <th>Time</th>
                        <th>Tx</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvals.map((tx, index) => (
                        <tr key={index}>
                          <td>{shortenAddress(tx.spender)}</td>
                          <td>{parseFloat(tx.value).toFixed(4)} HTK</td>
                          <td>{tx.timestamp}</td>
                          <td>
                            <a 
                              href={formatTxLink(tx.txHash, chainId)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="tx-link"
                            >
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
        
        <div className="refresh-container">
          <button 
            onClick={fetchEvents} 
            disabled={loading}
            className="refresh-button"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransactionHistory;